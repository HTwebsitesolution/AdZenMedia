"""Single source of truth for service categories, wizard branching and the systems check."""
import json

from core import env

SERVICES = [
    {"id": "website", "label": "Website or marketing", "offer": "website-inquiry-system",
     "hint": "Website, landing pages, SEO, lead capture and follow-up"},
    {"id": "automation", "label": "Workflow automation or AI agent", "offer": "workflow-automation-pilot",
     "hint": "Improve one repetitive workflow with automation and human review"},
    {"id": "portal", "label": "Portal or custom software", "offer": "customer-portal-software-discovery",
     "hint": "Customer portals, internal tools, bespoke software or SaaS"},
    {"id": "training", "label": "AI training", "offer": "ai-training-for-teams",
     "hint": "Role-based workshops for your team"},
    {"id": "multiple", "label": "Multiple services", "offer": None, "hint": "A combination of the above"},
    {"id": "not_sure", "label": "Not sure yet", "offer": None, "hint": "Tell us the problem, we'll suggest a start"},
]
SERVICE_IDS = [s["id"] for s in SERVICES]
SERVICE_LABELS = {s["id"]: s["label"] for s in SERVICES}

_TEAM = ["1–5 people", "6–20 people", "21–50 people", "51+ people"]

QUESTIONS = {
    "website": [
        {"id": "existing_site", "label": "Do you have a website today?", "type": "select", "required": True,
         "options": ["Yes, and it works reasonably well", "Yes, but it needs replacing", "No website yet"]},
        {"id": "inquiry_handling", "label": "How are new inquiries handled now?", "type": "select", "required": False,
         "options": ["Shared email inbox", "Mostly phone calls", "Form goes into a CRM", "Not really tracked"]},
        {"id": "focus_areas", "label": "Services, locations or markets the site must cover", "type": "text",
         "required": False},
    ],
    "automation": [
        {"id": "workflow", "label": "Which workflow would you improve first?", "type": "select", "required": True,
         "options": ["Quote follow-up", "Inquiry triage", "Certificate or report retrieval", "Job scheduling or updates",
                     "Internal reporting", "Something else"]},
        {"id": "current_process", "label": "How is it done today, and who does it?", "type": "textarea",
         "required": True},
        {"id": "volume", "label": "Roughly how often does it happen?", "type": "select", "required": False,
         "options": ["Under 20 times a week", "20–100 times a week", "100+ times a week", "Not sure"]},
    ],
    "portal": [
        {"id": "portal_users", "label": "Who will use it?", "type": "multi", "required": True,
         "options": ["Our customers", "Field technicians", "Office staff", "Partners or subcontractors"]},
        {"id": "portal_tasks", "label": "What should they be able to see or do?", "type": "textarea",
         "required": True},
        {"id": "existing_systems", "label": "Systems it needs to connect to", "type": "text", "required": False},
    ],
    "training": [
        {"id": "roles", "label": "Which staff roles need training?", "type": "multi", "required": True,
         "options": ["Office and admin", "Sales and estimating", "Field supervisors", "Management", "Whole team"]},
        {"id": "team_size", "label": "How many people?", "type": "select", "required": False, "options": _TEAM},
        {"id": "tools", "label": "Tools you already use (e.g. Microsoft 365, Google Workspace)", "type": "text",
         "required": False},
    ],
    "multiple": [
        {"id": "services_included", "label": "Which areas are involved?", "type": "multi", "required": True,
         "options": ["Website or marketing", "Workflow automation", "Portal or custom software", "AI training"]},
        {"id": "first_priority", "label": "Which should come first, and why?", "type": "textarea", "required": False},
    ],
    "not_sure": [
        {"id": "time_sink", "label": "Where does your team lose the most time?", "type": "textarea",
         "required": True},
        {"id": "team_size", "label": "How big is your team?", "type": "select", "required": False, "options": _TEAM},
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
    {"id": "documents", "label": "How often do customers ask for certificates, reports or job status?",
     "options": [{"id": "daily", "label": "Daily"}, {"id": "weekly", "label": "A few times a week"},
                 {"id": "rarely", "label": "Rarely"}]},
    {"id": "sites", "label": "Do your customers have multiple sites or locations?",
     "options": [{"id": "yes", "label": "Yes, many of them do"}, {"id": "no", "label": "No, mostly single sites"}]},
    {"id": "ai", "label": "How does your team use AI tools at work today?",
     "options": [{"id": "regular", "label": "Regularly, with agreed ways of working"},
                 {"id": "tried", "label": "A few people have tried them"},
                 {"id": "none", "label": "Not at all yet"}]},
]

CHECK_RESULTS = {
    "automation": {
        "service": "automation",
        "priority": "Make quote follow-up consistent",
        "action": "List every quote sent in the last 30 days with its status. Mark which ones had no follow-up "
                  "within 3 business days. That list is your baseline for an automation pilot.",
    },
    "website": {
        "service": "website",
        "priority": "Capture and track every inquiry in one place",
        "action": "For the next two weeks, log each new inquiry with its source and the time to first reply. "
                  "It shows where inquiries leak before you change the website.",
    },
    "portal": {
        "service": "portal",
        "priority": "Give customers self-service access to certificates, reports and job status",
        "action": "Count the document and status requests your office handles in one week, and note how long "
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
    s["portal"] += 1 if answers.get("sites") == "yes" else 0
    s["training"] += {"none": 2, "tried": 1}.get(answers.get("ai"), 0)
    best = max(_ORDER, key=lambda k: (s[k], -_ORDER.index(k)))
    return {"key": best, **CHECK_RESULTS[best]}


def public_catalog() -> dict:
    return {"services": SERVICES, "questions": QUESTIONS, "timing": TIMING, "countries": COUNTRIES,
            "budget_ranges": budget_ranges(), "check_questions": CHECK_QUESTIONS}
