import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { CtaBand, PageHero, QuoteCta, Section } from "@/components/site/Blocks";
import { PortalMock } from "@/components/home/Mockups";
import { api } from "@/lib/api";
import { useConfig } from "@/lib/config";

const INDUSTRY_PROBLEMS = [
  ["Slow quote follow-up", "Quotes go out, then sit in an inbox.", "ai-automation-agents", "Automate reminders and follow-up drafts, with a person approving what's sent."],
  ["Repeated requests for certificates and reports", "The office answers the same 'please send the latest certificate' email every day.", "custom-software-portals-saas", "A portal where customers download their own documents, or QR verification printed on each certificate."],
  ["Customers with many sites", "Facility managers can't see what was inspected, where and when.", "custom-software-portals-saas", "Site-level permissions so each contact sees the right locations."],
];

export function IndustryPage() {
  return (
    <>
      <Seo title="Engineering, inspection and calibration" description="How AdZenMedia's portals, automation and websites apply to engineering, inspection, testing and calibration companies in the US and Canada." />
      <PageHero eyebrow="Industry example" title="Engineering, inspection and calibration" actions={<QuoteCta testid="industry-request-quote-btn" />}>
        One of the industries we've delivered for. Here's how the same systems apply to providers in the US and Canada.
      </PageHero>
      <section className="container-x py-12 space-y-0 border-t border-black/10">
        {INDUSTRY_PROBLEMS.map(([p, d, slug, fix]) => (
          <article key={p} className="grid lg:grid-cols-12 gap-6 py-10 border-b border-black/10" data-testid="industry-problem">
            <div className="lg:col-span-6"><h2 className="font-display text-2xl sm:text-3xl font-bold">{p}</h2><p className="mt-2 text-[#565a63]">{d}</p></div>
            <div className="lg:col-span-6"><p className="text-lg text-[#3a3d45]">{fix}</p><Link to={`/services/${slug}`} className="mt-3 inline-flex items-center gap-1 text-[#2247FF] font-semibold">Related service <ArrowRight size={14} /></Link></div>
          </article>
        ))}
      </section>
      <CtaBand />
    </>
  );
}

const PROJECTS = [
  { tag: "Custom software · UK", title: "Customer portal for a multi-site inspection and testing provider", visual: true,
    before: "Customers emailed the office for inspection reports and certificates across their sites.",
    lesson: "If your customers manage several locations, permissioned access to their own records removes a recurring office task and makes you easier to keep." },
  { tag: "AI automation · UK", title: "QR codes that let anyone verify a certificate",
    before: "Third parties phoned or emailed to confirm a certificate was genuine and current.",
    lesson: "Any business that issues documents can let the document prove itself, with no phone call needed." },
];

const DEMOS = [
  ["Meta lead to booked appointment", "Interactive walkthrough with sample data", "/services/meta-lead-generation-ai-follow-up"],
  ["AI receptionist booking", "Demonstration conversation and calendar", "/services/ai-appointment-booking"],
  ["Short-form video structure", "Demonstration frames", "/services/social-media-video-editing"],
];

export function WorkPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/public/case-studies").then((r) => setItems(r.data.items)).catch(() => {}); }, []);
  return (
    <>
      <Seo title="Work" description="Client projects and labeled demonstrations from AdZenMedia: customer portals, certificate verification, AI follow-up and booking, and social video." />
      <PageHero eyebrow="Work" title="Projects, and what they teach.">
        Client names and full results are shared only with each client's approval. Demonstrations are labeled as such.
      </PageHero>
      <section className="container-x py-12 space-y-16">
        {PROJECTS.map((p) => (
          <article key={p.title} className="grid lg:grid-cols-12 gap-10 items-center" data-testid="work-pattern-card">
            <div className="lg:col-span-5">
              <p className="kicker">{p.tag}</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] leading-tight">{p.title}</h2>
              <p className="mt-5 font-semibold">Before</p><p className="text-[#3a3d45]">{p.before}</p>
              <p className="mt-4 font-semibold">What other businesses can learn</p><p className="text-[#3a3d45]">{p.lesson}</p>
            </div>
            <div className="lg:col-span-7">{p.visual ? <PortalMock /> : (
              <div className="paper-card p-8 flex items-center gap-6" aria-hidden="true">
                <div className="grid grid-cols-5 gap-1 w-24 h-24 shrink-0">{Array.from({ length: 25 }).map((_, k) => <span key={k} className={(k * 7) % 3 ? "bg-[#15171C]" : "bg-transparent"} />)}</div>
                <div><p className="font-semibold">Certificate status: Valid</p><p className="text-sm text-[#565a63]">Representative verification view</p></div>
              </div>)}
            </div>
          </article>
        ))}
        {items.length > 0 && (
          <div className="space-y-3" data-testid="work-case-studies">
            <h2 className="font-display text-3xl font-bold">Case studies</h2>
            {items.map((c) => <Link key={c.slug} to={`/work/${c.slug}`} className="surface p-6 flex justify-between hover:border-[#2247FF]"><span className="font-semibold">{c.title}</span><ArrowRight size={16} /></Link>)}
          </div>
        )}
        <div data-testid="work-demos">
          <h2 className="font-display text-3xl font-bold">Demonstrations</h2>
          <p className="mt-2 text-[#565a63]">Built with sample data to show how a system works before live client evidence is available.</p>
          <ul className="mt-6 border-t border-black/15">
            {DEMOS.map(([t, d, to]) => (
              <li key={t} className="border-b border-black/15"><Link to={to} className="py-5 flex justify-between gap-4 group"><span className="font-display text-xl sm:text-2xl font-bold group-hover:text-[#2247FF]">{t}</span><span className="text-[#565a63] text-right">{d}</span></Link></li>
            ))}
          </ul>
        </div>
        <p className="text-[#565a63]">Work in engineering, inspection or calibration? <Link to="/industries/engineering-inspection-calibration" className="text-[#2247FF] underline underline-offset-4" data-testid="work-industry-link">See how these systems apply</Link>.</p>
      </section>
      <CtaBand />
    </>
  );
}

