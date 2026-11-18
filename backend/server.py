import asyncio
import logging
import uuid
from contextlib import suppress
from datetime import date, timedelta

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo import ASCENDING, DESCENDING, IndexModel
from starlette.middleware.cors import CORSMiddleware

from core import client, db, env, env_bool, iso

import admin
import auth_admin
import leads
import voice
from clerk_auth import clerk_router
from content import public_case_studies
from notify import email_worker

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

INDEXES: dict[str, list[IndexModel]] = {
    "leads": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("reference", ASCENDING)], name="reference", unique=True),
        IndexModel([("idempotency_key", ASCENDING)], name="idempotency_key", unique=True,
                   partialFilterExpression={"idempotency_key": {"$type": "string"}}),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
        IndexModel([("contact.email_lc", ASCENDING)], name="email_lc"),
        IndexModel([("contact_group_id", ASCENDING)], name="group"),
        IndexModel([("stage", ASCENDING), ("follow_up_date", ASCENDING)], name="stage_follow"),
    ],
    "email_outbox": [
        IndexModel([("key", ASCENDING)], name="key", unique=True),
        IndexModel([("status", ASCENDING), ("next_attempt_at", ASCENDING)], name="status_next"),
        IndexModel([("lead_id", ASCENDING)], name="lead_id"),
    ],
    "webhook_events": [IndexModel([("event_key", ASCENDING)], name="event_key", unique=True)],
    "voice_calls": [IndexModel([("call_id", ASCENDING)], name="call_id", unique=True)],
    "rate_limits": [IndexModel([("key", ASCENDING)], name="key", unique=True),
                    IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
    "events": [IndexModel([("type", ASCENDING), ("channel", ASCENDING)], name="type_channel")],
    "users": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)


SAMPLES = [
    ("quote_wizard", "portal", "Dana Whitfield", "dana@sample-inspect.example", "Sample Fire & Safety Inspections",
     "United States", "google", "Proposal Sent", "Customers with 40+ sites keep emailing for inspection reports."),
    ("contact_form", "website", "Marc Tremblay", "marc@sample-calib.example", "Sample Calibration Labs",
     "Canada", "linkedin", "Qualified", "Our website does not generate inquiries; most come by phone."),
    ("quote_wizard", "automation", "Priya Shah", "priya@sample-ndt.example", "Sample NDT Services",
     "United States", "referral", "Won", "Quote follow-up is manual and often missed."),
    ("whatsapp", "training", "Liam O'Connor", "liam@sample-elevator.example", "Sample Elevator Testing",
     "Canada", "whatsapp", "New", "Wants AI training for 12 office staff."),
]


async def seed_samples() -> None:
    if not env_bool("SEED_SAMPLE_LEADS") or await db.leads.count_documents({"is_sample": True}):
        return
    for i, (ch, svc, name, email, company, country, source, stage, text) in enumerate(SAMPLES):
        brief = {"headline": f"SAMPLE: {text[:100]}", "rows": [{"q": "Summary", "a": text}], "text": text}
        doc = leads.base_lead(ch, svc, {"name": name, "email": email, "company": company, "country": country},
                              brief, source=source, attribution={"landing_page": "/industries/commercial-field-service"},
                              contact_group_id=str(uuid.uuid4()), idempotency_key=f"sample-{i}-seed-0000000")
        doc.update(is_sample=True, stage=stage, follow_up_date=(date.today() - timedelta(days=2 - i)).isoformat(),
                   formspree={"status": "not_applicable"})
        order = leads.STAGES[: leads.STAGES.index(stage) + 1]
        doc["stage_history"] = [{"stage": s, "at": iso()} for s in order]
        if stage in ("Proposal Sent", "Won"):
            doc["proposal"] = {"status": "sent", "notes": "", "sent_at": iso()}
            doc["booking"] = {"status": "confirmed", "confirmed_by": "founder", "at": iso()}
        await leads.insert_lead(doc)


app = FastAPI(title="AdZenMedia API")


@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc: RequestValidationError):
    errors = [{"loc": list(e["loc"]), "msg": e["msg"].replace("Value error, ", "")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/api/")
async def root():
    return {"service": "AdZenMedia API", "status": "ok"}


@app.get("/api/public/case-studies")
async def case_studies():
    return {"items": public_case_studies()}


app.include_router(leads.router)
app.include_router(voice.router)
app.include_router(admin.router)
app.include_router(auth_admin.router)
app.include_router(clerk_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=env("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await ensure_indexes()
    with suppress(Exception):
        await seed_samples()
    app.state.worker = asyncio.create_task(email_worker())


@app.on_event("shutdown")
async def shutdown():
    app.state.worker.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.worker
    client.close()
