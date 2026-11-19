import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Pencil } from "lucide-react";
import { ChoiceGroup, Honeypot, MultiChoice, TextArea, TextField } from "@/components/forms/Fields";
import { api, errorMap, errorText, getAttribution, idemKey, resetIdem, track } from "@/lib/api";
import { useConfig } from "@/lib/config";
import { QuoteConfirmation } from "./QuoteConfirmation";

const KEY = "azm_quote_v2";
const STEPS = ["Services", "Goal", "Timing & budget", "Contact", "Review"];
const TITLES = ["What do you need help with?", "What are you trying to achieve?", "Project timing and budget", "Where should we reply?", "Review your request"];
const empty = { step: 0, services: [], goal: "", answers: {}, timing: "", currency: "", budget: "", contact: {} };
const load = () => { try { return { ...empty, ...JSON.parse(sessionStorage.getItem(KEY)) }; } catch { return empty; } };
const filled = (v) => (Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()));

function stepOfError(loc) {
  if (loc.startsWith("services")) return 0;
  if (loc.startsWith("goal") || loc.startsWith("answers")) return 1;
  if (loc.startsWith("timing") || loc.startsWith("budget")) return 2;
  return 3;
}

const Progress = ({ step }) => (
  <div className="mb-8" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
    <div className="flex justify-between text-sm text-[#565a63] mb-2">
      <span data-testid="quote-step-indicator">Step {step + 1} of {STEPS.length}</span><span>{STEPS[step]}</span>
    </div>
    <div className="h-1.5 rounded-full bg-black/10 overflow-hidden"><div className="h-full bg-[#2247FF] transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
  </div>
);

const Question = ({ svc, q, value, onChange, error }) => {
  const props = { id: `quote-q-${svc}-${q.id}`, label: q.label, required: q.required, value, onChange, error };
  if (q.type === "select") return <ChoiceGroup {...props} options={q.options} columns={2} />;
  if (q.type === "multi") return <MultiChoice {...props} options={q.options} />;
  if (q.type === "textarea") return <TextArea {...props} rows={3} />;
  return <TextField {...props} />;
};

