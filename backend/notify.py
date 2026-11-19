"""Email outbox (Resend via Emergent proxy) and Formspree forwarding. Both run after the lead is saved."""
import asyncio
import ipaddress
import logging
import re
import uuid
from datetime import timedelta
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx
from pymongo.errors import DuplicateKeyError

from core import db, env, iso, now

logger = logging.getLogger("notify")
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
TEST_RECIPIENT = "delivered@resend.dev"
MAX_ATTEMPTS = 5

# ---------- guardrail gate (from playbook, unchanged logic) ----------
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


class EmailError(Exception):
    def __init__(self, msg: str, permanent: bool = False, throttled: bool = False, retry_after: int = 0):
        super().__init__(msg)
        self.permanent = permanent
        self.throttled = throttled
        self.retry_after = retry_after


async def _send(to: str, subject: str, html: str) -> str:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": env("EMAIL_FROM_NAME")}
    if env("EMAIL_REPLY_TO"):
        payload["contact_email"] = env("EMAIL_REPLY_TO")
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": env("EMERGENT_EMAIL_KEY")}, json=payload)
    except httpx.HTTPError as e:
        raise EmailError(f"network: {type(e).__name__}")
    if resp.status_code >= 400:
        try:
            code = resp.json().get("code", "")
        except ValueError:
            code = ""
        try:
            retry_after = int(resp.headers.get("retry-after", "0"))
        except ValueError:
            retry_after = 0
        raise EmailError(f"{resp.status_code} {code}".strip(), permanent=resp.status_code in (400, 422),
                         throttled=resp.status_code == 429, retry_after=retry_after)
    return resp.json().get("id", "")


# ---------- templates (server-side only) ----------
def app_url() -> str:
    return (env("APP_URL") or env("SITE_URL")).rstrip("/")


def _wrap(inner: str) -> str:
    brand = escape(env("EMAIL_FROM_NAME") or "AdZenMedia")
    logo = f"{app_url()}/brand/email-wordmark-white.png"
    header = ('<tr><td style="background:#151619;padding:22px 28px;border-radius:8px 8px 0 0">'
              f'<img src="{escape(logo)}" width="180" height="30" alt="AdZenMedia" '
              'style="display:block;border:0;color:#ffffff;font-family:Arial,sans-serif;font-size:22px;'
              'font-weight:bold;line-height:30px"></td></tr>') if logo.startswith("https://") else ""
    return ('<table role="presentation" width="100%" style="background:#f4f1ea"><tr><td style="padding:24px">'
            '<table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:8px">'
            f'{header}<tr><td style="padding:28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#151619">'
            f'{inner}<p style="font-size:12px;color:#777;margin-top:28px">Sent by {brand}. '
            'We never ask for passwords or payment details by email.</p></td></tr></table></td></tr></table>')


def _brief_rows(lead: dict) -> str:
    rows = "".join(f'<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">{escape(r["q"])}</td>'
                   f'<td style="padding:4px 0">{escape(r["a"])}</td></tr>' for r in lead["brief"].get("rows", []))
    return f'<table role="presentation" style="font-size:14px">{rows}</table>'


def founder_email(lead: dict) -> tuple[str, str]:
    c = lead["contact"]
    site = app_url()
    subject = f"New {lead['channel_label']} · {lead['reference']} · {c.get('company') or c.get('name')}"
    inner = (f'<p style="font-size:13px;color:#2D4BFF;font-weight:bold">{escape(lead["reference"])}</p>'
             f'<h2 style="margin:0 0 12px">{escape(lead["brief"]["headline"])}</h2>'
             f'<p><strong>{escape(c.get("name", ""))}</strong>, {escape(c.get("company", ""))}<br>'
             f'{escape(c.get("email", ""))} {escape(c.get("phone", ""))}<br>{escape(c.get("country", ""))}</p>'
             f'{_brief_rows(lead)}'
             f'<p style="color:#555;font-size:13px">Source: {escape(lead.get("source", ""))} · Landing page: '
             f'{escape(lead.get("attribution", {}).get("landing_page", ""))}</p>'
             + (f'<p style="margin-top:22px"><a href="{escape(site)}/founder/leads/{escape(lead["id"])}" '
                'style="background:#2D4BFF;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;'
                'font-weight:bold;display:inline-block">Open lead in dashboard</a></p>'
                '<p style="font-size:12px;color:#777">Sign-in required. Lead details stay in the dashboard.</p>'
                if site.startswith("https://") else ""))
    return subject, _wrap(inner)


def visitor_email(lead: dict) -> tuple[str, str]:
    c = lead["contact"]
    kind = "quote request" if lead["channel"] == "quote_wizard" else "message"
    subject = f"We received your {kind} ({lead['reference']})"
    inner = (f'<p>Hi {escape(c.get("name", "").split(" ")[0])},</p>'
             f'<p>Thanks for contacting AdZenMedia. Your {kind} is saved.</p>'
             '<p style="margin:18px 0;padding:16px 18px;background:#f4f1ea;border-radius:8px">'
             '<span style="font-size:12px;color:#555;display:block">Your reference</span>'
             f'<strong style="font-size:22px;letter-spacing:1px">{escape(lead["reference"])}</strong></p>'
             '<p style="font-weight:bold;margin-bottom:6px">What happens next</p>'
             '<ol style="margin-top:0;padding-left:20px">'
             '<li>Joseph reviews your request personally.</li>'
             '<li>He replies by email, usually with a few questions or an offer of a short call.</li>'
             '<li>You receive a written scope and quote. Nothing is committed until you agree.</li></ol>'
             '<p>If you reply to this email, keep the reference in the subject line.</p>'
             + ('<p style="font-size:13px;color:#555">This is a request for a scoped quote. No price, delivery date '
                'or commitment has been made yet.</p>' if lead["channel"] == "quote_wizard" else ""))
    return subject, _wrap(inner)


