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
    """New multi-service shape: services: [ids], answers: {svc: {qid: value}}."""
    p = {"channel": "quote_wizard", "idempotency_key": uuid.uuid4().hex,
         "services": ["meta_leadgen_ai", "social_video"],
         "goal": "TEST_ Capture more leads from Meta and reply fast",
         "answers": {"meta_leadgen_ai": {"campaign_goal": "Book an appointment", "lead_response": "Same day"},
                     "social_video": {"content_types": ["Short-form video (Reels, TikTok, Shorts)"],
                                      "content_volume": "5–12 pieces"}},
         "timing": "Within 1–3 months",
         "contact": {"name": "TEST_ Wizard", "email": "test_wiz@example.com", "company": "TEST_ Co",
                     "country": "Canada"},
         "attribution": {"landing_page": "/quote", "utm_source": "TEST_src"}, "elapsed_ms": 4000}
    p.update(kw)
    return p


def _loc(r):
    d = r.json()["detail"]
    return ".".join(str(x) for x in d[0]["loc"]) if isinstance(d, list) else str(d)


# ---------- public lead intake (NOTE: /api/leads is rate limited 10/hour/IP incl. 422s) ----------
class TestLeads:
    def test_public_config(self):
        r = requests.get(f"{BASE_URL}/api/public/config", headers=UA)
        assert r.status_code == 200
        d = r.json()
        ids = [s["id"] for s in d["services"]]
        assert len(ids) == 9 and "meta_leadgen_ai" in ids and ids[-1] == "not_sure"
        assert {q["id"] for q in d["questions"]["meta_leadgen_ai"]} == {"campaign_goal", "lead_response", "calendar"}
        assert set(d["questions"]) == set(ids)
        assert d["channels"]["voice_enabled"] is False

    def test_idempotent_multi_service_quote(self, admin_h):
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
        lid = items[0]["id"]
        CREATED.append(lid)
        assert items[0]["services"] == ["meta_leadgen_ai", "social_video"]
        assert items[0]["service_label"] == "Meta Lead Generation + AI Follow-up, Social Media & Video Editing"
        f = requests.get(f"{BASE_URL}/api/admin/leads", params={"service": "meta_leadgen_ai", "q": ref},
                         headers=admin_h).json()["items"]
        assert [i["id"] for i in f] == [lid]
        f2 = requests.get(f"{BASE_URL}/api/admin/leads", params={"service": "social_video"}, headers=admin_h).json()
        assert lid in [i["id"] for i in f2["items"]]
        time.sleep(10)
        d = requests.get(f"{BASE_URL}/api/admin/leads/{lid}", headers=admin_h).json()
        rows = [x["q"] for x in d["lead"]["brief"]["rows"]]
        assert "Meta Lead Generation + AI Follow-up · How fast do you reply to new leads today?" in rows
        assert "Social Media & Video Editing · How much content per month?" in rows
        kinds = {e["kind"]: e["status"] for e in d["emails"]}
        print("emails", kinds)
        assert "visitor_acknowledgment" in kinds and "founder_notification" in kinds
        assert d["lead"]["source"] == "test_src"

    def test_fast_submit_rejected(self):
        r = requests.post(f"{BASE_URL}/api/leads", json=quote_payload(elapsed_ms=200), headers=UA)
        assert r.status_code == 400

    def test_missing_required_answer_loc(self):
        p = quote_payload()
        del p["answers"]["meta_leadgen_ai"]["lead_response"]
        r = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r.status_code == 422 and _loc(r) == "body.answers.meta_leadgen_ai.lead_response", r.text

    def test_not_sure_with_others_rejected(self):
        p = quote_payload(services=["not_sure", "website"], answers={})
        r = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r.status_code == 422 and _loc(r) == "body.services", r.text

    def test_answers_for_unselected_service_rejected(self):
        p = quote_payload(services=["meta_leadgen_ai"])
        r = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r.status_code == 422 and _loc(r) == "body.answers.social_video", r.text

    def test_missing_required_contact(self):
        p = quote_payload()
        p["contact"] = {"name": "TEST_ X", "email": "bad", "company": ""}
        assert requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA).status_code == 422

    def test_contact_form(self, admin_h):
        p = {"channel": "contact_form", "idempotency_key": uuid.uuid4().hex, "message": "TEST_ quick question here",
             "contact": {"name": "TEST_ Contact", "email": "test_c@example.com", "company": "TEST_ C"},
             "elapsed_ms": 3000}
        r = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert r.status_code == 200, r.text
        it = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": r.json()["reference"]},
                          headers=admin_h).json()["items"]
        CREATED.append(it[0]["id"])
        assert it[0]["channel"] == "contact_form"

    def test_systems_check_and_lead(self, admin_h):
        ans = {"inquiries": "form", "followup": "rarely", "documents": "rarely", "sites": "no", "ai": "regular"}
        r = requests.post(f"{BASE_URL}/api/public/systems-check", json={"answers": ans}, headers=UA)
        assert r.status_code == 200 and r.json()["service"] == "ai_automation"
        p = {"channel": "systems_check", "idempotency_key": uuid.uuid4().hex, "check_answers": ans,
             "contact": {"name": "TEST_ Check", "email": "test_chk@example.com", "company": "TEST_ K"},
             "elapsed_ms": 3000}
        lr = requests.post(f"{BASE_URL}/api/leads", json=p, headers=UA)
        assert lr.status_code == 200, lr.text
        it = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": lr.json()["reference"]},
                          headers=admin_h).json()["items"]
        CREATED.append(it[0]["id"])
        assert it[0]["service"] == "ai_automation" and it[0]["channel"] == "systems_check"

    def test_legacy_leads_still_open(self, admin_h):
        d = requests.get(f"{BASE_URL}/api/admin/leads", params={"include_samples": "true"}, headers=admin_h).json()
        legacy = [i for i in d["items"] if i.get("service") in ("portal", "automation") or not i.get("services")]
        assert legacy, "expected legacy single-service leads"
        for i in legacy:
            g = requests.get(f"{BASE_URL}/api/admin/leads/{i['id']}", headers=admin_h)
            assert g.status_code == 200, (i["reference"], g.text)


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
            "channel": ch, "service": "software", "summary": f"TEST_ manual {ch}",
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