export default function QuoteWizard() {
  const { cfg } = useConfig() || {};
  const [params] = useSearchParams();
  const [s, setS] = useState(load);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState(null);
  const [hp, setHp] = useState("");
  const started = useRef(Date.now());
  const headingRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    let check = null;
    try { check = JSON.parse(sessionStorage.getItem("azm_check_result")); } catch { /* none */ }
    const fromCheck = params.get("from") === "check" && check;
    let wanted = (params.get("service") || (fromCheck ? check.service : "")).split(",").filter(Boolean);
    if (wanted.length > 1) wanted = wanted.filter((x) => x !== "not_sure");
    setS((p) => {
      const n = { ...p };
      if (wanted.length && wanted.join() !== p.services.join()) { n.services = wanted; n.answers = {}; n.step = 0; }
      if (fromCheck && !(p.goal || "").includes(check.priority)) n.goal = `Systems check priority: ${check.priority}. ${p.goal || ""}`.trim() + " ";
      return n;
    });
    track("wizard_start", "quote_wizard");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!done) sessionStorage.setItem(KEY, JSON.stringify(s)); }, [s, done]);
  useEffect(() => { if (first.current) { first.current = false; return; } headingRef.current?.focus(); }, [s.step]);

  const valid = useMemo(() => (cfg ? s.services.filter((x) => cfg.questions[x]) : []), [cfg, s.services]);
  const labelOf = (id) => cfg?.services.find((x) => x.id === id)?.label || id;
  const set = (patch) => setS((p) => ({ ...p, ...patch }));
  const setAns = (svc, id, v) => setS((p) => ({ ...p, answers: { ...p.answers, [svc]: { ...(p.answers[svc] || {}), [id]: v } } }));
  const setContact = (k, v) => setS((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));
  const toggleServices = (list) => {
    const added = list.find((x) => !s.services.includes(x));
    const next = added === "not_sure" ? ["not_sure"] : list.filter((x) => x !== "not_sure" || list.length === 1);
    set({ services: next });
  };

  function validate(step) {
    const e = {};
    if (step === 0 && !valid.length) e.services = "Choose at least one service";
    if (step === 1) {
      if (!s.goal || s.goal.trim().length < 5) e.goal = "Tell us briefly what you want to achieve";
      valid.forEach((svc) => cfg.questions[svc].forEach((q) => {
        if (q.required && !filled(s.answers[svc]?.[q.id])) e[`answers.${svc}.${q.id}`] = "Please answer this question";
      }));
    }
    if (step === 3) {
      const c = s.contact;
      if (!c.name || c.name.trim().length < 2) e["contact.name"] = "Please enter your name";
      if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e["contact.email"] = "Please enter a valid email";
      if (!c.company || !c.company.trim()) e["contact.company"] = "Please enter your company";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => validate(s.step) && set({ step: s.step + 1 });
  const back = () => set({ step: Math.max(0, s.step - 1) });

  async function submit() {
    setBusy(true); setFailure("");
    const answers = Object.fromEntries(valid.map((svc) => {
      const ids = new Set(cfg.questions[svc].map((q) => q.id));
      return [svc, Object.fromEntries(Object.entries(s.answers[svc] || {}).filter(([k, v]) => ids.has(k) && filled(v)))];
    }));
    const contact = Object.fromEntries(Object.entries(s.contact).filter(([, v]) => v && v.trim()));
    try {
      const r = await api.post("/leads", {
        channel: "quote_wizard", idempotency_key: idemKey("quote"), services: valid, goal: s.goal, answers,
        timing: s.timing || null, budget: s.budget ? { currency: s.currency || null, range: s.budget } : null,
        contact, attribution: getAttribution(), hp, elapsed_ms: Date.now() - started.current,
      });
      sessionStorage.removeItem(KEY);
      resetIdem("quote");
      sessionStorage.removeItem("azm_check_result");
      setDone(r.data.reference);
    } catch (err) {
      const map = errorMap(err);
      if (Object.keys(map).length) { setErrors(map); set({ step: stepOfError(Object.keys(map)[0]) }); }
      setFailure(errorText(err));
    } finally { setBusy(false); }
  }

  if (done) return <QuoteConfirmation reference={done} />;
  if (!cfg) return <div className="py-20 text-[#565a63]" data-testid="quote-loading">Loading questions…</div>;

  const ranges = s.currency ? cfg.budget_ranges[s.currency] || [] : [];
  const currencies = Object.keys(cfg.budget_ranges || {});
  const reviewRows = [
    ["Services", valid.map(labelOf).join(", "), 0, "services"],
    ["Goal", s.goal, 1, "goal"],
    ...valid.flatMap((svc) => cfg.questions[svc].filter((q) => filled(s.answers[svc]?.[q.id]))
      .map((q) => [`${labelOf(svc)} · ${q.label}`, [].concat(s.answers[svc][q.id]).join(", "), 1, `${svc}-${q.id}`])),
    ["Timing", s.timing || "Not given", 2, "timing"],
    ["Budget", s.budget ? `${s.budget}${s.currency ? ` (${s.currency})` : ""}` : "Not given", 2, "budget"],
    ["Contact", [s.contact.name, s.contact.email, s.contact.company, s.contact.country, s.contact.website, s.contact.phone].filter(Boolean).join(" · "), 3, "contact"],
  ];

  return (
    <div className="max-w-2xl relative" data-testid="quote-wizard">
      <Progress step={s.step} />
      <Honeypot value={hp} onChange={setHp} />
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-bold tracking-tight outline-none mb-6">{TITLES[s.step]}</h2>

      {s.step === 0 && (
        <MultiChoice id="quote-service" label="Choose one or more" required options={cfg.services} value={s.services} onChange={toggleServices} error={errors.services} />
      )}

      {s.step === 1 && (
        <div className="space-y-8">
          <TextArea id="quote-goal" label="Your business goal" required value={s.goal} onChange={(v) => set({ goal: v })} error={errors.goal} />
          {valid.map((svc) => (
            <section key={svc} className="space-y-5 border-t border-black/10 pt-6" data-testid={`quote-section-${svc}`}>
              <h3 className="font-display text-xl font-bold">{labelOf(svc)}</h3>
              {cfg.questions[svc].map((q) => (
                <Question key={q.id} svc={svc} q={q} value={s.answers[svc]?.[q.id]} onChange={(v) => setAns(svc, q.id, v)} error={errors[`answers.${svc}.${q.id}`]} />
              ))}
            </section>
          ))}
        </div>
      )}

      {s.step === 2 && (
        <div className="space-y-6">
          <ChoiceGroup id="quote-timing" label="When would you like to start?" options={cfg.timing} value={s.timing} onChange={(v) => set({ timing: v })} columns={2} error={errors.timing} />
          {currencies.length > 0 && <ChoiceGroup id="quote-currency" label="Budget currency" options={currencies} value={s.currency} onChange={(v) => set({ currency: v, budget: "" })} columns={2} />}
          <ChoiceGroup id="quote-budget" label={s.currency ? `Budget (${s.currency})` : "Budget"} options={[...ranges, "Not sure yet", "Prefer to discuss"]} value={s.budget} onChange={(v) => set({ budget: v })} columns={2} error={errors.budget} />
          <p className="text-sm text-[#6b6f78]">Both are optional. Ad spend for Meta campaigns is paid directly to Meta and is separate from our fee.</p>
        </div>
      )}

      {s.step === 3 && (
        <div className="grid sm:grid-cols-2 gap-5">
          <TextField id="quote-name" label="Name" required autoComplete="name" value={s.contact.name} onChange={(v) => setContact("name", v)} error={errors["contact.name"]} />
          <TextField id="quote-email" label="Email" type="email" required autoComplete="email" value={s.contact.email} onChange={(v) => setContact("email", v)} error={errors["contact.email"]} />
          <TextField id="quote-company" label="Company" required autoComplete="organization" value={s.contact.company} onChange={(v) => setContact("company", v)} error={errors["contact.company"]} />
          <div>
            <label htmlFor="quote-country" className="field-label">Country <span className="text-[#6b6f78] font-normal">(optional)</span></label>
            <select id="quote-country" value={s.contact.country || ""} onChange={(e) => setContact("country", e.target.value)} className="w-full rounded-xl bg-white border border-black/15 px-4 py-3" data-testid="quote-country">
              <option value="">Choose…</option>{cfg.countries.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <TextField id="quote-website" label="Website" autoComplete="url" value={s.contact.website} onChange={(v) => setContact("website", v)} error={errors["contact.website"]} />
          <TextField id="quote-phone" label="Phone" type="tel" autoComplete="tel" value={s.contact.phone} onChange={(v) => setContact("phone", v)} error={errors["contact.phone"]} />
        </div>
      )}

      {s.step === 4 && (
        <dl className="rounded-2xl bg-white border border-black/10 divide-y divide-black/10" data-testid="quote-review">
          {reviewRows.map(([k, v, step, id]) => (
            <div key={id} className="p-4 flex gap-4 justify-between">
              <div><dt className="text-sm text-[#6b6f78]">{k}</dt><dd className="mt-1 break-words">{v}</dd></div>
              <button type="button" onClick={() => set({ step })} className="text-[#2247FF] text-sm inline-flex items-center gap-1 shrink-0 self-start" aria-label={`Edit ${k}`} data-testid={`quote-edit-${id}`}>
                <Pencil size={14} /> Edit
              </button>
            </div>
          ))}
        </dl>
      )}

      {failure && (
        <div role="alert" className="mt-6 rounded-xl border border-[#c0182f]/30 bg-[#c0182f]/5 p-4 text-[#8a1020]" data-testid="quote-submit-error">
          {failure} <span className="block text-sm mt-1">Or <Link to="/contact" className="underline">contact us another way</Link>.</span>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {s.step > 0 ? <button type="button" onClick={back} className="btn-secondary" data-testid="quote-back-btn"><ArrowLeft size={16} /> Back</button> : <span />}
        {s.step < 4 ? (
          <button type="button" onClick={next} className="btn-cta" data-testid="quote-next-btn">{s.step === 3 ? "Review" : "Continue"} <ArrowRight size={16} /></button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="btn-cta disabled:opacity-60" data-testid="quote-submit-btn">
            {busy && <Loader2 size={16} className="animate-spin" />} {failure ? "Retry: submit quote request" : "Submit quote request"}
          </button>
        )}
      </div>
      <p className="mt-6 text-xs text-[#6b6f78]">This is a request for a scoped quote. We don't send automatic prices or delivery dates. See our <Link className="underline" to="/privacy">privacy information</Link>.</p>
    </div>
  );
}
