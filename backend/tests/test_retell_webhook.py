"""Retell webhook: signature on raw body, replay idempotency, no transcript storage. Run: cd /app/backend && python -m pytest tests -q"""
import hashlib
import hmac
import json
import os
import time
import uuid

os.environ["RETELL_API_KEY"] = "test_webhook_key"
os.environ["RETELL_AGENT_ID"] = "agent_test"

from fastapi.testclient import TestClient  # noqa: E402

import server  # noqa: E402
from core import db  # noqa: E402

KEY = "test_webhook_key"


def sign(raw: str) -> str:
    ts = str(int(time.time() * 1000))
    return f"v={ts},d={hmac.new(KEY.encode(), (raw + ts).encode(), hashlib.sha256).hexdigest()}"


def payload(call_id: str) -> str:
    return json.dumps({"event": "call_analyzed", "call": {
        "call_id": call_id, "agent_id": "agent_test", "duration_ms": 61000, "transcript": "SECRET TRANSCRIPT",
        "metadata": {"page": "/contact"},
        "call_analysis": {"call_summary": "Wants a portal", "custom_analysis_data": {
            "caller_name": "Webhook Tester", "caller_email": "hook@example.com", "company": "Hook Co",
            "service_interest": "portal", "needs_summary": "Customer portal for 30 sites", "follow_up_consent": True,
            "country": "Canada"}}}})


def test_replay_creates_one_record():
    with TestClient(server.app) as c:
        call_id = f"call_{uuid.uuid4().hex}"
        raw = payload(call_id)
        for _ in range(3):
            r = c.post("/api/webhooks/retell", content=raw, headers={"x-retell-signature": sign(raw),
                                                                     "content-type": "application/json"})
            assert r.status_code == 204
        bad = c.post("/api/webhooks/retell", content=raw, headers={"x-retell-signature": "v=1,d=bad"})
        assert bad.status_code == 401
        tampered = raw.replace("30 sites", "31 sites")
        assert c.post("/api/webhooks/retell", content=tampered,
                      headers={"x-retell-signature": sign(raw)}).status_code == 401

        async def check():
            n = await db.leads.count_documents({"retell_call_id": call_id})
            doc = await db.leads.find_one({"retell_call_id": call_id}, {"_id": 0})
            await db.leads.delete_many({"retell_call_id": call_id})
            return n, doc
        n, doc = c.portal.call(check)
        assert n == 1
        assert doc["contact"]["email"] == "hook@example.com"
        assert "SECRET TRANSCRIPT" not in json.dumps(doc)
