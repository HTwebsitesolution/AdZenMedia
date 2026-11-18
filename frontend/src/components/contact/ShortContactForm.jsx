import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Honeypot, TextArea, TextField } from "@/components/forms/Fields";
import { api, errorMap, errorText, getAttribution, idemKey, resetIdem } from "@/lib/api";
import { QuoteConfirmation } from "@/components/quote/QuoteConfirmation";

const KEY = "azm_contact_form";

export const ShortContactForm = () => {
  const [f, setF] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; } });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [ref, setRef] = useState(null);
  const [hp, setHp] = useState("");
  const started = useRef(Date.now());

  const set = (k, v) => setF((p) => { const n = { ...p, [k]: v }; sessionStorage.setItem(KEY, JSON.stringify(n)); return n; });

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!f.name || f.name.trim().length < 2) errs["contact.name"] = "Please enter your name";
    if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs["contact.email"] = "Please enter a valid email";
    if (!f.company || !f.company.trim()) errs["contact.company"] = "Please enter your company";
    if (!f.message || f.message.trim().length < 5) errs.message = "Please add a short message";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setFailure("");
    try {
      const r = await api.post("/leads", {
        channel: "contact_form", idempotency_key: idemKey("contact"), message: f.message,
        contact: { name: f.name, email: f.email, company: f.company },
        attribution: getAttribution(), hp, elapsed_ms: Date.now() - started.current,
      });
      sessionStorage.removeItem(KEY); resetIdem("contact");
      setRef(r.data.reference);
    } catch (err) {
      setErrors(errorMap(err)); setFailure(errorText(err));
    } finally { setBusy(false); }
  }

  if (ref) return <QuoteConfirmation reference={ref} kind="message" />;
  return (
    <form onSubmit={submit} noValidate className="space-y-5 relative" data-testid="contact-form">
      <Honeypot value={hp} onChange={setHp} />
      <div className="grid sm:grid-cols-2 gap-5">
        <TextField id="contact-name" label="Name" required autoComplete="name" value={f.name} onChange={(v) => set("name", v)} error={errors["contact.name"]} />
        <TextField id="contact-email" label="Email" type="email" required autoComplete="email" value={f.email} onChange={(v) => set("email", v)} error={errors["contact.email"]} />
      </div>
      <TextField id="contact-company" label="Company" required autoComplete="organization" value={f.company} onChange={(v) => set("company", v)} error={errors["contact.company"]} />
      <TextArea id="contact-message" label="Your question" required value={f.message} onChange={(v) => set("message", v)} error={errors.message} />
      {failure && <p role="alert" className="text-rose-300 text-sm" data-testid="contact-form-error">{failure}</p>}
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60" data-testid="contact-form-submit">
        {busy && <Loader2 size={16} className="animate-spin" />} {failure ? "Try again" : "Send message"}
      </button>
    </form>
  );
};
