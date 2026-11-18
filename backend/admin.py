import csv
import io
import re
from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field

from auth_admin import require_admin
from catalog import SERVICE_IDS
from content import CASE_STUDIES
from core import db, env, iso
from leads import CHANNEL_LABELS, STAGES, base_lead, contact_group_for, insert_lead
from notify import forward_formspree

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])
ADMIN_CHANNELS = Literal["phone", "whatsapp", "email", "calendar", "other"]


async def _get(lead_id: str) -> dict:
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def _query(q, stage, service, channel, country, source, overdue, include_samples) -> dict:
    f: dict = {}
    if not include_samples:
        f["is_sample"] = {"$ne": True}
    if stage:
        f["stage"] = stage
    if service:
        f["service"] = service
    if channel:
        f["channel"] = channel
    if country:
        f["contact.country"] = country
    if source:
        f["source"] = source
    if overdue:
        f["follow_up_date"] = {"$lt": date.today().isoformat(), "$ne": None}
        f["stage"] = {"$nin": ["Won", "Lost"]}
    if q:
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        f["$or"] = [{"reference": rx}, {"contact.name": rx}, {"contact.email": rx}, {"contact.company": rx},
                    {"brief.text": rx}, {"project_label": rx}]
    return f


@router.get("/leads")
async def list_leads(q: str = "", stage: str = "", service: str = "", channel: str = "", country: str = "",
                     source: str = "", overdue: bool = False, include_samples: bool = True,
                     limit: int = Query(200, le=1000)):
    f = _query(q, stage, service, channel, country, source, overdue, include_samples)
    items = await db.leads.find(f, {"_id": 0, "answers": 0, "idempotency_key": 0}).sort(
        "created_at", -1).to_list(limit)
    today = date.today().isoformat()
    overdue_count = await db.leads.count_documents(
        {**_query("", "", "", "", "", "", True, include_samples)})
    for i in items:
        i["overdue"] = bool(i.get("follow_up_date") and i["follow_up_date"] < today
                            and i["stage"] not in ("Won", "Lost"))
    return {"items": items, "overdue_count": overdue_count, "stages": STAGES}


@router.get("/leads/{lead_id}")
async def get_lead(lead_id: str):
    lead = await _get(lead_id)
    related = await db.leads.find({"contact_group_id": lead["contact_group_id"], "id": {"$ne": lead_id}},
                                  {"_id": 0, "id": 1, "reference": 1, "brief.headline": 1, "stage": 1,
                                   "channel": 1, "created_at": 1, "project_label": 1}).to_list(50)
    emails = await db.email_outbox.find({"lead_id": lead_id}, {"_id": 0}).to_list(10)
    lead.pop("idempotency_key", None)
    return {"lead": lead, "related": related, "emails": emails}


class LeadPatch(BaseModel):
    stage: Optional[Literal["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"]] = None
    next_action: Optional[str] = Field(default=None, max_length=300)
    follow_up_date: Optional[str] = Field(default=None, max_length=10)
    project_label: Optional[str] = Field(default=None, max_length=120)
    qualification: Optional[dict] = None
    proposal: Optional[dict] = None
    booking_status: Optional[Literal["none", "confirmed"]] = None
    country: Optional[Literal["United States", "Canada", "Other", ""]] = None


@router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, body: LeadPatch, admin: dict = Depends(require_admin)):
    lead = await _get(lead_id)
    s: dict = {"updated_at": iso()}
    push: dict = {}
    if body.stage and body.stage != lead["stage"]:
        s["stage"] = body.stage
        push["stage_history"] = {"stage": body.stage, "at": iso()}
    if body.next_action is not None:
        s["next_action"] = body.next_action
    if body.follow_up_date is not None:
        if body.follow_up_date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", body.follow_up_date):
            raise HTTPException(status_code=422, detail="Use YYYY-MM-DD")
        s["follow_up_date"] = body.follow_up_date or None
    if body.project_label is not None:
        s["project_label"] = body.project_label
    if body.qualification is not None:
        s["qualification"] = {"fit": str(body.qualification.get("fit", "unknown"))[:20],
                              "notes": str(body.qualification.get("notes", ""))[:2000]}
    if body.proposal is not None:
        st = body.proposal.get("status", "not_started")
        if st not in ("not_started", "drafting", "sent", "accepted", "declined"):
            raise HTTPException(status_code=422, detail="Invalid proposal status")
        s["proposal"] = {"status": st, "notes": str(body.proposal.get("notes", ""))[:2000],
                         "sent_at": lead.get("proposal", {}).get("sent_at") or (iso() if st == "sent" else None)}
    if body.booking_status:
        s["booking"] = {"status": body.booking_status, "confirmed_by": "founder" if body.booking_status ==
                        "confirmed" else None, "at": iso()}
    if body.country is not None:
        s["contact.country"] = body.country or None
    upd = {"$set": s}
    if push:
        upd["$push"] = push
    await db.leads.update_one({"id": lead_id}, upd)
    return (await get_lead(lead_id))


class NoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


@router.post("/leads/{lead_id}/notes")
async def add_note(lead_id: str, body: NoteIn):
    await _get(lead_id)
    await db.leads.update_one({"id": lead_id}, {"$push": {"notes": {"text": body.text, "at": iso()}},
                                                "$set": {"updated_at": iso()}})
    return (await get_lead(lead_id))


class ConversationIn(BaseModel):
    channel: Literal["whatsapp", "phone", "email", "calendar", "other"]
    summary: str = Field(min_length=1, max_length=4000)
    occurred_at: Optional[str] = Field(default=None, max_length=30)


@router.post("/leads/{lead_id}/conversations")
async def log_conversation(lead_id: str, body: ConversationIn):
    await _get(lead_id)
    entry = {"channel": body.channel, "summary": body.summary, "occurred_at": body.occurred_at or iso(),
             "logged_at": iso()}
    await db.leads.update_one({"id": lead_id}, {"$push": {"conversations": entry}, "$set": {"updated_at": iso()}})
    return (await get_lead(lead_id))


class LinkIn(BaseModel):
    target_lead_id: str


@router.post("/leads/{lead_id}/link")
async def link_contact(lead_id: str, body: LinkIn):
    lead, target = await _get(lead_id), await _get(body.target_lead_id)
    await db.leads.update_many({"contact_group_id": lead["contact_group_id"]},
                               {"$set": {"contact_group_id": target["contact_group_id"]}})
    return (await get_lead(lead_id))


@router.post("/leads/{lead_id}/unlink")
async def unlink_contact(lead_id: str):
    import uuid
    await _get(lead_id)
    await db.leads.update_one({"id": lead_id}, {"$set": {"contact_group_id": str(uuid.uuid4())}})
    return (await get_lead(lead_id))


