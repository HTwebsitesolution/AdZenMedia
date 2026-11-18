"""Draft case studies. Nothing here is public until `published` is True and the client has approved."""

CASE_STUDIES = [
    {
        "slug": "oakrange-customer-portal",
        "published": False,
        "client": "Oakrange",
        "client_display_public": "A UK inspection and testing provider",
        "context": "United Kingdom",
        "title": "A customer portal that ends the certificate chase",
        "service": "portal",
        "summary": "Customers with many sites needed one place to find inspection records instead of emailing the office.",
        "prior_process": "[Owner to confirm] How customers requested reports and certificates before the portal, "
                         "who in the office handled those requests, and roughly how long each took.",
        "delivered": "[Owner to confirm] Portal scope as delivered: customer logins, site and asset views, "
                     "document downloads, and any integrations with the job management system.",
        "verified_outcome": "[Owner to confirm with client] One measured outcome with its source, for example the "
                            "change in document requests handled by staff per month.",
        "lessons": "Multi-site customers judge a provider partly on how quickly they can prove compliance. Giving "
                   "them direct, permissioned access to their own records removes a recurring office task and makes "
                   "the provider easier to keep.",
        "screenshots": [],
        "quote": None,
        "approval": {"client_name": False, "logo": False, "quote": False, "screenshots": False},
    },
    {
        "slug": "qr-certificate-verification",
        "published": False,
        "client": "[Owner to confirm client name]",
        "client_display_public": "A UK testing and certification business",
        "context": "United Kingdom",
        "title": "QR codes that let anyone verify a certificate on the spot",
        "service": "automation",
        "summary": "Each issued certificate carries a QR code that opens a live verification page.",
        "prior_process": "[Owner to confirm] How third parties checked whether a certificate was genuine and current "
                         "before QR verification, and the volume of those checks.",
        "delivered": "[Owner to confirm] QR generation at issue time, a public verification page showing status "
                     "and expiry, and the admin workflow for revoking or reissuing.",
        "verified_outcome": "[Owner to confirm with client] One verified outcome, for example fewer verification "
                            "calls or faster site access for technicians.",
        "lessons": "Any business that issues certificates, reports or compliance documents can cut verification "
                   "calls by letting the document prove itself. The same pattern works for calibration labs, "
                   "inspection firms and equipment testers in the US and Canada.",
        "screenshots": [],
        "quote": None,
        "approval": {"client_name": False, "logo": False, "quote": False, "screenshots": False},
    },
]


def public_case_studies() -> list[dict]:
    return [c for c in CASE_STUDIES if c["published"]]
