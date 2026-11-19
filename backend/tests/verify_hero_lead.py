# One-off: verify a UI-created quote lead via admin API, then delete it by id (and its outbox rows).
import sys
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

ref = sys.argv[1]
fe = dotenv_values("/app/frontend/.env")
be = dotenv_values("/app/backend/.env")
BASE = fe["REACT_APP_BACKEND_URL"].rstrip("/")
UA = {"User-Agent": "adzen-tests"}
h = {"Authorization": f"Bearer {be['CLERK_SECRET_KEY']}", **UA}
s = requests.post("https://api.clerk.com/v1/sessions", json={"user_id": "user_3MIblHk8JfGLhYmUWIYARZDsijo"}, headers=h, timeout=20).json()
tok = requests.post(f"https://api.clerk.com/v1/sessions/{s['id']}/tokens", json={}, headers=h, timeout=20).json()["jwt"]
r = requests.get(f"{BASE}/api/admin/leads", params={"q": ref}, headers={"Authorization": f"Bearer {tok}", **UA}, timeout=20)
items = r.json()["items"]
print("status", r.status_code, "found", len(items))
for it in items:
    print({k: it.get(k) for k in ("id", "reference", "services", "status")}, it.get("contact", {}).get("name"))
if "--delete" in sys.argv and items:
    db = MongoClient(be["MONGO_URL"])[be["DB_NAME"]]
    ids = [it["id"] for it in items if it.get("reference") == ref]
    print("deleted leads", db.leads.delete_many({"id": {"$in": ids}}).deleted_count,
          "outbox", db.email_outbox.delete_many({"lead_id": {"$in": ids}}).deleted_count)
