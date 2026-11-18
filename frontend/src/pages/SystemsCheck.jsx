import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { PageHero } from "@/components/site/Blocks";
import { ChoiceGroup, Honeypot, TextField } from "@/components/forms/Fields";
import { QuoteConfirmation } from "@/components/quote/QuoteConfirmation";
import { api, errorMap, errorText, getAttribution, idemKey, resetIdem, track } from "@/lib/api";
import { useConfig } from "@/lib/config";

const ResultCard = ({ result }) => (
  <div className="surface p-7 sm:p-9 border-amber-400/40" data-testid="check-result">
    <p className="eyebrow">Your likely priority</p>
    <h2 className="mt-2 text-2xl sm:text-3xl font-bold" data-testid="check-result-priority">{result.priority}</h2>
    <p className="mt-6 eyebrow">One practical first action</p>
    <p className="mt-2 text-slate-300 text-lg" data-testid="check-result-action">{result.action}</p>
    <Link to={`/quote?service=${result.service}&from=check`} className="btn-primary mt-8" data-testid="check-to-quote-btn">
      Turn this into a quote request <ArrowRight size={16} />
    </Link>
  </div>
);

const SendResult = ({ answers }) => {
  const [c, setC] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ref, setRef] = useState(null);
  const [hp, setHp] = useState("");
  const started = useRef(Date.now());
  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!c.name || c.name.trim().length < 2) errs["contact.name"] = "Please enter your name";
    if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errs["contact.email"] = "Please enter a valid email";
    if (!c.company || !c.company.trim()) errs["contact.company"] = "Please enter your company";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setMsg("");
    try {
      const r = await api.post("/leads", { channel: "systems_check", idempotency_key: idemKey("check"), check_answers: answers,
        contact: c, attribution: getAttribution(), hp, elapsed_ms: Date.now() - started.current });
      resetIdem("check"); setRef(r.data.reference);
    } catch (err) { setErrors(errorMap(err)); setMsg(errorText(err)); } finally { setBusy(false); }
  }
  if (ref) return <QuoteConfirmation reference={ref} kind="systems check" />;
  return (
    <form onSubmit={submit} noValidate className="surface p-7 space-y-4 relative" data-testid="check-contact-form">
      <Honeypot value={hp} onChange={setHp} />
      <h3 className="text-lg font-semibold">Want Joseph to look at this with you?</h3>
      <p className="text-sm text-slate-400">Optional. Share your details and we'll reply about this priority.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <TextField id="check-name" label="Name" required value={c.name} onChange={(v) => setC({ ...c, name: v })} error={errors["contact.name"]} />
        <TextField id="check-email" label="Email" type="email" required value={c.email} onChange={(v) => setC({ ...c, email: v })} error={errors["contact.email"]} />
        <TextField id="check-company" label="Company" required value={c.company} onChange={(v) => setC({ ...c, company: v })} error={errors["contact.company"]} />
      </div>
      {msg && <p role="alert" className="text-sm text-rose-300">{msg}</p>}
      <button className="btn-secondary" disabled={busy} data-testid="check-contact-submit">{busy && <Loader2 size={16} className="animate-spin" />} Send my result</button>
    </form>
  );
};

export default function SystemsCheckPage() {
  const { cfg } = useConfig() || {};
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { track("check_start"); }, []);
  const qs = cfg?.check_questions || [];
  const complete = qs.length > 0 && qs.every((q) => answers[q.id]);

  async function evaluate() {
    setBusy(true); setErr("");
    try {
      const r = await api.post("/public/systems-check", { answers });
      setResult(r.data);
      sessionStorage.setItem("azm_check_result", JSON.stringify(r.data));
      track("check_complete");
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <Seo title="Business Systems Check" description="Answer five quick questions to find your most likely systems priority and one practical first action." />
      <PageHero eyebrow="2-minute systems check" title="Where is admin costing you the most?">
        Five questions. You'll see one likely priority and one practical first step before we ask for any contact details.
      </PageHero>
      <section className="container-x py-14 max-w-3xl space-y-8" data-testid="systems-check">
        {!result && (
          <>
            {qs.map((q, i) => (
              <ChoiceGroup key={q.id} id={`check-${q.id}`} label={`${i + 1}. ${q.label}`} options={q.options} value={answers[q.id]} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
            ))}
            {err && <p role="alert" className="text-rose-300">{err}</p>}
            <button type="button" disabled={!complete || busy} onClick={evaluate} className="btn-primary disabled:opacity-50" data-testid="check-submit-btn">
              {busy && <Loader2 size={16} className="animate-spin" />} See my priority
            </button>
          </>
        )}
        {result && (
          <>
            <ResultCard result={result} />
            <SendResult answers={answers} />
            <button type="button" className="text-sm text-slate-400 underline" onClick={() => setResult(null)} data-testid="check-restart">Change my answers</button>
          </>
        )}
      </section>
    </>
  );
}

export function QuotePage({ children }) {
  return (
    <>
      <Seo title="Request a quote" description="Request a scoped quote from AdZenMedia in four short steps." />
      <section className="container-x py-12 lg:py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <p className="eyebrow">Request a quote</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight">Scope your project.</h1>
          <p className="mt-4 text-slate-400">Only the questions that fit your answers. Timing and budget are optional. You can go back and edit before you submit.</p>
          <p className="mt-6 text-sm text-slate-500">Just a quick question? <Link to="/contact" className="text-amber-300 underline">Use the short form</Link>.</p>
        </div>
        <div className="lg:col-span-8">{children}</div>
      </section>
    </>
  );
}
