"""Retell AI browser calls: server-side call creation and signed webhook intake."""
import hashlib
import hmac
import json
import logging
import time

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from catalog import SERVICE_IDS, SERVICE_LABELS
from core import db, env, env_int, iso, rate_limit
from leads import base_lead, contact_group_for, insert_lead

logger = logging.getLogger("voice")
router = APIRouter(prefix="/api")


def _configured() -> bool:
    return bool(env("RETELL_API_KEY") and env("RETELL_AGENT_ID")) and env("VOICE_ENABLED").lower() == "true"


class WebCallIn(BaseModel):
    consent: bool
    page: str | None = None


@router.post("/voice/web-call")
async def create_web_call(body: WebCallIn, request: Request):
    if not body.consent:
        raise HTTPException(status_code=400, detail="Please confirm you understand the call notice first.")
    if not _configured():
        raise HTTPException(status_code=503, detail="The AI assistant is not available right now.")
    await rate_limit(request, "voice", env_int("RETELL_CALLS_PER_HOUR_PER_IP", 3), 3600)
    await rate_limit(request, "voice_global", env_int("RETELL_CALLS_PER_DAY", 50), 86400)
    from retell import Retell
    agent = {"max_call_duration_ms": env_int("RETELL_MAX_CALL_SECONDS", 600) * 1000}
    if env("RETELL_DATA_STORAGE_SETTING"):
        agent["data_storage_setting"] = env("RETELL_DATA_STORAGE_SETTING")
    if env("RETELL_DATA_RETENTION_DAYS"):
        agent["data_storage_retention_days"] = env_int("RETELL_DATA_RETENTION_DAYS", 30)
    try:
        r = Retell(api_key=env("RETELL_API_KEY")).call.create_web_call(
            agent_id=env("RETELL_AGENT_ID"), agent_override={"agent": agent},
            metadata={"source": "website", "page": (body.page or "")[:200]})
    except Exception as e:
        logger.warning("retell create failed: %s", type(e).__name__)
        raise HTTPException(status_code=502, detail="The AI assistant could not start a call.")
    await db.voice_calls.update_one({"call_id": r.call_id}, {"$setOnInsert": {
        "call_id": r.call_id, "status": "created", "created_at": iso()}}, upsert=True)
    return {"call_id": r.call_id, "access_token": r.access_token}


def verify_signature(raw: str, header: str | None, key: str) -> bool:
    if not key or not header:
        return False
    try:
        parts = dict(x.split("=", 1) for x in header.split(","))
        ts, digest = parts["v"], parts["d"]
        if abs(int(time.time() * 1000) - int(ts)) > 5 * 60 * 1000:
            return False
        expected = hmac.new(key.encode(), (raw + ts).encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, digest)
    except (KeyError, ValueError):
        return False


def _truthy(v) -> bool:
    return v is True or str(v).lower() in ("true", "yes", "1")


async def _save_follow_up(call: dict) -> None:
    analysis = call.get("call_analysis") or {}
    data = analysis.get("custom_analysis_data") or {}
    consent = _truthy(data.get("follow_up_consent"))
    service = data.get("service_interest") if data.get("service_interest") in SERVICE_IDS else None
    summary = (data.get("needs_summary") or analysis.get("call_summary") or "").strip()[:1500]
    contact = {"name": (data.get("caller_name") or "AI call visitor")[:120], "company": (data.get("company") or "")[:160]}
    if consent:
        contact.update({"email": (data.get("caller_email") or "")[:200] or None,
                        "phone": (data.get("caller_phone") or "")[:40] or None})
    country = data.get("country")
    if country in ("United States", "Canada", "Other"):
        contact["country"] = country
    rows = [{"q": "Call summary", "a": summary or "No summary"},
            {"q": "Follow-up agreed", "a": "Yes" if consent else "No"}]
    if service:
        rows.insert(0, {"q": "Service", "a": SERVICE_LABELS[service]})
    duration = round((call.get("duration_ms") or 0) / 1000)
    rows.append({"q": "Call length", "a": f"{duration}s"})
    brief = {"headline": f"AI call: {summary[:120] or 'Visitor call'}", "rows": rows,
             "text": "\n".join(f"{r['q']}: {r['a']}" for r in rows)}
    meta = call.get("metadata") or {}
    doc = base_lead("voice_ai", service, contact, brief, idempotency_key=f"retell:{call['call_id']}",
                    attribution={"landing_page": meta.get("page")}, source="ai_voice",
                    retell_call_id=call["call_id"], follow_up_consent=consent,
                    contact_group_id=await contact_group_for(contact.get("email")))
    if not consent:
        doc["next_action"] = "Review call summary (no follow-up requested)"
    try:
        await insert_lead(doc)
    except DuplicateKeyError:
        pass


@router.post("/webhooks/retell", status_code=204)
async def retell_webhook(request: Request):
    raw = (await request.body()).decode("utf-8")
    if not verify_signature(raw, request.headers.get("x-retell-signature"), env("RETELL_API_KEY")):
        raise HTTPException(status_code=401, detail="invalid signature")
    payload = json.loads(raw)
    event, call = payload.get("event"), payload.get("call") or {}
    call_id = call.get("call_id")
    if not event or not call_id:
        raise HTTPException(status_code=400, detail="invalid payload")
    if env("RETELL_AGENT_ID") and call.get("agent_id") and call["agent_id"] != env("RETELL_AGENT_ID"):
        return Response(status_code=204)
    try:
        await db.webhook_events.insert_one({"event_key": f"retell:{event}:{call_id}", "received_at": iso()})
    except DuplicateKeyError:
        return Response(status_code=204)
    # Only minimal metadata is kept: no audio, no transcript.
    await db.voice_calls.update_one({"call_id": call_id}, {"$set": {
        "status": event, "duration_ms": call.get("duration_ms"),
        "disconnection_reason": call.get("disconnection_reason"), "updated_at": iso()}}, upsert=True)
    if event == "call_analyzed":
        await _save_follow_up(call)
    return Response(status_code=204)
