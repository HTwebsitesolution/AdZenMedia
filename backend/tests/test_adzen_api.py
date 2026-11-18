"""AdZenMedia API regression: leads, idempotency, auth roles, admin CRUD, outbox, reports, voice, content."""
import os
import time
import uuid

import pytest
import requests
from dotenv import dotenv_values

_FE = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _FE.get("REACT_APP_BACKEND_URL")).rstrip("/")
_SECRET = dotenv_values("/app/backend/.env").get("CLERK_SECRET_KEY")
ADMIN_UID = "user_3MIblHk8JfGLhYmUWIYARZDsijo"
MEMBER_UID = "user_3MIblM6ne6iwKJ45ISti4tJO4Zp"
UA = {"User-Agent": "adzen-tests"}
CREATED = []  # lead ids created by this module (manual admin leads too)


def clerk_token(uid):
    h = {"Authorization": f"Bearer {_SECRET}", **UA}
    s = requests.post("https://api.clerk.com/v1/sessions", json={"user_id": uid}, headers=h, timeout=20)
    if s.status_code >= 300:
        pytest.skip(f"Clerk session create failed {s.status_code}")
    t = requests.post(f"https://api.clerk.com/v1/sessions/{s.json()['id']}/tokens", json={}, headers=h, timeout=20)
    return t.json()["jwt"]


@pytest.fixture
def admin_h():
    return {"Authorization": f"Bearer {clerk_token(ADMIN_UID)}", **UA}


@pytest.fixture
def member_h():
    return {"Authorization": f"Bearer {clerk_token(MEMBER_UID)}", **UA}


def quote_payload(**kw):
    p = {"channel": "quote_wizard", "idempotency_key": uuid.uuid4().hex, "service": "automation",
         "goal": "TEST_ Make quote follow-up consistent",
         "answers": {"workflow": "Quote follow-up", "current_process": "Office manager emails manually"},
         "timing": "Within 1–3 months",
         "contact": {"name": "TEST_ Wizard", "email": "test_wiz@example.com", "company": "TEST_ Co",
                     "country": "Canada"},
         "attribution": {"landing_page": "/quote", "utm_source": "TEST_src"}, "elapsed_ms": 4000}
    p.update(kw)
    return p


# ---------- public lead intake ----------
class TestLeads:
    def test_public_config(self):
        r = requests.get(f"{BASE_URL}/api/public/config", headers=UA)
        assert r.status_code == 200
        d = r.json()
        assert set(q["id"] for q in d["questions"]["automation"]) == {"workflow", "current_process", "volume"}
        assert d["channels"]["voice_enabled"] is False

    def test_idempotent_quote(self, admin_h):
        p = quote_payload()
        r1 = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r1.status_code == 200, r1.text
        ref = r1.json()["reference"]
        assert r1.json()["duplicate"] is False
        import re
        assert re.fullmatch(r"AZM-\d{6}-[A-Z2-9]{4}", ref)
        r2 = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r2.json() == {"reference": ref, "duplicate": True}
        items = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": ref}, headers=admin_h).json()["items"]
        assert len(items) == 1
        CREATED.append(items[0]["id"])
        lid = items[0]["id"]
        time.sleep(12)  # outbox worker + formspree
        d = requests.get(f"{BASE_URL}/api/admin/leads/{lid}", headers=admin_h).json()
        kinds = {e["kind"]: e["status"] for e in d["emails"]}
        print("emails", kinds, "formspree", d["lead"]["formspree"])
        assert "visitor_acknowledgment" in kinds and "founder_notification" in kinds
        assert all(s == "sent" for s in kinds.values())
        assert all(e.get("sent_to") == "delivered@resend.dev" for e in d["emails"])
        assert d["lead"]["formspree"]["status"] == "disabled"
        assert d["lead"]["source"] == "test_src"

    def test_fast_submit_rejected(self):
        r = requests.post(f"{BASE_URL}/api/leads", json=quote_payload(elapsed_ms=200), headers=UA)
        assert r.status_code == 400

    def test_wrong_branch_answer_rejected(self):
        r = requests.post(f"{BASE_URL}/api/leads", json=quote_payload(
            answers={"portal_users": ["Our customers"], "workflow": "Quote follow-up",
                     "current_process": "x"}), headers=UA)
        assert r.status_code == 422

    def test_missing_required_contact(self):
        p = quote_payload()
        p["contact"] = {"name": "TEST_ X", "email": "bad", "company": ""}
        assert requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA).status_code == 422

    def test_contact_form(self, admin_h):
        p = {"channel": "contact_form", "idempotency_key": uuid.uuid4().hex, "message": "TEST_ quick question here",
             "contact": {"name": "TEST_ Contact", "email": "test_c@example.com", "company": "TEST_ C"},
             "elapsed_ms": 3000}
        r = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r.status_code == 200
        it = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": r.json()["reference"]},
                          headers=admin_h).json()["items"]
        CREATED.append(it[0]["id"])
        assert it[0]["channel"] == "contact_form"
        p2 = {**p, "idempotency_key": uuid.uuid4().hex, "message": ""}
        assert requests.post(f"{BASE_URL}/api/leads", json=p2, headers=UA).status_code == 422

    def test_systems_check_and_lead(self, admin_h):
        ans = {"inquiries": "form", "followup": "rarely", "documents": "rarely", "sites": "no", "ai": "regular"}
        r = requests.post(f"{BASE_URL}/api/public/systems-check", json={"answers": ans}, headers=UA)
        assert r.status_code == 200 and r.json()["service"] == "automation"
        p = {"channel": "systems_check", "idempotency_key": uuid.uuid4().hex, "check_answers": ans,
             "contact": {"name": "TEST_ Check", "email": "test_chk@example.com", "company": "TEST_ K"},
             "elapsed_ms": 3000}
        lr = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert lr.status_code == 200
        it = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": lr.json()["reference"]},
                          headers=admin_h).json()["items"]
        CREATED.append(it[0]["id"])
        assert it[0]["service"] == "automation" and it[0]["channel"] == "systems_check"


