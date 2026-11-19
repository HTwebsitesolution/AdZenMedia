# Helper: print a Clerk sign-in ticket for the founder admin test user (UI sign-in via /sign-in?__clerk_ticket=)
import requests
from dotenv import dotenv_values

be = dotenv_values("/app/backend/.env")
h = {"Authorization": f"Bearer {be['CLERK_SECRET_KEY']}", "User-Agent": "adzen-tests"}
r = requests.post("https://api.clerk.com/v1/sign_in_tokens", json={"user_id": "user_3MIblHk8JfGLhYmUWIYARZDsijo"}, headers=h, timeout=20)
print(r.json()["token"])
