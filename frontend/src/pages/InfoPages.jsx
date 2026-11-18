import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { CtaBand, PageHero, QuoteCta, Section } from "@/components/site/Blocks";
import { SECTOR_PROBLEMS, offerBySlug } from "@/lib/content";
import { api } from "@/lib/api";
import { useConfig } from "@/lib/config";

export function SectorPage() {
  return (
    <>
      <Seo title="Digital systems for commercial field-service companies" description="Inquiry systems, quote follow-up automation and customer portals for inspection, testing, calibration and multi-location service providers in the US and Canada." />
      <PageHero eyebrow="Commercial field service · US & Canada" title="Less chasing. Faster quotes. Customers who can find their own records." actions={<><QuoteCta testid="sector-request-quote-btn" /><Link to="/systems-check" className="btn-secondary" data-testid="sector-check-btn">Take the systems check</Link></>}>
        For inspection, testing and calibration companies and multi-location service providers. The admin around the work slows you down more than the work itself.
      </PageHero>
      <Section eyebrow="Where time goes" title="Three problems we see again and again.">
        <div className="space-y-6">
          {SECTOR_PROBLEMS.map((p, idx) => (
            <article key={p.problem} className="surface p-7 sm:p-9 grid lg:grid-cols-12 gap-6" data-testid={`sector-problem-${idx}`}>
              <div className="lg:col-span-5">
                <span className="font-mono text-xs text-amber-400">PROBLEM 0{idx + 1}</span>
                <h3 className="mt-2 text-xl font-semibold">{p.problem}</h3>
                <p className="mt-2 text-slate-400">{p.detail}</p>
              </div>
              <ul className="lg:col-span-7 space-y-4">
                {p.fix.map(([slug, text]) => (
                  <li key={slug} className="border-l-2 border-amber-400/50 pl-4">
                    <Link to={`/solutions/${slug}`} className="text-sm font-semibold text-amber-300 hover:text-amber-200">{offerBySlug(slug).name}</Link>
                    <p className="text-slate-300 mt-1">{text}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>
      <Section eyebrow="Both markets" title="One approach for US and Canadian providers.">
        <p className="text-slate-300 max-w-3xl">We work with businesses across the United States and Canada. Quotes state the currency, USD or CAD, and we keep your customers' data with providers you approve.</p>
      </Section>
      <CtaBand />
    </>
  );
}

const PATTERNS = [
  { tag: "CUSTOMER PORTAL · UK", title: "Self-service records for a multi-site inspection and testing provider",
    before: "Customers emailed the office for inspection reports and certificates across their sites.",
    lesson: "If your customers manage several locations, permissioned access to their own records removes a recurring office task and makes you easier to keep." },
  { tag: "QR VERIFICATION · UK", title: "Certificates that verify themselves",
    before: "Third parties phoned or emailed to confirm a certificate was genuine and current.",
    lesson: "Any business that issues certificates or reports can let the document prove itself, from calibration labs to equipment testers." },
];

export function WorkPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/public/case-studies").then((r) => setItems(r.data.items)).catch(() => {}); }, []);
  return (
    <>
      <Seo title="Work" description="Customer portal and certificate verification workflows built for service businesses, and what US and Canadian providers can learn from them." />
      <PageHero eyebrow="Work" title="Workflows we've built, and what they teach.">
        These projects were delivered for service businesses in the United Kingdom. Client names and full results are shared only with each client's approval.
      </PageHero>
      <Section>
        <div className="grid lg:grid-cols-2 gap-6">
          {PATTERNS.map((p) => (
            <article key={p.tag} className="surface p-7 sm:p-9" data-testid="work-pattern-card">
              <span className="font-mono text-xs text-slate-500">{p.tag}</span>
              <h2 className="mt-2 text-xl font-semibold">{p.title}</h2>
              <p className="mt-4 text-sm text-slate-500 uppercase tracking-wider font-mono">Before</p>
              <p className="text-slate-300">{p.before}</p>
              <p className="mt-4 text-sm text-slate-500 uppercase tracking-wider font-mono">What you can learn</p>
              <p className="text-slate-300">{p.lesson}</p>
            </article>
          ))}
        </div>
        {items.length > 0 && (
          <div className="mt-12 space-y-4" data-testid="work-case-studies">
            <h2 className="text-2xl font-bold">Case studies</h2>
            {items.map((c) => (
              <Link key={c.slug} to={`/work/${c.slug}`} className="surface p-6 flex justify-between hover:border-amber-400/40">
                <span className="font-semibold">{c.title}</span><ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </Section>
      <CtaBand />
    </>
  );
}

export const CaseStudyBody = ({ c }) => (
  <div className="space-y-8 max-w-3xl">
    {[["Context", `${c.client_display_public} · ${c.context}`], ["The problem", c.summary], ["Before", c.prior_process],
      ["What we delivered", c.delivered], ["Verified outcome", c.verified_outcome], ["What other service businesses can learn", c.lessons]]
      .map(([h, t]) => (
        <div key={h}>
          <h2 className="eyebrow">{h}</h2>
          <p className="mt-2 text-slate-300 text-lg leading-relaxed">{t}</p>
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
  if (state.loading) return <div className="container-x py-24 text-slate-400">Loading…</div>;
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
      <Seo title="About" description="AdZenMedia is a founder-led digital systems partner for service businesses in the US and Canada, led by Joseph Afolabi." />
      <PageHero eyebrow="About" title="Founder-led, from first call to handover.">
        AdZenMedia is led by Joseph Afolabi. You speak with the person who scopes, builds and trains, not an account manager.
      </PageHero>
      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-5 text-slate-300 text-lg leading-relaxed">
            <p>Joseph has built websites, customer portals and workflow tools for service businesses, including inspection and testing providers in the United Kingdom.</p>
            <p>AdZenMedia brings that work to service businesses in the United States and Canada, starting with commercial field-service companies and staying open to other B2B firms.</p>
            <p className="font-editorial italic text-2xl text-white">"Start with one workflow, measure it, and only build more when it works."</p>
          </div>
          <dl className="lg:col-span-5 surface p-7 space-y-5 self-start" data-testid="about-facts">
            <div><dt className="eyebrow">Founder</dt><dd className="mt-1">Joseph Afolabi</dd></div>
            {location && <div data-testid="about-location"><dt className="eyebrow">Based in</dt><dd className="mt-1">{location}</dd></div>}
            <div><dt className="eyebrow">Works with</dt><dd className="mt-1">Service businesses in the US and Canada</dd></div>
            <div><dt className="eyebrow">How we work</dt><dd className="mt-1">Written scopes, agreed measures, training at handover</dd></div>
          </dl>
        </div>
      </Section>
      <CtaBand />
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Seo title="Privacy (draft)" description="Draft privacy information for AdZenMedia." noindex />
      <PageHero eyebrow="Draft for owner review" title="Privacy information">
        This draft is waiting for review and is not legal advice.
      </PageHero>
      <Section>
        <div className="max-w-3xl space-y-6 text-slate-300" data-testid="privacy-draft">
          {[["What we collect", "The details you send through our forms (name, email, company, and optionally country, website and phone), your answers, the page you arrived on and campaign source tags. We don't use advertising trackers."],
            ["Why", "To reply to your inquiry, prepare a scoped quote, and follow up on it. We count page actions such as form starts and contact clicks without personal details."],
            ["Who processes it", "Our database host, our email provider for confirmations, and, if enabled, a form backup service. If you choose the AI voice assistant, the call is processed by our voice provider; we keep only a short summary and the contact details you agree to share, not audio or transcripts."],
            ["How long we keep it", "[Owner to confirm retention period] Inquiries that don't become projects are deleted after the agreed period."],
            ["Your choices", "You can ask to see, correct or delete your information by contacting us. [Owner to add monitored contact address and applicable US state and Canadian (PIPEDA) wording.]"]]
            .map(([h, t]) => (<div key={h}><h2 className="text-lg font-semibold text-white">{h}</h2><p className="mt-2">{t}</p></div>))}
        </div>
      </Section>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container-x py-32">
      <Seo title="Page not found" noindex />
      <h1 className="text-4xl font-bold">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-amber-300">Back to home</Link>
    </div>
  );
}
