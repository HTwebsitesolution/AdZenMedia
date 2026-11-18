import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, FileSearch, MapPinned, Timer } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { CtaBand, QuoteCta, Section } from "@/components/site/Blocks";
import { OFFERS } from "@/lib/content";

const PROBLEMS = [
  [Timer, "Quotes go out, follow-up doesn't", "Open quotes sit in inboxes while competitors call back first."],
  [FileSearch, "The same document requests, every day", "Staff stop real work to find and resend certificates and reports."],
  [MapPinned, "Customers with many sites can't see their records", "Facility managers chase you for status across locations."],
  [ClipboardCheck, "Inquiries arrive everywhere, tracked nowhere", "Phone, email and forms with no record of source or reply."],
];

const STEPS = [
  ["01", "Tell us what you need", "Use the quote form or the 2-minute systems check. No call needed to start."],
  ["02", "Joseph replies personally", "You get questions or a short call, then a written scope with what's in and out."],
  ["03", "Start small, measure it", "Begin with one system or pilot, agree on the measure, and expand only if it works."],
];

export default function Home() {
  return (
    <>
      <Seo title="Websites, automation and portals for service businesses" description="AdZenMedia helps US and Canadian service businesses win more inquiries and spend less time on admin with better websites, workflow automation, customer portals and team AI training." />
      <section className="relative overflow-hidden border-b border-white/10 dot-grid">
        <div className="container-x pt-16 pb-20 lg:pt-28 lg:pb-28 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <p className="eyebrow rise">Founder-led digital systems · US & Canada</p>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] rise rise-2" data-testid="home-headline">
              Win more inquiries.<br /><span className="text-amber-400">Spend less time on admin.</span>
            </h1>
            <p className="mt-7 text-lg text-slate-300 leading-relaxed max-w-2xl rise rise-3">
              AdZenMedia helps service businesses in the US and Canada build better websites, automate repetitive work, and give customers easier access to the information they need. We also train your team to use the tools we put in place.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 rise rise-3">
              <QuoteCta testid="home-request-quote-btn" />
              <Link to="/work" className="btn-secondary" data-testid="home-see-work-btn">See our work</Link>
            </div>
            <p className="mt-6 text-sm text-slate-400 rise rise-3">
              Prefer a quick question? <Link to="/contact" className="text-amber-300 underline underline-offset-4" data-testid="home-contact-link">Contact us</Link>
            </p>
          </div>
          <aside className="lg:col-span-4 surface p-6 self-end rise rise-3" aria-label="Built for">
            <p className="eyebrow">Built first for</p>
            <ul className="mt-4 space-y-3 font-mono text-sm text-slate-200">
              {["Inspection", "Testing", "Calibration", "Multi-location service providers"].map((s) => (
                <li key={s} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{s}</li>
              ))}
            </ul>
            <Link to="/industries/commercial-field-service" className="mt-6 inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200" data-testid="home-sector-link">
              Commercial field service <ArrowRight size={14} />
            </Link>
          </aside>
        </div>
      </section>

      <Section eyebrow="The problems we fix" title="Most lost work starts with slow, manual admin.">
        <div className="grid sm:grid-cols-2 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
          {PROBLEMS.map(([Icon, t, d]) => (
            <div key={t} className="bg-[#0F141C] p-7 hover:bg-[#131924] transition-colors">
              <Icon className="text-amber-400" size={22} aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Solutions" title="Four ways to start, each with a clear scope.">
        <div className="grid md:grid-cols-2 gap-5">
          {OFFERS.map((o) => (
            <Link key={o.slug} to={`/solutions/${o.slug}`} className="surface p-7 group hover:border-amber-400/40 transition-colors" data-testid={`home-offer-${o.service}`}>
              <span className="font-mono text-xs text-slate-500">{o.code}</span>
              <h3 className="mt-2 text-xl font-semibold group-hover:text-amber-300 transition-colors">{o.name}</h3>
              <p className="mt-2 text-slate-400">{o.short}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-amber-300">Learn more <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="Proof" title="Built for real service workflows.">
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="surface p-7">
            <p className="font-mono text-xs text-slate-500">CUSTOMER PORTAL · UK</p>
            <h3 className="mt-2 text-lg font-semibold">Self-service records for a multi-site inspection and testing provider</h3>
            <p className="mt-2 text-slate-400">Customers find their own inspection documents instead of emailing the office.</p>
          </div>
          <div className="surface p-7">
            <p className="font-mono text-xs text-slate-500">QR VERIFICATION · UK</p>
            <h3 className="mt-2 text-lg font-semibold">Certificates that verify themselves</h3>
            <p className="mt-2 text-slate-400">A QR code on each certificate opens a live status page, so checks don't need a phone call.</p>
          </div>
        </div>
        <Link to="/work" className="mt-6 inline-flex items-center gap-2 text-amber-300" data-testid="home-proof-work-link">How these workflows apply to you <ArrowRight size={14} /></Link>
      </Section>

      <Section eyebrow="How to start" title="From first message to a scoped quote.">
        <ol className="grid md:grid-cols-3 gap-5">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className="border-t-2 border-amber-400/60 pt-5">
              <span className="font-mono text-sm text-amber-400">{n}</span>
              <h3 className="mt-2 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-slate-400">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <QuoteCta testid="home-steps-quote-btn" />
          <Link to="/systems-check" className="btn-secondary" data-testid="home-systems-check-btn">Take the 2-minute systems check</Link>
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
