export const OFFERS = [
  {
    slug: "website-inquiry-system",
    service: "website",
    code: "OFFER-01",
    name: "Website & Inquiry System",
    short: "Websites, landing pages, SEO and lead capture that turn visits into tracked inquiries.",
    title: "Website & Inquiry System for service businesses",
    description: "Websites, landing pages, SEO and inquiry capture for US and Canadian service businesses, with attribution and follow-up built in.",
    problem: "Your website looks fine but inquiries arrive by phone, email and contact forms with no record of where they came from, and some never get a reply. You can't tell which pages or campaigns bring in real work.",
    deliverables: [
      "A fast, mobile-first website or landing pages written for your buyers",
      "Inquiry forms that capture the details you need to quote",
      "Source and campaign attribution on every inquiry",
      "A follow-up routine so no inquiry is left without a reply",
      "Technical SEO and service or location pages where they make sense",
      "Optional digital marketing setup, with tracking only after you approve it",
    ],
    start: [
      "A short call about how inquiries reach you today",
      "A review of your current site, search visibility and inquiry handling",
      "A written scope with priorities, phases and a fixed quote",
    ],
    proof: "Our current inquiry system, the one you are using on this site, records the reference, channel, source and follow-up date of every request.",
  },
  {
    slug: "workflow-automation-pilot",
    service: "automation",
    code: "OFFER-02",
    name: "Workflow Automation Pilot",
    short: "Improve one workflow, such as quote follow-up or document retrieval, against an agreed baseline.",
    title: "Workflow Automation Pilot",
    description: "Automate one workflow, such as quote follow-up, inquiry triage or document retrieval, with an agreed baseline, a success measure and human review.",
    problem: "Your team re-types the same information, chases the same quotes and answers the same requests every week. Everyone knows it wastes time, but nobody has measured how much or tried a safe fix.",
    deliverables: [
      "One workflow chosen with you, such as quote follow-up, inquiry triage or document retrieval",
      "An agreed baseline and one success measure before any build starts",
      "Automation using your existing tools where possible",
      "AI agents only where they help, with human review on anything sent to customers",
      "A before-and-after report against the baseline",
      "Handover notes and a short training session for the people who run it",
    ],
    start: [
      "Map the current workflow with the person who does it",
      "Agree on the baseline, the measure and what counts as success",
      "Run a time-boxed pilot, then decide together whether to extend it",
    ],
    proof: "We have delivered QR certificate verification that lets third parties check documents without calling the office. The full case study is waiting for client approval.",
  },
  {
    slug: "customer-portal-software-discovery",
    service: "portal",
    code: "OFFER-03",
    name: "Customer Portal & Software Discovery",
    short: "Scope portals, internal tools or SaaS with a workflow map, phased MVP and build estimate.",
    title: "Customer Portal & Software Discovery",
    description: "Scope customer portals, internal tools, bespoke software and SaaS products. You get a workflow map, a phased MVP scope and a build estimate.",
    problem: "Customers want to see their reports, certificates and job status without emailing you. Off-the-shelf software doesn't fit how you work, and a full custom build feels risky without a clear scope.",
    deliverables: [
      "A workflow map of how information moves today",
      "User roles and permissions, including customers with multiple sites",
      "A phased MVP scope: what to build first and what can wait",
      "A build estimate with assumptions stated plainly",
      "Integration notes for the systems you already use",
      "A clickable outline of key screens where it helps decisions",
    ],
    start: [
      "Interviews with the people who will use it, inside and outside your business",
      "A discovery workshop to agree on the first phase",
      "Workflow map, MVP scope and estimate delivered in writing",
    ],
    proof: "We built a customer portal for a multi-site inspection and testing provider in the UK. The case study will be published once the client approves it.",
  },
  {
    slug: "ai-training-for-teams",
    service: "training",
    code: "OFFER-04",
    name: "Practical AI Training for Teams",
    short: "Role-based workshops using your own work examples, on their own or alongside delivery.",
    title: "Practical AI Training for Teams",
    description: "Role-based AI workshops built on your team's real work, with implementation handover. Available on its own or alongside a delivery project.",
    problem: "Some of your staff already use AI tools, others won't touch them, and nobody has agreed on what's safe or useful. You want practical skills, not a generic demo.",
    deliverables: [
      "Role-based workshops for office, sales, field supervisors or management",
      "Exercises built from your own documents and recurring tasks",
      "Simple rules on what data can and can't go into AI tools",
      "Prompt and review templates your team can reuse",
      "Implementation handover for any tools we put in place",
      "A follow-up session to answer questions after real use",
    ],
    start: [
      "A short survey of roles, tools and current use",
      "Agree on the work examples and the outcome for each role",
      "Deliver the workshops on-site or remotely, then follow up",
    ],
    proof: "Training is part of every system we deliver, so the people who run it can keep it running.",
  },
];

export const offerBySlug = (slug) => OFFERS.find((o) => o.slug === slug);
export const offerByService = (s) => OFFERS.find((o) => o.service === s);

export const SECTOR_PROBLEMS = [
  {
    problem: "Slow quote follow-up",
    detail: "Quotes go out, then sit in an inbox. Work is lost to the competitor who called back first.",
    fix: [
      ["workflow-automation-pilot", "Automate reminders and follow-up drafts for each open quote, with a person approving what's sent."],
      ["website-inquiry-system", "Capture the details needed to quote on the first contact, so quotes go out faster."],
    ],
  },
  {
    problem: "Repeated requests for certificates and reports",
    detail: "Your office answers the same 'can you send the latest certificate' email every day.",
    fix: [
      ["customer-portal-software-discovery", "Scope a portal where customers download their own certificates and reports."],
      ["workflow-automation-pilot", "Pilot automatic document retrieval, or QR verification printed on each certificate."],
    ],
  },
  {
    problem: "Customer access across multiple sites",
    detail: "Facility managers responsible for many locations can't see what was inspected, where, and when.",
    fix: [
      ["customer-portal-software-discovery", "Map site-level permissions so each contact sees the right locations."],
      ["ai-training-for-teams", "Train office staff to answer multi-site questions quickly and consistently."],
    ],
  },
];