# ---------- auth / roles ----------
class TestAuth:
    @pytest.mark.parametrize("path", ["/api/admin/leads", "/api/admin/reports", "/api/admin/export.csv", "/api/me"])
    def test_no_token_401(self, path):
        assert requests.get(f"{BASE_URL}{path}", headers=UA).status_code == 401

    def test_member_403(self, member_h):
        assert requests.get(f"{BASE_URL}/api/me", headers=member_h).json()["role"] == "member"
        for p in ["/api/admin/leads", "/api/admin/reports", "/api/admin/export.csv"]:
            assert requests.get(f"{BASE_URL}{p}", headers=member_h).status_code == 403

    def test_admin_200(self, admin_h):
        assert requests.get(f"{BASE_URL}/api/me", headers=admin_h).json()["role"] == "admin"
        for p in ["/api/admin/leads", "/api/admin/reports", "/api/admin/export.csv", "/api/admin/integrations"]:
            assert requests.get(f"{BASE_URL}{p}", headers=admin_h).status_code == 200


# ---------- admin workflows ----------
class TestAdmin:
    def test_samples_and_filters(self, admin_h):
        d = requests.get(f"{BASE_URL}/api/admin/leads", headers=admin_h).json()
        samples = [i for i in d["items"] if i.get("is_sample")]
        countries = sorted(i["contact"].get("country") for i in samples)
        print("samples", len(samples), countries, "overdue_count", d["overdue_count"])
        assert countries.count("United States") >= 2 and countries.count("Canada") >= 2
        ca = requests.get(f"{BASE_URL}/api/admin/leads", params={"country": "Canada"}, headers=admin_h).json()
        assert all(i["contact"].get("country") == "Canada" for i in ca["items"])
        st = requests.get(f"{BASE_URL}/api/admin/leads", params={"stage": "New"}, headers=admin_h).json()
        assert all(i["stage"] == "New" for i in st["items"])
        od = requests.get(f"{BASE_URL}/api/admin/leads", params={"overdue": "true"}, headers=admin_h).json()
        assert all(i["overdue"] for i in od["items"]) and len(od["items"]) == d["overdue_count"]

    def test_manual_lead_patch_notes_conv_link(self, admin_h):
        mk = lambda ch, n: requests.post(f"{BASE_URL}/api/admin/leads", headers=admin_h, json={
            "channel": ch, "service": "portal", "summary": f"TEST_ manual {ch}",
            "contact": {"name": n, "phone": "+1 555 0100", "country": "United States"}})
        a, b = mk("phone", "TEST_ Phone"), mk("whatsapp", "TEST_ WA")
        assert a.status_code == 200 and b.status_code == 200, a.text
        aid, bid = a.json()["id"], b.json()["id"]
        CREATED.extend([aid, bid])
        r = requests.patch(f"{BASE_URL}/api/admin/leads/{aid}", headers=admin_h, json={
            "stage": "Qualified", "next_action": "TEST_ send proposal", "follow_up_date": "2020-01-01",
            "booking_status": "confirmed"})
        assert r.status_code == 200
        g = requests.get(f"{BASE_URL}/api/admin/leads/{aid}", headers=admin_h).json()["lead"]
        assert g["stage"] == "Qualified" and g["next_action"] == "TEST_ send proposal"
        assert g["follow_up_date"] == "2020-01-01" and g["booking"]["status"] == "confirmed"
        assert g["conversations"][0]["channel"] == "phone"
        od = requests.get(f"{BASE_URL}/api/admin/leads", params={"overdue": "true"}, headers=admin_h).json()
        assert aid in [i["id"] for i in od["items"]]
        assert requests.patch(f"{BASE_URL}/api/admin/leads/{aid}", headers=admin_h,
                              json={"follow_up_date": "01/01/2020"}).status_code == 422
        n = requests.post(f"{BASE_URL}/api/admin/leads/{aid}/notes", headers=admin_h, json={"text": "TEST_ note"})
        assert n.json()["lead"]["notes"][-1]["text"] == "TEST_ note"
        c = requests.post(f"{BASE_URL}/api/admin/leads/{aid}/conversations", headers=admin_h,
                          json={"channel": "whatsapp", "summary": "TEST_ chat"})
        assert c.json()["lead"]["conversations"][-1]["summary"] == "TEST_ chat"
        lk = requests.post(f"{BASE_URL}/api/admin/leads/{aid}/link", headers=admin_h, json={"target_lead_id": bid})
        assert bid in [x["id"] for x in lk.json()["related"]]
        q = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": "TEST_ manual whatsapp"}, headers=admin_h)
        assert bid in [i["id"] for i in q.json()["items"]]
        assert requests.get(f"{BASE_URL}/api/admin/leads/nope", headers=admin_h).status_code == 404

    def test_csv_reports_integrations(self, admin_h):
        r = requests.get(f"{BASE_URL}/api/admin/export.csv", params={"include_samples": "true"}, headers=admin_h)
        assert r.status_code == 200 and "text/csv" in r.headers["content-type"]
        assert r.text.splitlines()[0].startswith("reference,created_at,channel")
        rep = requests.get(f"{BASE_URL}/api/admin/reports", headers=admin_h).json()
        assert rep["totals"]["leads"] == sum(v["leads"] for v in rep["by_source"].values())
        assert rep["totals"]["leads"] == sum(v["leads"] for v in rep["by_country"].values())
        integ = requests.get(f"{BASE_URL}/api/admin/integrations", headers=admin_h).json()
        print("integrations", integ)
        assert integ["formspree"]["status"] == "not_configured"
        assert integ["retell"]["status"] == "not_configured"


