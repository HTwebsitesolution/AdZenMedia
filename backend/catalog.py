"""Single source of truth for service categories, wizard branching and the systems check."""
import json

from core import env

SERVICES = [
    {"id": "website", "label": "Website Design & Development", "offer": "website-design-development",
     "hint": "Business websites, landing pages, redesigns, SEO foundations"},
    {"id": "social_video", "label": "Social Media & Video Editing", "offer": "social-media-video-editing",
     "hint": "Social content, short-form video, editing and campaign creative"},
    {"id": "meta_ads", "label": "Facebook & Instagram Ads", "offer": "facebook-instagram-ads",
     "hint": "Meta campaigns, ad creative, lead generation and measurement"},
    {"id": "meta_leadgen_ai", "label": "Meta Lead Generation + AI Follow-up", "offer": "meta-lead-generation-ai-follow-up",
     "hint": "Ads that capture leads, with AI follow-up and booking"},
    {"id": "ai_automation", "label": "AI Automation & Agents", "offer": "ai-automation-agents",
     "hint": "Connect your tools and automate repetitive work"},
    {"id": "ai_booking", "label": "AI Appointment Booking", "offer": "ai-appointment-booking",
     "hint": "AI receptionist for calls or messages, with calendar booking"},
    {"id": "software", "label": "Custom Software, Portals & SaaS", "offer": "custom-software-portals-saas",
     "hint": "Customer portals, internal tools and bespoke software"},
    {"id": "training", "label": "AI Training & Business Development", "offer": "ai-training-business-development",
     "hint": "Practical AI workshops and adoption support"},
    {"id": "not_sure", "label": "Not sure yet", "offer": None, "hint": "Tell us the goal, we'll suggest a start"},
]
SERVICE_IDS = [s["id"] for s in SERVICES]
LEGACY_LABELS = {"automation": "Workflow automation or AI agent", "portal": "Portal or custom software",
                 "multiple": "Multiple services"}
SERVICE_LABELS = {**LEGACY_LABELS, **{s["id"]: s["label"] for s in SERVICES}}

_TEAM = ["1–5 people", "6–20 people", "21–50 people", "51+ people"]
_GOALS = ["Generate leads", "Book appointments", "Sell products online", "Promote an offer or event", "Build awareness"]
_CALENDARS = ["Google Calendar", "Microsoft Outlook", "Calendly, Acuity or similar", "Industry booking software",
              "No calendar system yet"]


def _q(id, label, type, required, options=None):
    q = {"id": id, "label": label, "type": type, "required": required}
    if options:
        q["options"] = options
    return q


QUESTIONS = {
    "website": [
        _q("existing_site", "Do you have a website today?", "select", True,
           ["Yes, and it works reasonably well", "Yes, but it needs a redesign", "No website yet"]),
        _q("scope", "What do you need?", "select", True,
           ["A landing page", "A business website (5–10 pages)", "A larger site or multiple locations", "Not sure"]),
        _q("inquiry_handling", "How are new inquiries handled now?", "select", False,
           ["Email inbox", "Mostly phone calls", "Form goes into a CRM", "Not really tracked"]),
    ],
    "social_video": [
        _q("content_types", "What kind of content?", "multi", True,
           ["Short-form video (Reels, TikTok, Shorts)", "Long-form video editing", "Repurposing existing footage",
            "Social posts and graphics", "Campaign creative"]),
        _q("content_volume", "How much content per month?", "select", True,
           ["1–4 pieces", "5–12 pieces", "13–30 pieces", "30+ pieces", "Not sure"]),
        _q("footage", "Where does the footage come from?", "select", False,
           ["We film it ourselves", "We need help planning shoots", "We have a library to repurpose"]),
    ],
    "meta_ads": [
        _q("campaign_goal", "What is the campaign goal?", "select", True, _GOALS),
        _q("ads_history", "Have you run Meta ads before?", "select", True,
           ["Never", "Yes, ourselves", "Yes, with an agency", "Running campaigns now"]),
        _q("target_area", "Where are your customers? (cities, regions or countries)", "text", False),
    ],
    "meta_leadgen_ai": [
        _q("campaign_goal", "What should a lead do next?", "select", True,
           ["Book an appointment", "Request a quote", "Get a call back", "Buy or sign up"]),
        _q("lead_response", "How fast do you reply to new leads today?", "select", True,
           ["Within 5 minutes", "Within an hour", "Same day", "Next day or later", "Not tracked"]),
        _q("calendar", "Which calendar should bookings go into?", "select", False, _CALENDARS),
    ],
    "ai_automation": [
        _q("workflow", "Which work would you automate first?", "select", True,
           ["Lead routing", "Inquiry handling", "Quote or proposal follow-up", "Copying data between tools",
            "Reporting", "Something else"]),
        _q("current_process", "How is it done today, and who does it?", "textarea", True),
        _q("tools", "Tools involved (e.g. Gmail, HubSpot, QuickBooks)", "text", False),
    ],
    "ai_booking": [
        _q("booking_channel", "Where do customers ask to book?", "multi", True,
           ["Phone calls", "Website chat", "SMS / text", "WhatsApp", "Facebook or Instagram messages"]),
        _q("calendar_setup", "What calendar or booking system do you use?", "select", True, _CALENDARS),
        _q("handoff", "When should a person take over?", "text", False),
    ],
    "software": [
        _q("software_type", "What are you looking to build?", "select", True,
           ["Customer portal", "Internal tool", "SaaS product", "Integration between systems", "Not sure"]),
        _q("users", "Who will use it?", "multi", False, ["Customers", "Staff", "Field teams", "Partners"]),
        _q("must_do", "What should it let people see or do?", "textarea", True),
    ],
    "training": [
        _q("roles", "Who needs training?", "multi", True,
           ["Owners and managers", "Sales and marketing", "Office and admin", "Operations", "Whole team"]),
        _q("team_size", "How many people?", "select", False, _TEAM),
        _q("format", "Preferred format", "select", False,
           ["On-site workshop", "Remote sessions", "Ongoing adoption support", "Not sure"]),
    ],
    "not_sure": [
        _q("time_sink", "Where does your business lose the most time or leads?", "textarea", True),
    ],
}

