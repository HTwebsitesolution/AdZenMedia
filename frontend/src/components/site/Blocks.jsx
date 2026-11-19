import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

export const PageHero = ({ eyebrow, title, children, actions, aside }) => (
  <section className="border-b border-black/10">
    <div className={`container-x py-16 lg:py-24 grid gap-12 ${aside ? "lg:grid-cols-12 items-center" : ""}`}>
      <div className={aside ? "lg:col-span-6" : "max-w-4xl"}>
        {eyebrow && <p className="kicker rise">{eyebrow}</p>}
        <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.03] rise rise-2">{title}</h1>
        {children && <div className="mt-6 text-lg text-[#3a3d45] leading-relaxed max-w-2xl rise rise-3">{children}</div>}
        {actions && <div className="mt-8 flex flex-wrap gap-3 rise rise-3">{actions}</div>}
      </div>
      {aside && <div className="lg:col-span-6 rise rise-3">{aside}</div>}
    </div>
  </section>
);

export const Section = ({ eyebrow, title, children, className = "" }) => (
  <section className={`container-x py-16 lg:py-24 ${className}`}>
    {eyebrow && <p className="kicker">{eyebrow}</p>}
    {title && <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] max-w-4xl leading-[1.08]">{title}</h2>}
    {children && <div className="mt-10">{children}</div>}
  </section>
);

export const CheckList = ({ items }) => (
  <ul className="space-y-3">
    {items.map((i) => (
      <li key={i} className="flex gap-3 text-[#3a3d45]">
        <Check size={18} className="mt-1 shrink-0 text-[#2247FF]" aria-hidden />
        <span>{i}</span>
      </li>
    ))}
  </ul>
);

export const QuoteCta = ({ service, label = "Request a quote", testid = "cta-request-quote" }) => (
  <Link to={service ? `/quote?service=${service}` : "/quote"} className="btn-cta" data-testid={testid}>
    {label} <ArrowRight size={16} aria-hidden />
  </Link>
);

export const CtaBand = ({ service }) => (
  <section className="container-x mt-8">
    <div className="rounded-[28px] bg-[#2247FF] text-white p-8 sm:p-14 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
      <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] max-w-2xl leading-[1.05]">Tell us what you're trying to grow.</h2>
      <div className="flex flex-wrap gap-3">
        <Link to={service ? `/quote?service=${service}` : "/quote"} className="inline-flex items-center gap-2 rounded-full bg-white text-[#15171C] px-6 py-3 font-semibold hover:bg-[#F4F1EA] transition-colors" data-testid="cta-band-request-quote">
          Request a quote <ArrowRight size={16} />
        </Link>
        <Link to="/contact" className="btn-ghost text-white" data-testid="cta-band-contact">Ask a quick question</Link>
      </div>
    </div>
  </section>
);
