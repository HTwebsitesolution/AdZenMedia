import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

export const PageHero = ({ eyebrow, title, children, actions }) => (
  <section className="relative border-b border-white/10 dot-grid">
    <div className="container-x py-16 lg:py-24 max-w-5xl">
      {eyebrow && <p className="eyebrow rise">{eyebrow}</p>}
      <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] rise rise-2">{title}</h1>
      {children && <div className="mt-6 text-lg text-slate-300 leading-relaxed max-w-3xl rise rise-3">{children}</div>}
      {actions && <div className="mt-8 flex flex-wrap gap-3 rise rise-3">{actions}</div>}
    </div>
  </section>
);

export const Section = ({ eyebrow, title, children, className = "" }) => (
  <section className={`container-x py-16 lg:py-24 ${className}`}>
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    {title && <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight max-w-3xl">{title}</h2>}
    <div className="mt-10">{children}</div>
  </section>
);

export const CheckList = ({ items }) => (
  <ul className="space-y-3">
    {items.map((i) => (
      <li key={i} className="flex gap-3 text-slate-300">
        <Check size={18} className="mt-1 shrink-0 text-amber-400" aria-hidden />
        <span>{i}</span>
      </li>
    ))}
  </ul>
);

export const QuoteCta = ({ service, label = "Request a quote", testid = "cta-request-quote" }) => (
  <Link to={service ? `/quote?service=${service}` : "/quote"} className="btn-primary" data-testid={testid}>
    {label} <ArrowRight size={16} aria-hidden />
  </Link>
);

export const CtaBand = ({ service }) => (
  <section className="container-x">
    <div className="surface p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-amber-400/30">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to scope your project?</h2>
        <p className="mt-2 text-slate-400">Answer a few short questions. Joseph replies personally with next steps.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <QuoteCta service={service} testid="cta-band-request-quote" />
        <Link to="/contact" className="btn-secondary" data-testid="cta-band-contact">Ask a quick question</Link>
      </div>
    </div>
  </section>
);
