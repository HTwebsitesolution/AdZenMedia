# AdZenMedia platform

Marketing site + Quote Wizard + founder lead dashboard for adzenmedia.com.

- **Frontend:** React (CRA + craco), Tailwind, shadcn/ui. `frontend/src`
- **Backend:** FastAPI + MongoDB (Motor). `backend/`
- **Auth:** Emergent-managed Clerk (email/password + Google). Only users whose *verified* email is in `ADMIN_EMAIL` become admin; everyone else is denied on `/api/admin/*`.

## Key flows
| Flow | Where |
|---|---|
| Quote Wizard → `/api/leads` (idempotency key per session, honeypot, min fill time, per-IP rate limit) | `frontend/src/components/quote/QuoteWizard.jsx`, `backend/leads.py` |
| Shared branching rules, service categories, systems-check rules | `backend/catalog.py` (served at `/api/public/config`) |
| Email outbox (Resend via Emergent proxy), idempotent per lead+kind, retries with backoff | `backend/notify.py` |
| Formspree forwarding (after save, allow-listed fields, `unknown` never auto-retried) | `backend/notify.py` |
| Retell browser call + signed webhook | `backend/voice.py`, `frontend/src/components/contact/VoiceAssistant.jsx`, `docs/retell-agent.md` |
| Founder dashboard | `/founder` (leads, detail, reports, system), `backend/admin.py` |
| Draft case studies (never public until `published: True`) | `backend/content.py` |
| Launch plan, outreach drafts, scorecard | `docs/launch-plan.md` |
| Domain, mail DNS, htwebsolution.com migration | `docs/domain-and-migration.md` |

## Environment
See `backend/.env.example`. All secrets live in deployment config (Emergent: Manage → Secrets). Never commit `.env`.
Frontend needs only `REACT_APP_BACKEND_URL`. Channels with an empty variable are hidden on the site.

## Run / test
- Services are supervisor-managed: `sudo supervisorctl restart backend frontend`.
- Webhook test: `cd backend && python -m pytest tests -q`.

## Deployment
1. Delete sample leads (Dashboard → System → Delete sample leads) and set `SEED_SAMPLE_LEADS=false` in production secrets.
2. Set `EMAIL_MODE=live` only after approving live email; in `test` mode every email goes to the provider's test inbox.
3. Publish from Emergent. Clerk production keys are injected automatically.
4. Connect `adzenmedia.com` (see `docs/domain-and-migration.md`).

## Recovery
- **Email failed:** lead is already saved; dashboard → lead → Delivery status → Retry (only failed jobs).
- **Formspree `unknown`:** check the Formspree dashboard first; resend requires confirming it was not received.
- **Backend down:** `tail -n 100 /var/log/supervisor/backend.err.log`; restart backend. The email worker resumes queued jobs.
- **Export:** dashboard → Export CSV. Source code: Emergent → Save to GitHub.
- **Database backup:** `mongodump --uri "$MONGO_URL" --db "$DB_NAME"`; restore with `mongorestore`.
