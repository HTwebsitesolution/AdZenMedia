# AdZenMedia — PRD

## Original problem statement
Build AdZenMedia (adzenmedia.com) as a working agency business platform for founder Joseph Afolabi: founder-led digital systems partner for US & Canadian service businesses (commercial field service first). Homepage, Solutions hub, 4 offer pages, field-service sector page, Work + case-study template (drafts hidden), About, Quote Wizard, Business Systems Check, Contact, Privacy draft. Integrations: Retell AI browser call, WhatsApp, Resend, Formspree, calendar link. Private founder dashboard with stages New → Contacted → Qualified → Proposal Sent → Won/Lost, reports by source/country, CSV, manual entry. SEO, launch plan, outreach drafts, scorecard, domain/migration checklist, README + env example. Paid services, live comms, publication and DNS stay off until approved.

## Decisions (user skipped questions → defaults)
- Auth: Emergent-managed Clerk; admin = ADMIN_EMAIL (htwebsitesolution@gmail.com), verified email only.
- Budget: no ranges until owner sets BUDGET_RANGES_JSON; "Not sure yet"/"Prefer to discuss" always.
- Founder location hidden until FOUNDER_LOCATION set.
- Email: Emergent-managed Resend, EMAIL_MODE=test (all mail → delivered@resend.dev).

## Architecture
FastAPI (core, catalog, leads, notify, voice, admin, auth_admin, content) + MongoDB; React + Tailwind + shadcn. Email outbox worker in-process. Docs in /app/docs.

## Implemented (2026-06)
- Public site (all pages), SEO meta/canonical/noindex on non-canonical hosts, sitemap, robots
- Quote Wizard with shared branching rules, review/edit, session persistence, idempotent retry, honeypot, rate limits
- Short contact form, Systems Check (rules engine → carries into wizard)
- Contact channels hidden until configured; Retell voice component with consent + fallbacks
- Retell webhook: raw-body HMAC, idempotent by event+call_id, no transcript stored (pytest)
- Resend outbox with retries/429 backoff; Formspree forwarding with no blind retry
- Founder dashboard: leads, filters, overdue, detail (stage, next action, follow-up, notes, conversations, qualification, proposal, booking confirm, link contacts, delivery status), manual entry, CSV, reports, integrations status, draft case studies, delete samples

## Revision 2 (2026-06): multi-service agency
- Repositioned as a founder-led digital, marketing and AI agency for businesses in the US and Canada, across industries. Nav: Services, Work, About, Systems check, Contact
- 8 service pages under /services (Website, Social & Video, Meta Ads, Meta Lead Gen + AI Follow-up, AI Automation, AI Booking, Custom Software, AI Training & BD). Old /solutions and /industries URLs redirect
- New look: graphite, warm white and blue; Bricolage Grotesque + Instrument Sans. Three.js hero (heroScene.js) with Web/Marketing/AI modes; SVG poster fallback for reduced motion, no WebGL or slow devices
- Interactive Meta lead → AI follow-up → booked walkthrough using labeled sample data
- Quote Wizard: pick several services, questions grouped by service. Backend stores `services[]` and `answers.by_service`; older leads are kept and the service filter still finds them
- Contact page in preview lists the channels still waiting for owner setup
- Evidence screenshots saved in /app/docs/evidence

## Revision 3 (2026-06): hero artwork depth experiment (awaiting owner review)
- Checkpoint before the change: git tag `checkpoint-before-hero-depth` (fad1573)
- heroScene.js: the selected object(s) move forward and the rest step back; one eased 0.8s transition per selection; pointer parallax only inside the artwork area and only for a mouse, settling when the pointer leaves; softer backdrop shadows
- HeroPoster.jsx: the selected object is drawn on top with a stronger shadow; reduced motion switches instantly
- Hero.jsx: the pause button's row is reserved, so the hero height doesn't change once the 3D scene loads
- Before/after evidence in /app/docs/evidence/hero-depth
- The Orvante monochrome redesign was NOT done: the specification never arrived, and the same message also approved keeping the current design

## Revision 4 (2026-06): brand logo kit
- Owner's logo kit is in /frontend/public/brand. The header and footer use the horizontal logo (white on dark, charcoal on light, the mark alone under 420px); the favicon is now .ico + .svg
- Logo shown on the 3D browser screen and on the phone ad screen (mark + wordmark), and in the reduced-motion poster
- Before/after hero comparison images in /app/docs/evidence/hero-depth/compare_*.jpg; the hero depth experiment stays live, and checkpoint tag `checkpoint-before-hero-depth` is kept
- Still waiting on: real project screenshots for the 3D screens, and the Orvante specification

## Revision 5 (2026-06): portfolio, hero screens, branded emails, social image
- Captures of 10 public sites saved as /frontend/public/work/<id>-d|m.webp (582KB total)
- Hero screens: the browser shows Inspired by Nicola and the phone shows Pilates Barn with a "DEMO AD" label; the hero caption names what's on screen; the poster uses the same images
- Homepage Selected Work (Nicola, Pilates Barn, D.A. Language Academy, Oakrange website + portal) and a /work Portfolio with 9 projects, Habesha Press and Hana the Hyena cross-linked. Shown only on preview hosts until PORTFOLIO_APPROVED=true in content.js
- Emails: white wordmark PNG header on charcoal with alt-text fallback; the visitor email shows the reference and what happens next; the founder email shows the summary and a dashboard button. APP_URL env sets the base for email assets and links (production: https://adzenmedia.com)
- Fixed: the founder email crashed when a lead had no landing page, and a crashed template now marks the job failed instead of leaving it stuck
- OG image /og-image.jpg (1200x630) plus og/twitter tags with alt text; index.html has static production tags

## Backlog
- P0 (owner inputs): contact details, WhatsApp number, booking link, availability, Retell keys/agent, Formspree form, approved case studies & screenshots, budget ranges, privacy review, domain
- P1: Calendar provider webhook for verified bookings; country pages when demand justifies
- P2: Article/blog section for organic search