TIMING = ["As soon as possible", "Within 1–3 months", "In 3–6 months", "Just exploring", "Not sure yet"]
COUNTRIES = ["United States", "Canada", "Other"]


def budget_ranges() -> dict:
    """Owner-approved ranges only, e.g. BUDGET_RANGES_JSON={"USD":["..."],"CAD":["..."]}."""
    raw = env("BUDGET_RANGES_JSON")
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return {k: v for k, v in data.items() if k in ("USD", "CAD") and isinstance(v, list)}
    except ValueError:
        return {}


CHECK_QUESTIONS = [
    {"id": "inquiries", "label": "How do most new inquiries reach you?",
     "options": [{"id": "form", "label": "Through a website form that we track"},
                 {"id": "phone_email", "label": "Phone calls and scattered emails"},
                 {"id": "referral", "label": "Mostly referrals and word of mouth"}]},
    {"id": "followup", "label": "What happens after you send a quote?",
     "options": [{"id": "consistent", "label": "We follow up on a set schedule"},
                 {"id": "sometimes", "label": "We follow up when someone remembers"},
                 {"id": "rarely", "label": "We rarely follow up or don't track it"}]},
    {"id": "documents", "label": "How often do customers ask your team for documents, updates or status?",
     "options": [{"id": "daily", "label": "Daily"}, {"id": "weekly", "label": "A few times a week"},
                 {"id": "rarely", "label": "Rarely"}]},
    {"id": "sites", "label": "Do you advertise on Facebook or Instagram?",
     "options": [{"id": "yes", "label": "Yes, or we plan to"}, {"id": "no", "label": "No"}]},
    {"id": "ai", "label": "How does your team use AI tools at work today?",
     "options": [{"id": "regular", "label": "Regularly, with agreed ways of working"},
                 {"id": "tried", "label": "A few people have tried them"},
                 {"id": "none", "label": "Not at all yet"}]},
]

CHECK_RESULTS = {
    "automation": {
        "service": "ai_automation",
        "priority": "Make lead and quote follow-up consistent",
        "action": "List every lead and quote from the last 30 days with its status. Mark which ones had no "
                  "follow-up within 2 business days. That list is your baseline for automation.",
    },
    "website": {
        "service": "website",
        "priority": "Capture and track every inquiry in one place",
        "action": "For the next two weeks, log each new inquiry with its source and the time to first reply. "
                  "It shows where inquiries leak before you change the website.",
    },
    "portal": {
        "service": "software",
        "priority": "Give customers self-service access to documents and status",
        "action": "Count the document and status requests your team handles in one week, and note how long "
                  "each takes to answer. That is the case for a customer portal.",
    },
    "training": {
        "service": "training",
        "priority": "Build practical AI skills in the roles that write and answer the most",
        "action": "Pick one recurring writing task, such as quote cover notes or report summaries, and agree on "
                  "what good looks like before anyone uses an AI tool for it.",
    },
}

_ORDER = ["automation", "website", "portal", "training"]


def evaluate_check(answers: dict) -> dict:
    s = {k: 0 for k in _ORDER}
    s["website"] += {"phone_email": 2, "referral": 2}.get(answers.get("inquiries"), 0)
    s["automation"] += {"sometimes": 2, "rarely": 3}.get(answers.get("followup"), 0)
    s["portal"] += {"daily": 3, "weekly": 1}.get(answers.get("documents"), 0)
    s["website"] += 1 if answers.get("sites") == "yes" else 0
    s["training"] += {"none": 2, "tried": 1}.get(answers.get("ai"), 0)
    best = max(_ORDER, key=lambda k: (s[k], -_ORDER.index(k)))
    return {"key": best, **CHECK_RESULTS[best]}


def public_catalog() -> dict:
    return {"services": SERVICES, "questions": QUESTIONS, "timing": TIMING, "countries": COUNTRIES,
            "budget_ranges": budget_ranges(), "check_questions": CHECK_QUESTIONS}
