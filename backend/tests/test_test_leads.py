"""Test-lead handling: [TEST] auto-flag, PATCH is_test toggle, reports/CSV exclusion, founder email dashboard link.
Uses the kept owner-visible TEST lead (TEST_REF) and always restores is_test=True. Creates no new /api/leads rows."""
import os
import sys

import pytest
import requests
from dotenv import dotenv_values

sys.path.insert(0, "/app/backend")
from tests.test_adzen_api import BASE_URL, UA, ADMIN_UID, MEMBER_UID, clerk_token  # noqa: E402

TEST_REF = os.environ.get("TEST_LEAD_REF", "AZM-261119-GFPG")


@pytest.fixture(scope="module")
def ah():
    return {"Authorization": f"Bearer {clerk_token(ADMIN_UID)}", **UA}


@pytest.fixture(scope="module")
def lead(ah):
    items = requests.get(f"{BASE_URL}/api/admin/leads", params={"q": TEST_REF}, headers=ah, timeout=20).json()["items"]
    items = [i for i in items if i["reference"] == TEST_REF]
    if not items:
        pytest.skip("kept TEST lead not found")
    yield items[0]
    requests.patch(f"{BASE_URL}/api/admin/leads/{items[0]['id']}", json={"is_test": True}, headers=ah, timeout=20)


def _totals(ah):
    return requests.get(f"{BASE_URL}/api/admin/reports", headers=ah, timeout=20).json()["totals"]


def _csv(ah):
    r = requests.get(f"{BASE_URL}/api/admin/export.csv", headers=ah, timeout=20)
    assert r.status_code == 200
    return r.text


# ---- auto flag from [TEST] marker
def test_auto_flagged(lead):
    assert lead["is_test"] is True


# ---- toggle is_test and verify report/CSV inclusion
def test_toggle_reports_and_csv(ah, lead):
    base = _totals(ah)
    assert TEST_REF not in _csv(ah)
    r = requests.patch(f"{BASE_URL}/api/admin/leads/{lead['id']}", json={"is_test": False}, headers=ah, timeout=20)
    assert r.status_code == 200 and r.json()["lead"]["is_test"] is False
    assert _totals(ah)["leads"] == base["leads"] + 1
    assert TEST_REF in _csv(ah)
    r = requests.patch(f"{BASE_URL}/api/admin/leads/{lead['id']}", json={"is_test": True}, headers=ah, timeout=20)
    assert r.status_code == 200 and r.json()["lead"]["is_test"] is True
    assert _totals(ah) == base
    assert TEST_REF not in _csv(ah)
    g = requests.get(f"{BASE_URL}/api/admin/leads/{lead['id']}", headers=ah, timeout=20).json()
    assert g["lead"]["is_test"] is True


# ---- auth on PATCH
def test_patch_auth(lead):
    assert requests.patch(f"{BASE_URL}/api/admin/leads/{lead['id']}", json={"is_test": False}, headers=UA).status_code == 401
    mh = {"Authorization": f"Bearer {clerk_token(MEMBER_UID)}", **UA}
    assert requests.patch(f"{BASE_URL}/api/admin/leads/{lead['id']}", json={"is_test": False}, headers=mh).status_code == 403


# ---- founder email link = APP_URL + /founder/leads/<id>
def test_founder_email_link(lead):
    import re
    from pymongo import MongoClient
    be = dotenv_values("/app/backend/.env")
    for k in ("APP_URL", "SITE_URL"):
        if be.get(k):
            os.environ.setdefault(k, be[k])
    import notify
    doc = MongoClient(be["MONGO_URL"])[be["DB_NAME"]].leads.find_one({"id": lead["id"]}, {"_id": 0})
    _, html = notify.founder_email(doc)
    m = re.search(r'href="([^"]+)"[^>]*>Open lead in dashboard', html)
    assert m, "dashboard link missing"
    assert m.group(1) == f"{notify.app_url()}/founder/leads/{lead['id']}"
    print("LINK", m.group(1))
