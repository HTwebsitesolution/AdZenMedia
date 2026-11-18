import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChoiceGroup, Honeypot, MultiChoice, TextArea, TextField } from "@/components/forms/Fields";
import { api, errorMap, errorText, getAttribution, idemKey, resetIdem, track } from "@/lib/api";
import { useConfig } from "@/lib/config";
import { QuoteConfirmation } from "./QuoteConfirmation";

const KEY = "azm_quote";
const STEPS = ["Service", "Goal", "Timing & budget", "Contact", "Review"];
const empty = { step: 0, service: "", goal: "", answers: {}, timing: "", currency: "", budget: "", contact: {} };

const load = () => { try { return { ...empty, ...JSON.parse(sessionStorage.getItem(KEY)) }; } catch { return empty; } };

function stepOfError(loc) {
  if (loc.startsWith("service")) return 0;
  if (loc.startsWith("goal") || loc.startsWith("answers")) return 1;
  if (loc.startsWith("timing") || loc.startsWith("budget")) return 2;
  return 3;
}

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

  useEffect(() => {
    const svc = params.get("service");
    let check = null;
    try { check = JSON.parse(sessionStorage.getItem("azm_check_result")); } catch { /* none */ }
    setS((p) => {
      const n = { ...p };
      if (svc && !p.service) n.service = svc;
      if (params.get("from") === "check" && check && !p.goal) {
        n.service = n.service || check.service;
        n.goal = `Systems check priority: ${check.priority}. `;
      }
      return n;
    });
    track("wizard_start", "quote_wizard");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!done) sessionStorage.setItem(KEY, JSON.stringify(s)); }, [s, done]);
  useEffect(() => { headingRef.current?.focus(); }, [s.step]);

  const questions = useMemo(() => (cfg && s.service ? cfg.questions[s.service] || [] : []), [cfg, s.service]);
  const set = (patch) => setS((p) => ({ ...p, ...patch }));
  const setAns = (id, v) => setS((p) => ({ ...p, answers: { ...p.answers, [id]: v } }));
  const setContact = (k, v) => setS((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));

  function validate(step) {
    const e = {};
    if (step === 0 && !s.service) e.service = "Choose what you need help with";
    if (step === 1) {
      if (!s.goal || s.goal.trim().length < 5) e.goal = "Tell us briefly what you want to improve";
      questions.forEach((q) => {
        const v = s.answers[q.id];
        if (q.required && (!v || (Array.isArray(v) && !v.length) || (typeof v === "string" && !v.trim()))) e[`answers.${q.id}`] = "Please answer this question";
      });
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
    const allowed = new Set(questions.map((q) => q.id));
    const answers = Object.fromEntries(Object.entries(s.answers).filter(([k, v]) => allowed.has(k) && v && v.length));
    const contact = Object.fromEntries(Object.entries(s.contact).filter(([, v]) => v && v.trim()));
    try {
      const r = await api.post("/leads", {
        channel: "quote_wizard", idempotency_key: idemKey("quote"), service: s.service, goal: s.goal, answers,
        timing: s.timing || null, budget: s.budget ? { currency: s.currency || null, range: s.budget } : null,
        contact, attribution: getAttribution(), hp, elapsed_ms: Date.now() - started.current,
      });
      sessionStorage.removeItem(KEY);
      resetIdem("quote");
      sessionStorage.removeItem("azm_check_result");
      setDone({ reference: r.data.reference, service: s.service });
    } catch (err) {
      const map = errorMap(err);
      if (Object.keys(map).length) {
        setErrors(map);
        set({ step: stepOfError(Object.keys(map)[0]) });
      }
      setFailure(errorText(err));
    } finally { setBusy(false); }
  }

  if (done) return <QuoteConfirmation reference={done.reference} />;
  if (!cfg) return <div className="py-20 text-slate-400" data-testid="quote-loading">Loading questions…</div>;

  const svcLabel = cfg.services.find((x) => x.id === s.service)?.label;
  const ranges = s.currency ? cfg.budget_ranges[s.currency] || [] : [];
  const currencies = Object.keys(cfg.budget_ranges || {});

  return (
    <div className="max-w-2xl" data-testid="quote-wizard">
      <div className="mb-8">
        <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
          <span data-testid="quote-step-indicator">Step {s.step + 1} of {STEPS.length}</span><span>{STEPS[s.step]}</span>
        </div>
        <Progress value={((s.step + 1) / STEPS.length) * 100} className="h-1.5 bg-white/10" aria-label="Quote progress" />
      </div>
      <Honeypot value={hp} onChange={setHp} />
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl sm:text-3xl font-bold tracking-tight outline-none mb-6">
        {["What do you need help with?", "What are you trying to improve?", "Project timing and budget", "Where should we reply?", "Review your request"][s.step]}
      </h2>

      {s.step === 0 && (
        <ChoiceGroup id="quote-service" label="Choose one" required options={cfg.services} value={s.service} onChange={(v) => set({ service: v })} error={errors.service} />
      )}

      {s.step === 1 && (
        <div className="space-y-6">
          <TextArea id="quote-goal" label="Your business goal" required value={s.goal} onChange={(v) => set({ goal: v })} error={errors.goal} />
          {questions.map((q) => {
            const props = { id: `quote-q-${q.id}`, label: q.label, required: q.required, value: s.answers[q.id], onChange: (v) => setAns(q.id, v), error: errors[`answers.${q.id}`] };
            if (q.type === "select") return <ChoiceGroup key={q.id} {...props} options={q.options} columns={2} />;
            if (q.type === "multi") return <MultiChoice key={q.id} {...props} options={q.options} />;
            if (q.type === "textarea") return <TextArea key={q.id} {...props} rows={3} />;
            return <TextField key={q.id} {...props} />;
          })}
        </div>
      )}

      {s.step === 2 && (
        <div className="space-y-6">
          <ChoiceGroup id="quote-timing" label="When would you like to start?" options={cfg.timing} value={s.timing} onChange={(v) => set({ timing: v })} columns={2} error={errors.timing} />
          {currencies.length > 0 && (
            <ChoiceGroup id="quote-currency" label="Budget currency" options={currencies} value={s.currency} onChange={(v) => set({ currency: v, budget: "" })} columns={2} />
          )}
          <ChoiceGroup id="quote-budget" label={s.currency ? `Budget (${s.currency})` : "Budget"} options={[...ranges, "Not sure yet", "Prefer to discuss"]} value={s.budget} onChange={(v) => set({ budget: v })} columns={2} error={errors.budget} />
          <p className="text-sm text-slate-500">Both are optional. We use them to suggest the right starting scope, not to set a price.</p>
        </div>
      )}

      {s.step === 3 && (
        <div className="grid sm:grid-cols-2 gap-5">
          <TextField id="quote-name" label="Name" required autoComplete="name" value={s.contact.name} onChange={(v) => setContact("name", v)} error={errors["contact.name"]} />
          <TextField id="quote-email" label="Email" type="email" required autoComplete="email" value={s.contact.email} onChange={(v) => setContact("email", v)} error={errors["contact.email"]} />
          <TextField id="quote-company" label="Company" required autoComplete="organization" value={s.contact.company} onChange={(v) => setContact("company", v)} error={errors["contact.company"]} />
          <div>
            <label htmlFor="quote-country" className="field-label">Country <span className="text-slate-500 font-normal">(optional)</span></label>
            <select id="quote-country" value={s.contact.country || ""} onChange={(e) => setContact("country", e.target.value)} className="w-full rounded-lg bg-[#0F141C] border border-white/15 px-4 py-3 text-white" data-testid="quote-country">
              <option value="">Choose…</option>
              {cfg.countries.map((c) => <option key={c}>{c}</option>)}
            </select>
            {errors["contact.country"] && <p className="field-error">{errors["contact.country"]}</p>}
          </div>
          <TextField id="quote-website" label="Website" autoComplete="url" value={s.contact.website} onChange={(v) => setContact("website", v)} error={errors["contact.website"]} />
          <TextField id="quote-phone" label="Phone" type="tel" autoComplete="tel" value={s.contact.phone} onChange={(v) => setContact("phone", v)} error={errors["contact.phone"]} />
        </div>
      )}

      {s.step === 4 && (
        <dl className="surface divide-y divide-white/10" data-testid="quote-review">
          {[
            ["Service", svcLabel, 0],
            ["Goal", s.goal, 1],
            ...questions.filter((q) => s.answers[q.id]?.length).map((q) => [q.label, [].concat(s.answers[q.id]).join(", "), 1]),
            ["Timing", s.timing || "Not given", 2],
            ["Budget", s.budget ? `${s.budget}${s.currency ? ` (${s.currency})` : ""}` : "Not given", 2],
            ["Contact", [s.contact.name, s.contact.email, s.contact.company, s.contact.country, s.contact.website, s.contact.phone].filter(Boolean).join(" · "), 3],
          ].map(([k, v, step]) => (
            <div key={k} className="p-4 flex gap-4 justify-between">
              <div><dt className="text-xs font-mono uppercase tracking-wider text-slate-500">{k}</dt><dd className="mt-1 text-slate-200 break-words">{v}</dd></div>
              <button type="button" onClick={() => set({ step })} className="text-amber-300 text-sm inline-flex items-center gap-1 shrink-0 self-start" data-testid={`quote-edit-${String(k).toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 30)}`}>
                <Pencil size={14} /> Edit
              </button>
            </div>
          ))}
        </dl>
      )}

      {failure && (
        <div role="alert" className="mt-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200" data-testid="quote-submit-error">
          {failure} <span className="block text-sm text-rose-300/80 mt-1">Or <Link to="/contact" className="underline">contact us another way</Link>.</span>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {s.step > 0 ? (
          <button type="button" onClick={back} className="btn-secondary" data-testid="quote-back-btn"><ArrowLeft size={16} /> Back</button>
        ) : <span />}
        {s.step < 4 ? (
          <button type="button" onClick={next} className="btn-primary" data-testid="quote-next-btn">{s.step === 3 ? "Review" : "Continue"} <ArrowRight size={16} /></button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="btn-primary disabled:opacity-60" data-testid="quote-submit-btn">
            {busy && <Loader2 size={16} className="animate-spin" />} {failure ? "Retry: submit quote request" : "Submit quote request"}
          </button>
        )}
      </div>
      <p className="mt-6 text-xs text-slate-500">This is a request for a scoped quote. We don't send automatic prices or delivery dates. See our <Link className="underline" to="/privacy">privacy information</Link>.</p>
    </div>
  );
}