export const CaseStudyBody = ({ c }) => (
  <div className="space-y-8 max-w-3xl">
    {[["Context", `${c.client_display_public} · ${c.context}`], ["The problem", c.summary], ["Before", c.prior_process],
      ["What we delivered", c.delivered], ["Verified outcome", c.verified_outcome], ["What other businesses can learn", c.lessons]]
      .map(([h, t]) => (
        <div key={h}>
          <h2 className="eyebrow">{h}</h2>
          <p className="mt-2 text-lg leading-relaxed">{t}</p>
        </div>
      ))}
  </div>
);

export function CaseStudyPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, c: null });
  useEffect(() => {
    api.get("/public/case-studies").then((r) => setState({ loading: false, c: r.data.items.find((x) => x.slug === slug) }))
      .catch(() => setState({ loading: false, c: null }));
  }, [slug]);
  if (state.loading) return <div className="container-x py-24 text-[#565a63]">Loading…</div>;
  if (!state.c) return <Navigate to="/work" replace />;
  return (
    <>
      <Seo title={state.c.title} description={state.c.summary} />
      <PageHero eyebrow="Case study" title={state.c.title} />
      <Section><CaseStudyBody c={state.c} /></Section>
      <CtaBand service={state.c.service} />
    </>
  );
}

export function AboutPage() {
  const { cfg } = useConfig() || {};
  const location = cfg?.founder?.location;
  return (
    <>
      <Seo title="About" description="AdZenMedia is a founder-led digital, marketing and AI agency for businesses in the US and Canada, led by Joseph Afolabi." />
      <PageHero eyebrow="About" title="Founder-led, from first call to handover.">
        AdZenMedia is a digital, marketing and AI agency led by Joseph Afolabi. You work with the person who scopes, builds and trains, not an account manager.
      </PageHero>
      <section className="container-x py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-5 text-lg leading-relaxed text-[#3a3d45]">
          <p>We design websites, create social content and video, run Facebook and Instagram campaigns, build AI systems that follow up with leads and book appointments, develop custom software, and train teams to use all of it.</p>
          <p>We work with businesses across industries in the United States and Canada. Past work includes customer portals and certificate verification for service providers in the United Kingdom.</p>
          <p className="font-display text-3xl sm:text-4xl font-bold text-[#15171C] tracking-[-0.02em] leading-tight pt-4">"Start with one thing that matters, measure it, and build more only when it works."</p>
        </div>
        <dl className="lg:col-span-5 space-y-6 self-start border-t border-black/15 pt-6" data-testid="about-facts">
          <div><dt className="kicker">Founder</dt><dd className="mt-1 text-lg">Joseph Afolabi</dd></div>
          {location && <div data-testid="about-location"><dt className="kicker">Based in</dt><dd className="mt-1 text-lg">{location}</dd></div>}
          <div><dt className="kicker">Clients</dt><dd className="mt-1 text-lg">Businesses in the US and Canada, across industries</dd></div>
          <div><dt className="kicker">How we work</dt><dd className="mt-1 text-lg">Written scopes, agreed measures, training at handover</dd></div>
        </dl>
      </section>
      <CtaBand />
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Seo title="Privacy (draft)" description="Draft privacy information for AdZenMedia." noindex />
      <PageHero eyebrow="Draft for owner review" title="Privacy information">This draft is waiting for review and is not legal advice.</PageHero>
      <Section>
        <div className="max-w-3xl space-y-6 text-[#3a3d45]" data-testid="privacy-draft">
          {[["What we collect", "The details you send through our forms (name, email, company, and optionally country, website and phone), your answers, the page you arrived on and campaign source tags. We don't use advertising trackers on this site without approval."],
            ["Why", "To reply to your inquiry, prepare a scoped quote, and follow up on it. We count page actions such as form starts and contact clicks without personal details."],
            ["Who processes it", "Our database host, our email provider for confirmations, and, if enabled, a form backup service. If you choose the AI voice assistant, the call is processed by our voice provider; we keep only a short summary and the contact details you agree to share, not audio or transcripts."],
            ["How long we keep it", "[Owner to confirm retention period] Inquiries that don't become projects are deleted after the agreed period."],
            ["Your choices", "You can ask to see, correct or delete your information by contacting us. [Owner to add monitored contact address and applicable US state and Canadian (PIPEDA) wording.]"]]
            .map(([h, t]) => (<div key={h}><h2 className="font-display text-xl font-bold text-[#15171C]">{h}</h2><p className="mt-2">{t}</p></div>))}
        </div>
      </Section>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container-x py-32">
      <Seo title="Page not found" noindex />
      <h1 className="font-display text-5xl font-bold">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-[#2247FF]">Back to home</Link>
    </div>
  );
}