# ---------- voice / content / seo ----------
class TestPublicMisc:
    def test_voice_web_call(self):
        assert requests.post(f"{BASE_URL}/api/voice/web-call", json={"consent": False}, headers=UA).status_code == 400
        assert requests.post(f"{BASE_URL}/api/voice/web-call", json={"consent": True}, headers=UA).status_code == 503

    def test_case_studies_hidden(self):
        r = requests.get(f"{BASE_URL}/api/public/case-studies", headers=UA)
        assert r.status_code == 200 and r.json()["items"] == []
        assert "Oakrange" not in r.text

    def test_sitemap_robots(self):
        s = requests.get(f"{BASE_URL}/sitemap.xml", headers=UA)
        rb = requests.get(f"{BASE_URL}/robots.txt", headers=UA)
        print("sitemap ct", s.headers.get("content-type"), s.text[:200])
        print("robots", rb.text[:300])
        assert s.status_code == 200 and "<urlset" in s.text and "adzenmedia.com" in s.text
        assert "oakrange" not in s.text.lower()
        assert rb.status_code == 200 and "User-agent" in rb.text


@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    if not CREATED:
        return
    from pymongo import MongoClient
    be = dotenv_values("/app/backend/.env")
    db = MongoClient(be["MONGO_URL"])[be["DB_NAME"]]
    db.email_outbox.delete_many({"lead_id": {"$in": CREATED}})
    db.leads.delete_many({"id": {"$in": CREATED}})
