import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { CheckList, CtaBand, PageHero, QuoteCta, Section } from "@/components/site/Blocks";
import { OFFERS, offerBySlug } from "@/lib/content";

export function SolutionsHub() {
  return (
    <>
      <Seo title="Solutions" description="Website and inquiry systems, workflow automation pilots, customer portal discovery and practical AI training for US and Canadian service businesses." />
      <PageHero eyebrow="Solutions" title="Pick the problem. We scope the system." actions={<QuoteCta testid="solutions-request-quote" />}>
        Each engagement starts small, with a written scope, an agreed measure and training for the people who will use it.
      </PageHero>
      <Section>
        <div className="space-y-5">
          {OFFERS.map((o) => (
            <Link key={o.slug} to={`/solutions/${o.slug}`} className="surface p-7 sm:p-9 grid md:grid-cols-12 gap-6 group hover:border-amber-400/40 transition-colors" data-testid={`solutions-offer-${o.service}`}>
              <span className="md:col-span-2 font-mono text-xs text-slate-500">{o.code}</span>
              <div className="md:col-span-7">
                <h2 className="text-xl sm:text-2xl font-semibold group-hover:text-amber-300 transition-colors">{o.name}</h2>
                <p className="mt-2 text-slate-400">{o.short}</p>
              </div>
              <span className="md:col-span-3 md:text-right inline-flex md:justify-end items-center gap-2 text-amber-300 text-sm">View offer <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-slate-400">Not sure which fits? <Link to="/systems-check" className="text-amber-300 underline underline-offset-4">Take the systems check</Link> or <Link to="/quote?service=not_sure" className="text-amber-300 underline underline-offset-4">describe the problem</Link>.</p>
      </Section>
    </>
  );
}

export function OfferPage() {
  const { slug } = useParams();
  const o = offerBySlug(slug);
  if (!o) return <Navigate to="/solutions" replace />;
  return (
    <>
      <Seo title={o.title} description={o.description} />
      <PageHero eyebrow={o.code} title={o.name} actions={<><QuoteCta service={o.service} testid="offer-request-quote-btn" /><Link to="/contact" className="btn-secondary" data-testid="offer-contact-btn">Ask a question</Link></>}>
        {o.description}
      </PageHero>
      <Section eyebrow="The problem" title={o.problem} />
      <section className="container-x grid lg:grid-cols-2 gap-6">
        <div className="surface p-7 sm:p-9">
          <h2 className="text-xl font-semibold">What you get</h2>
          <div className="mt-6"><CheckList items={o.deliverables} /></div>
        </div>
        <div className="surface p-7 sm:p-9">
          <h2 className="text-xl font-semibold">How we start</h2>
          <ol className="mt-6 space-y-5">
            {o.start.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="font-mono text-amber-400 text-sm mt-0.5">0{i + 1}</span>
                <span className="text-slate-300">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Section eyebrow="Proof">
        <p className="text-lg text-slate-300 max-w-3xl">{o.proof}</p>
        <Link to="/industries/commercial-field-service" className="mt-6 inline-flex items-center gap-2 text-amber-300">How this helps commercial field service <ArrowRight size={14} /></Link>
      </Section>
      <CtaBand service={o.service} />
    </>
  );
}