class ManualContact(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: Optional[EmailStr] = None
    company: Optional[str] = Field(default=None, max_length=160)
    phone: Optional[str] = Field(default=None, max_length=40)
    country: Optional[Literal["United States", "Canada", "Other"]] = None


class ManualLeadIn(BaseModel):
    channel: ADMIN_CHANNELS
    service: Optional[str] = None
    summary: str = Field(min_length=3, max_length=4000)
    contact: ManualContact
    source: Optional[str] = Field(default=None, max_length=80)
    link_to_lead_id: Optional[str] = None


@router.post("/leads")
async def create_manual_lead(body: ManualLeadIn):
    if body.service and body.service not in SERVICE_IDS:
        raise HTTPException(status_code=422, detail="Unknown service")
    c = body.contact.model_dump()
    group = (await _get(body.link_to_lead_id))["contact_group_id"] if body.link_to_lead_id else \
        await contact_group_for(c.get("email"))
    rows = [{"q": "Summary", "a": body.summary}]
    brief = {"headline": f"{CHANNEL_LABELS[body.channel].capitalize()}: {body.summary[:120]}", "rows": rows,
             "text": f"Summary: {body.summary}"}
    doc = base_lead(body.channel, body.service, c, brief, source=(body.source or body.channel).lower(),
                    attribution={}, contact_group_id=group, idempotency_key=None, entered_manually=True)
    doc.pop("idempotency_key")
    doc["formspree"] = {"status": "not_applicable"}
    if body.channel in ("whatsapp", "phone", "email"):
        doc["conversations"] = [{"channel": body.channel, "summary": body.summary, "occurred_at": iso(),
                                 "logged_at": iso()}]
    lead = await insert_lead(doc)
    return {"id": lead["id"], "reference": lead["reference"]}


@router.post("/leads/{lead_id}/emails/{email_id}/retry")
async def retry_email(lead_id: str, email_id: str):
    r = await db.email_outbox.update_one({"id": email_id, "lead_id": lead_id, "status": "failed"},
                                         {"$set": {"status": "retrying", "attempts": 0, "next_attempt_at": iso()}})
    if not r.modified_count:
        raise HTTPException(status_code=409, detail="Only failed emails can be retried")
    return {"ok": True}


class FormspreeResendIn(BaseModel):
    confirmed_not_received: bool = False


@router.post("/leads/{lead_id}/formspree/resend")
async def resend_formspree(lead_id: str, body: FormspreeResendIn):
    lead = await _get(lead_id)
    st = (lead.get("formspree") or {}).get("status")
    if st == "unknown" and not body.confirmed_not_received:
        raise HTTPException(status_code=409, detail="Check the Formspree dashboard first and confirm it was not received")
    if st not in ("rejected", "unknown", "disabled", "pending"):
        raise HTTPException(status_code=409, detail="Already forwarded")
    await db.leads.update_one({"id": lead_id}, {"$set": {"formspree.status": "resend_requested"}})
    await forward_formspree(lead_id)
    return (await get_lead(lead_id))


CSV_COLS = ["reference", "created_at", "channel", "service_label", "stage", "name", "email", "company", "country",
            "phone", "source", "landing_page", "utm_campaign", "next_action", "follow_up_date", "proposal_status",
            "booking_status", "headline", "is_sample"]


@router.get("/export.csv")
async def export_csv(include_samples: bool = False):
    f = {} if include_samples else {"is_sample": {"$ne": True}}
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(CSV_COLS)
    async for d in db.leads.find(f, {"_id": 0}).sort("created_at", -1):
        c, a = d.get("contact", {}), d.get("attribution") or {}
        row = [d.get("reference"), d.get("created_at"), d.get("channel"), d.get("service_label"), d.get("stage"),
               c.get("name"), c.get("email"), c.get("company"), c.get("country"), c.get("phone"), d.get("source"),
               a.get("landing_page"), a.get("utm_campaign"), d.get("next_action"), d.get("follow_up_date"),
               (d.get("proposal") or {}).get("status"), (d.get("booking") or {}).get("status"),
               d.get("brief", {}).get("headline"), d.get("is_sample")]
        w.writerow(["'" + str(v) if isinstance(v, str) and v[:1] in "=+-@" else ("" if v is None else v)
                    for v in row])
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=adzenmedia-leads.csv"})


def _reached(lead: dict, stages: set) -> bool:
    return any(h["stage"] in stages for h in lead.get("stage_history", [])) or lead.get("stage") in stages


@router.get("/reports")
async def reports(include_samples: bool = True):
    f = {} if include_samples else {"is_sample": {"$ne": True}}
    leads = await db.leads.find(f, {"_id": 0, "source": 1, "contact.country": 1, "stage": 1, "stage_history": 1,
                                    "booking": 1, "proposal": 1, "channel": 1}).to_list(10000)

    def blank():
        return {"leads": 0, "qualified": 0, "booked": 0, "proposals": 0, "won": 0}

    by_source, by_country, totals = {}, {}, blank()
    for d in leads:
        flags = {"leads": True,
                 "qualified": _reached(d, {"Qualified", "Proposal Sent", "Won"}),
                 "booked": (d.get("booking") or {}).get("status") == "confirmed",
                 "proposals": _reached(d, {"Proposal Sent", "Won"}) or (d.get("proposal") or {}).get("status") in (
                     "sent", "accepted", "declined"),
                 "won": d.get("stage") == "Won"}
        for bucket, key in ((by_source, d.get("source") or "unknown"),
                            (by_country, (d.get("contact") or {}).get("country") or "Not given")):
            row = bucket.setdefault(key, blank())
            for k, v in flags.items():
                row[k] += int(v)
        for k, v in flags.items():
            totals[k] += int(v)
    pipeline = [{"$group": {"_id": {"type": "$type", "channel": "$channel"}, "n": {"$sum": 1}}}]
    events = [{"type": e["_id"]["type"], "channel": e["_id"].get("channel"), "count": e["n"]}
              async for e in db.events.aggregate(pipeline)]
    return {"totals": totals, "by_source": by_source, "by_country": by_country, "events": events}


@router.get("/integrations")
async def integrations():
    def st(ok):
        return "configured" if ok else "not_configured"
    outbox = {s: await db.email_outbox.count_documents({"status": s}) for s in
              ("queued", "retrying", "sending", "sent", "failed")}
    return {
        "email": {"status": st(env("EMERGENT_EMAIL_KEY")), "mode": env("EMAIL_MODE", "test"),
                  "notify_to": env("OWNER_NOTIFY_EMAIL"), "reply_to": env("EMAIL_REPLY_TO"), "outbox": outbox},
        "formspree": {"status": st(env("FORMSPREE_FORM_ID"))},
        "retell": {"status": st(env("RETELL_API_KEY") and env("RETELL_AGENT_ID")),
                   "enabled": env("VOICE_ENABLED").lower() == "true"},
        "whatsapp": {"status": st(env("WHATSAPP_NUMBER")), "call_enabled": env("WHATSAPP_CALL_ENABLED") == "true"},
        "calendar": {"status": st(env("BOOKING_URL"))},
        "phone": {"status": st(env("CONTACT_PHONE"))},
        "public_email": {"status": st(env("CONTACT_EMAIL"))},
    }


@router.get("/drafts")
async def drafts():
    return {"case_studies": CASE_STUDIES}


@router.delete("/samples")
async def delete_samples():
    ids = [d["id"] async for d in db.leads.find({"is_sample": True}, {"id": 1})]
    await db.email_outbox.delete_many({"lead_id": {"$in": ids}})
    r = await db.leads.delete_many({"is_sample": True})
    return {"deleted": r.deleted_count}
