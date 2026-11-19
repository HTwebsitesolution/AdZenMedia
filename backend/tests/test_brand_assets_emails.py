# Iteration 4: OG image / email wordmark assets + branded Resend email rendering (notify.py)
import io
import os
import sys

import pytest
import requests
from dotenv import dotenv_values
from PIL import Image

sys.path.insert(0, "/app/backend")
BASE_URL = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")


# Static brand assets
def test_og_image_jpeg_1200x630():
    r = requests.get(f"{BASE_URL}/og-image.jpg", timeout=20)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/jpeg")
    im = Image.open(io.BytesIO(r.content))
    assert im.format == "JPEG" and im.size == (1200, 630)


def test_email_wordmark_png():
    r = requests.get(f"{BASE_URL}/brand/email-wordmark-white.png", timeout=20)
    assert r.status_code == 200
    assert Image.open(io.BytesIO(r.content)).format == "PNG"


@pytest.mark.parametrize("pid", ["nicola", "pilates", "dala", "oakrange", "portal", "lakeside", "boilable", "habesha", "hana", "anto"])
def test_work_screens(pid):
    for v in ("d", "m"):
        r = requests.get(f"{BASE_URL}/work/{pid}-{v}.webp", timeout=20)
        assert r.status_code == 200 and r.headers["content-type"].startswith("image/webp")


# Email rendering (no sending)
@pytest.fixture(scope="module")
def notify():
    for k, v in dotenv_values("/app/backend/.env").items():
        os.environ.setdefault(k, v or "")
    import notify as n
    return n


LEAD = {"id": "lead-123", "reference": "AZM-TEST-0001", "channel": "quote_wizard", "channel_label": "quote request",
        "contact": {"name": "TEST Jane <b>Doe</b>", "email": "jane+clerk_test@example.com", "company": "TEST Co", "phone": "", "country": "US"},
        "brief": {"headline": "Website <script>", "rows": [{"q": "Services", "a": "Website Design & Development"}]},
        "source": "direct", "attribution": {"landing_page": "/"}}


def test_founder_email(notify):
    subj, html = notify.founder_email(LEAD)
    assert "AZM-TEST-0001" in subj
    assert "/brand/email-wordmark-white.png" in html
    assert f"{notify.app_url()}/founder/leads/lead-123" in html
    assert "Open lead in dashboard" in html
    assert "<script>" not in html and "&lt;b&gt;" in html
    notify._assert_safe_email(subj, html)


def test_visitor_email(notify):
    subj, html = notify.visitor_email(LEAD)
    assert "AZM-TEST-0001" in subj and "AZM-TEST-0001" in html
    assert "What happens next" in html
    assert "/founder/leads" not in html
    assert "Hi TEST," in html
    notify._assert_safe_email(subj, html)
