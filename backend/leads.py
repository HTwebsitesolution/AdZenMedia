import asyncio
import secrets
import uuid
from typing import Any, Literal, Optional, Union
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from pymongo.errors import DuplicateKeyError

from catalog import (CHECK_QUESTIONS, COUNTRIES, QUESTIONS, SERVICE_IDS, SERVICE_LABELS, TIMING, budget_ranges,
                     evaluate_check, public_catalog)
from core import db, env, env_int, iso, now, rate_limit
from notify import enqueue_lead_emails, forward_formspree

router = APIRouter(prefix="/api")
STAGES = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"]
CHANNEL_LABELS = {"quote_wizard": "quote request", "contact_form": "contact message",
                  "systems_check": "systems check", "voice_ai": "AI voice call", "whatsapp": "WhatsApp",
                  "phone": "phone call", "email": "email", "calendar": "booked call", "other": "inquiry"}
_REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_reference() -> str:
    return f"AZM-{now():%y%m%d}-" + "".join(secrets.choice(_REF_ALPHABET) for _ in range(4))


class Contact(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: str = Field(min_length=1, max_length=160)
    country: Optional[str] = Field(default=None, max_length=40)
    website: Optional[str] = Field(default=None, max_length=300)
    phone: Optional[str] = Field(default=None, max_length=40)

    @field_validator("name", "company", "country", "website", "phone", mode="before")
    @classmethod
    def strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("country")
    @classmethod
    def country_ok(cls, v):
        if v and v not in COUNTRIES:
            raise ValueError("Choose a country from the list")
        return v or None


class Attribution(BaseModel):
    landing_page: Optional[str] = Field(default=None, max_length=300)
    referrer: Optional[str] = Field(default=None, max_length=300)
    utm_source: Optional[str] = Field(default=None, max_length=100)
    utm_medium: Optional[str] = Field(default=None, max_length=100)
    utm_campaign: Optional[str] = Field(default=None, max_length=100)


class Budget(BaseModel):
    currency: Optional[Literal["USD", "CAD"]] = None
    range: str = Field(max_length=60)


class LeadIn(BaseModel):
    channel: Literal["quote_wizard", "contact_form", "systems_check"]
    idempotency_key: str = Field(min_length=16, max_length=64)
    service: Optional[str] = None
    services: list[str] = Field(default_factory=list, max_length=9)
    goal: Optional[str] = Field(default=None, max_length=2000)
    answers: dict[str, Any] = Field(default_factory=dict)
    timing: Optional[str] = None
    budget: Optional[Budget] = None
    message: Optional[str] = Field(default=None, max_length=4000)
    check_answers: Optional[dict[str, str]] = None
    contact: Contact
    attribution: Attribution = Field(default_factory=Attribution)
    hp: Optional[str] = Field(default=None, max_length=200)
    elapsed_ms: int = 0


def _err(field: str, msg: str):
    raise HTTPException(status_code=422, detail=[{"loc": ["body", *field.split(".")], "msg": msg}])


def _validate_answers(svc: str, ans: dict) -> None:
    allowed = {q["id"]: q for q in QUESTIONS[svc]}
    for k in ans:
        if k not in allowed:
            _err(f"answers.{svc}.{k}", "Unexpected question")
    for q in allowed.values():
        v = ans.get(q["id"])
        empty = v is None or (isinstance(v, str) and not v.strip()) or (isinstance(v, list) and not v)
        if q["required"] and empty:
            _err(f"answers.{svc}.{q['id']}", f"Please answer: {q['label']}")
        if not empty and q["type"] == "select" and v not in q["options"]:
            _err(f"answers.{svc}.{q['id']}", "Choose one of the options")
        if not empty and q["type"] == "multi" and (not isinstance(v, list) or any(x not in q["options"] for x in v)):
            _err(f"answers.{svc}.{q['id']}", "Choose from the options")
        if isinstance(v, str) and len(v) > 2000:
            _err(f"answers.{svc}.{q['id']}", "Please keep this shorter")


def validate_lead(body: LeadIn) -> None:
    if body.channel == "contact_form":
        if not body.message or len(body.message.strip()) < 5:
            _err("message", "Please add a short message")
    if body.service is not None and body.service not in SERVICE_IDS:
        _err("service", "Choose one of the listed services")
    if body.channel == "quote_wizard":
        svcs = body.services
        if not svcs:
            _err("services", "Choose at least one service")
        if len(set(svcs)) != len(svcs) or any(x not in SERVICE_IDS for x in svcs):
            _err("services", "Choose from the listed services")
        if "not_sure" in svcs and len(svcs) > 1:
            _err("services", "Choose services or 'Not sure yet', not both")
        if not body.goal or len(body.goal.strip()) < 5:
            _err("goal", "Tell us briefly what you want to achieve")
        for k in body.answers:
            if k not in svcs or not isinstance(body.answers[k], dict):
                _err(f"answers.{k}", "Unexpected answers")
        for svc in svcs:
            _validate_answers(svc, body.answers.get(svc) or {})

        if body.timing and body.timing not in TIMING:
            _err("timing", "Choose a timing option")
        if body.budget:
            allowed_ranges = ["Not sure yet", "Prefer to discuss"]
            if body.budget.currency:
                allowed_ranges += budget_ranges().get(body.budget.currency, [])
            if body.budget.range not in allowed_ranges:
                _err("budget", "Choose a budget option")
    if body.channel == "systems_check":
        valid = {q["id"]: [o["id"] for o in q["options"]] for q in CHECK_QUESTIONS}
        if not body.check_answers or set(body.check_answers) != set(valid) or any(
                v not in valid[k] for k, v in body.check_answers.items()):
            _err("check_answers", "Complete the systems check first")


def derive_source(a: Attribution) -> str:
    if a.utm_source:
        return a.utm_source.lower()
    host = urlparse(a.referrer or "").hostname or ""
    own = urlparse(env("SITE_URL")).hostname or ""
    if not host or (own and host.endswith(own)):
        return "direct"
    for key in ("google", "bing", "duckduckgo", "linkedin", "facebook", "instagram", "x.com", "twitter"):
        if key in host:
            return key.replace(".com", "")
    return host


def build_brief(body: LeadIn) -> dict:
    rows = []
    headline = ""
    if body.channel == "quote_wizard":
        labels = [SERVICE_LABELS[x] for x in body.services]
        headline = f"{' + '.join(labels)}: {body.goal.strip()[:120]}"
        rows.append({"q": "Services", "a": ", ".join(labels)})
        rows.append({"q": "Goal", "a": body.goal.strip()})
        for svc in body.services:
            ans = body.answers.get(svc) or {}
            for q in QUESTIONS[svc]:
                v = ans.get(q["id"])
                if v:
                    rows.append({"q": f"{SERVICE_LABELS[svc]} · {q['label']}", "section": svc,
                                 "a": ", ".join(v) if isinstance(v, list) else v.strip()})
        rows.append({"q": "Timing", "a": body.timing or "Not given"})
        b = body.budget
        rows.append({"q": "Budget", "a": f"{b.range}{' (' + b.currency + ')' if b.currency else ''}" if b else "Not given"})
    elif body.channel == "systems_check":
        res = evaluate_check(body.check_answers)
        headline = f"Systems check: {res['priority']}"
        rows.append({"q": "Likely priority", "a": res["priority"]})
        rows.append({"q": "Suggested first action", "a": res["action"]})
        for q in CHECK_QUESTIONS:
            label = next((o["label"] for o in q["options"] if o["id"] == body.check_answers.get(q["id"])), "")
            rows.append({"q": q["label"], "a": label})
    else:
        headline = f"Question: {body.message.strip()[:140]}"
        if body.service:
            rows.append({"q": "Service", "a": SERVICE_LABELS[body.service]})
        rows.append({"q": "Message", "a": body.message.strip()})
    text = "\n".join(f"{r['q']}: {r['a']}" for r in rows)
    return {"headline": headline, "rows": rows, "text": text}


async def contact_group_for(email: Optional[str]) -> str:
    if email:
        existing = await db.leads.find_one({"contact.email_lc": email.lower()}, {"contact_group_id": 1})
        if existing:
            return existing["contact_group_id"]
    return str(uuid.uuid4())


async def insert_lead(doc: dict) -> dict:
    """Insert with a unique reference; caller handles idempotency duplicates."""
    for _ in range(5):
        doc["reference"] = new_reference()
        try:
            await db.leads.insert_one(dict(doc))
            return doc
        except DuplicateKeyError as e:
            if "reference" not in str(e):
                raise
    raise HTTPException(status_code=500, detail="Could not allocate a reference")


def base_lead(channel: str, service: Optional[str], contact: dict, brief: dict, **extra) -> dict:
    t = iso()
    c = {k: v for k, v in contact.items() if v}
    if c.get("email"):
        c["email_lc"] = c["email"].lower()
    return {"id": str(uuid.uuid4()), "channel": channel, "channel_label": CHANNEL_LABELS.get(channel, channel),
            "service": service, "service_label": SERVICE_LABELS.get(service, "") if service else "",
            "brief": brief, "contact": c, "stage": "New", "stage_history": [{"stage": "New", "at": t}],
            "notes": [], "conversations": [], "next_action": "Reply to inquiry", "follow_up_date": None,
            "qualification": {"fit": "unknown", "notes": ""},
            "proposal": {"status": "not_started", "notes": ""}, "booking": {"status": "none"},
            "formspree": {"status": "pending"}, "is_sample": False, "project_label": "",
            "created_at": t, "updated_at": t, **extra}


@router.get("/public/config")
async def public_config():
    def on(k):
        return env(k)
    return {
        **public_catalog(),
        "channels": {
            "whatsapp_number": on("WHATSAPP_NUMBER"),
            "whatsapp_call_enabled": bool(on("WHATSAPP_NUMBER")) and on("WHATSAPP_CALL_ENABLED").lower() == "true",
            "phone": on("CONTACT_PHONE"),
            "email": on("CONTACT_EMAIL"),
            "booking_url": on("BOOKING_URL"),
            "availability": on("AVAILABILITY_JSON"),
            "voice_enabled": bool(on("RETELL_API_KEY") and on("RETELL_AGENT_ID"))
            and on("VOICE_ENABLED").lower() == "true",
            "voice_recording_notice": on("VOICE_RECORDING_NOTICE"),
        },
        "founder": {"name": "Joseph Afolabi", "location": on("FOUNDER_LOCATION")},
        "canonical_host": on("CANONICAL_HOST"),
    }


class CheckIn(BaseModel):
    answers: dict[str, str]


@router.post("/public/systems-check")
async def systems_check(body: CheckIn, request: Request):
    await rate_limit(request, "check", 60, 3600)
    valid = {q["id"]: [o["id"] for o in q["options"]] for q in CHECK_QUESTIONS}
    if set(body.answers) != set(valid) or any(v not in valid[k] for k, v in body.answers.items()):
        raise HTTPException(status_code=422, detail="Answer every question")
    return evaluate_check(body.answers)


@router.post("/leads")
async def create_lead(body: LeadIn, request: Request):
    existing = await db.leads.find_one({"idempotency_key": body.idempotency_key}, {"_id": 0, "reference": 1})
    if existing:
        return {"reference": existing["reference"], "duplicate": True}
    if body.hp:  # honeypot filled: pretend success, store nothing
        return {"reference": new_reference(), "duplicate": False}
    if body.elapsed_ms < 1500:
        raise HTTPException(status_code=400, detail="That was very quick. Please review your answers and submit again.")
    await rate_limit(request, "lead", env_int("LEAD_RATE_LIMIT_PER_HOUR", 10), 3600)
    validate_lead(body)
    brief = build_brief(body)
    contact = body.contact.model_dump()
    if body.channel == "quote_wizard":
        services = body.services
    elif body.channel == "systems_check":
        services = [evaluate_check(body.check_answers)["service"]]
    else:
        services = [body.service] if body.service else []
    doc = base_lead(body.channel, services[0] if services else None,
                    contact, brief, idempotency_key=body.idempotency_key, services=services,
                    service_label=", ".join(SERVICE_LABELS[x] for x in services),
                    attribution=body.attribution.model_dump(), source=derive_source(body.attribution),
                    answers={"goal": body.goal, "by_service": body.answers, "timing": body.timing,
                             "budget": body.budget.model_dump() if body.budget else None,
                             "check": body.check_answers},
                    contact_group_id=await contact_group_for(contact["email"]))
    try:
        lead = await insert_lead(doc)
    except DuplicateKeyError:
        existing = await db.leads.find_one({"idempotency_key": body.idempotency_key}, {"_id": 0, "reference": 1})
        return {"reference": existing["reference"], "duplicate": True}
    await db.events.insert_one({"type": "lead_saved", "channel": body.channel, "page": body.attribution.landing_page,
                                "source": lead["source"], "country": contact.get("country"), "at": iso()})
    try:
        await enqueue_lead_emails(lead)
    except Exception:
        pass  # outbox failure never loses the lead; dashboard shows missing status
    asyncio.create_task(forward_formspree(lead["id"]))
    return {"reference": lead["reference"], "duplicate": False}


EVENT_TYPES = {"wizard_start", "check_start", "check_complete", "channel_click", "voice_start", "voice_fallback"}
CHANNELS = {"whatsapp_chat", "whatsapp_call", "phone", "email", "calendar", "voice", "quote_wizard", "contact_form"}


class EventIn(BaseModel):
    type: str
    channel: Optional[str] = None
    page: Optional[str] = Field(default=None, max_length=200)
    source: Optional[str] = Field(default=None, max_length=100)


@router.post("/events", status_code=204)
async def track_event(body: EventIn, request: Request):
    if body.type not in EVENT_TYPES or (body.channel and body.channel not in CHANNELS):
        raise HTTPException(status_code=422, detail="Unknown event")
    await rate_limit(request, "events", 300, 3600)
    page = (body.page or "").split("?")[0]  # never keep query strings
    await db.events.insert_one({"type": body.type, "channel": body.channel, "page": page,
                                "source": (body.source or "direct").lower(), "at": iso()})
