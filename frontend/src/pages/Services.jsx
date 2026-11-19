import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { CheckList, CtaBand, PageHero, QuoteCta, Section } from "@/components/site/Blocks";
import { LeadJourney } from "@/components/home/LeadJourney";
import { MOCKS } from "@/components/home/Mockups";
import { LEGACY_SLUGS, SERVICES, serviceBySlug } from "@/lib/content";

export function ServicesHub() {
  return (
    <>
      <Seo title="Services" description="Website design, social media and video editing, Facebook and Instagram ads, AI automation, AI appointment booking, custom software and AI training for businesses in the US and Canada." />
      <PageHero eyebrow="Services" title="Pick what you need. Combine what works." actions={<QuoteCta testid="services-request-quote" />}>
        Every engagement starts with a written scope. Choose one service or several in the quote form.
      </PageHero>
      <section className="container-x py-12 lg:py-16">
        <ul className="border-t border-black/15">
          {SERVICES.map((s) => (
            <li key={s.slug} className="border-b border-black/15">
              <Link to={`/services/${s.slug}`} className="group grid md:grid-cols-12 gap-3 py-8 items-baseline" data-testid={`services-item-${s.service}`}>
                <h2 className={`md:col-span-6 font-display text-2xl sm:text-4xl font-bold tracking-[-0.02em] group-hover:text-[#2247FF] transition-colors ${s.featured ? "text-[#2247FF]" : ""}`}>{s.name}</h2>
                <p className="md:col-span-5 text-[#565a63] text-lg">{s.short}</p>
                <ArrowUpRight className="hidden md:block justify-self-end" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-[#565a63]">Not sure? <Link to="/systems-check" className="text-[#2247FF] underline underline-offset-4">Take the systems check</Link> or <Link to="/quote?service=not_sure" className="text-[#2247FF] underline underline-offset-4">describe the goal</Link>.</p>
      </section>
    </>
  );
}

export function ServicePage() {
  const { slug } = useParams();
  const o = serviceBySlug(slug);
  if (!o) return <Navigate to="/services" replace />;
  const Visual = MOCKS[o.demo];
  return (
    <>
      <Seo title={o.name} description={o.description} />
      <PageHero eyebrow={o.featured ? "Combined offer" : "Service"} title={o.name} aside={<Visual />}
        actions={<><QuoteCta service={o.service} testid="service-request-quote-btn" /><Link to="/contact" className="btn-secondary" data-testid="service-contact-btn">Ask a question</Link></>}>
        {o.description}
      </PageHero>
      <Section title={o.problem} />
      {o.journey && <section className="container-x pb-12"><LeadJourney /></section>}
      <section className="container-x grid lg:grid-cols-2 gap-12 lg:gap-20 py-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">What you get</h2>
          <div className="mt-6"><CheckList items={o.deliverables} /></div>
        </div>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">How we start</h2>
          <ol className="mt-6 space-y-4 list-decimal pl-5 text-[#3a3d45] marker:text-[#2247FF] marker:font-semibold">
            {o.start.map((s) => <li key={s} className="pl-2">{s}</li>)}
          </ol>
        </div>
      </section>
      <Section>
        <p className="text-xl text-[#3a3d45] max-w-3xl leading-relaxed" data-testid="service-proof">{o.proof}</p>
        <Link to="/work" className="mt-6 inline-flex text-[#2247FF] font-semibold">See our work</Link>
      </Section>
      <CtaBand service={o.service} />
    </>
  );
}

export function LegacySolutionRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug && LEGACY_SLUGS[slug] ? `/services/${LEGACY_SLUGS[slug]}` : "/services"} replace />;
}