# ---------- outbox ----------
async def enqueue_lead_emails(lead: dict) -> None:
    jobs = []
    if env("OWNER_NOTIFY_EMAIL"):
        jobs.append(("founder_notification", env("OWNER_NOTIFY_EMAIL")))
    if lead["contact"].get("email") and lead["channel"] in ("quote_wizard", "contact_form", "systems_check"):
        jobs.append(("visitor_acknowledgment", lead["contact"]["email"]))
    for kind, to in jobs:
        try:
            await db.email_outbox.insert_one({
                "id": str(uuid.uuid4()), "key": f"{lead['id']}:{kind}", "lead_id": lead["id"], "kind": kind,
                "intended_to": to, "status": "queued", "attempts": 0, "last_error": None, "provider_id": None,
                "mode": "test" if env("EMAIL_MODE", "test") != "live" else "live",
                "next_attempt_at": iso(), "created_at": iso(), "updated_at": iso()})
        except DuplicateKeyError:
            pass


async def _process(job: dict) -> None:
    lead = await db.leads.find_one({"id": job["lead_id"]}, {"_id": 0})
    if not lead:
        await db.email_outbox.update_one({"id": job["id"]}, {"$set": {"status": "failed", "last_error": "lead missing"}})
        return
    subject, html = (founder_email if job["kind"] == "founder_notification" else visitor_email)(lead)
    to = job["intended_to"] if job["mode"] == "live" else TEST_RECIPIENT
    attempts = job["attempts"] + 1
    try:
        pid = await _send(to, subject, html)
        await db.email_outbox.update_one({"id": job["id"]}, {"$set": {
            "status": "sent", "provider_id": pid, "attempts": attempts, "sent_to": to,
            "last_error": None, "updated_at": iso()}})
    except EmailError as e:
        if e.throttled:  # rate limited: wait and retry without using up an attempt
            delay = max(e.retry_after, 60)
            await db.email_outbox.update_one({"id": job["id"]}, {"$set": {
                "status": "retrying", "last_error": str(e)[:300],
                "next_attempt_at": (now() + timedelta(seconds=delay)).isoformat(), "updated_at": iso()}})
            return
        await _fail(job, attempts, e)
    except ValueError as e:
        await _fail(job, attempts, e)


async def _fail(job: dict, attempts: int, e: Exception) -> None:
    permanent = isinstance(e, ValueError) or getattr(e, "permanent", False) or attempts >= MAX_ATTEMPTS
    delay = 30 * (2 ** (attempts - 1))
    await db.email_outbox.update_one({"id": job["id"]}, {"$set": {
        "status": "failed" if permanent else "retrying", "attempts": attempts, "last_error": str(e)[:300],
        "next_attempt_at": (now() + timedelta(seconds=delay)).isoformat(), "updated_at": iso()}})
    logger.warning("email %s %s failed: %s", job["kind"], job["lead_id"], e)


async def email_worker() -> None:
    while True:
        try:
            stale = (now() - timedelta(minutes=5)).isoformat()
            await db.email_outbox.update_many({"status": "sending", "updated_at": {"$lt": stale}},
                                              {"$set": {"status": "retrying"}})
            while True:
                job = await db.email_outbox.find_one_and_update(
                    {"status": {"$in": ["queued", "retrying"]}, "next_attempt_at": {"$lte": iso()}},
                    {"$set": {"status": "sending", "updated_at": iso()}}, projection={"_id": 0})
                if not job:
                    break
                await _process(job)
        except Exception as e:  # keep the worker alive whatever happens
            logger.error("email worker: %s", e)
        await asyncio.sleep(5)


# ---------- Formspree ----------
FORMSPREE_FIELDS = ("reference", "channel", "service", "name", "email", "company", "country", "summary")


def formspree_payload(lead: dict) -> dict:
    c = lead["contact"]
    data = {"reference": lead["reference"], "channel": lead["channel"], "service": lead.get("service_label", ""),
            "name": c.get("name"), "email": c.get("email"), "company": c.get("company"),
            "country": c.get("country"), "summary": lead["brief"].get("text", "")[:3000]}
    out = {k: v for k, v in data.items() if k in FORMSPREE_FIELDS and v}
    out["_subject"] = f"AdZenMedia {lead['reference']}"
    return out


async def forward_formspree(lead_id: str) -> None:
    form_id = env("FORMSPREE_FORM_ID")
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        return
    if not form_id:
        await db.leads.update_one({"id": lead_id}, {"$set": {"formspree": {"status": "disabled", "at": iso()}}})
        return
    claimed = await db.leads.find_one_and_update(
        {"id": lead_id, "formspree.status": {"$in": [None, "pending", "rejected", "resend_requested"]}},
        {"$set": {"formspree.status": "sending", "formspree.at": iso()}})
    if not claimed:
        return
    status, code, err = "unknown", None, None
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as c:
            r = await c.post(f"https://formspree.io/f/{form_id}", json=formspree_payload(lead),
                             headers={"Accept": "application/json"})
        code = r.status_code
        status = "sent" if 200 <= code < 300 else "rejected"
        err = None if status == "sent" else r.text[:200]
    except (httpx.TimeoutException, httpx.NetworkError) as e:
        status, err = "unknown", type(e).__name__
    except Exception as e:
        status, err = "rejected", type(e).__name__
    await db.leads.update_one({"id": lead_id}, {"$set": {"formspree": {
        "status": status, "http_status": code, "error": err, "at": iso()}}})
