# Helper: print /api/admin/reports totals and whether a reference appears in export.csv (admin token via Clerk)
import sys
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
be = dotenv_values("/app/backend/.env")
BASE = fe["REACT_APP_BACKEND_URL"].rstrip("/")
UA = {"User-Agent": "adzen-tests"}
h = {"Authorization": f"Bearer {be['CLERK_SECRET_KEY']}", **UA}
s = requests.post("https://api.clerk.com/v1/sessions", json={"user_id": "user_3MIblHk8JfGLhYmUWIYARZDsijo"}, headers=h, timeout=20).json()
tok = requests.post(f"https://api.clerk.com/v1/sessions/{s['id']}/tokens", json={}, headers=h, timeout=20).json()["jwt"]
ah = {"Authorization": f"Bearer {tok}", **UA}
r = requests.get(f"{BASE}/api/admin/reports", headers=ah, timeout=20).json()
print("totals", r.get("totals"))
csv = requests.get(f"{BASE}/api/admin/export.csv", headers=ah, timeout=20).text
print("csv_rows", len(csv.strip().splitlines()) - 1)
for ref in sys.argv[1:]:
    print(ref, "in_csv", ref in csv)
    items = requests.get(f"{BASE}/api/admin/leads", params={"q": ref}, headers=ah, timeout=20).json()["items"]
    for it in items:
        print({k: it.get(k) for k in ("id", "reference", "is_test", "stage", "source")}, it.get("contact", {}).get("country"))
