const base = "w-full rounded-lg bg-[#0F141C] border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors";

export const TextField = ({ id, label, value, onChange, error, required, type = "text", hint, testid, ...rest }) => (
  <div>
    <label htmlFor={id} className="field-label">{label}{required ? <span className="text-amber-400"> *</span> : <span className="text-slate-500 font-normal"> (optional)</span>}</label>
    <input id={id} type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className={base}
      aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} required={required} data-testid={testid || id} {...rest} />
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
  </div>
);

export const TextArea = ({ id, label, value, onChange, error, required, testid, rows = 4 }) => (
  <div>
    <label htmlFor={id} className="field-label">{label}{required ? <span className="text-amber-400"> *</span> : <span className="text-slate-500 font-normal"> (optional)</span>}</label>
    <textarea id={id} rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} className={base}
      aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} maxLength={2000} data-testid={testid || id} />
    {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
  </div>
);

const optCls = (on) => `flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${on ? "border-amber-400 bg-amber-400/10 text-white" : "border-white/15 bg-[#0F141C] text-slate-300 hover:border-white/30"}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const ChoiceGroup = ({ id, label, options, value, onChange, error, required, columns = 1 }) => (
  <fieldset>
    <legend className="field-label">{label}{required ? <span className="text-amber-400"> *</span> : <span className="text-slate-500 font-normal"> (optional)</span>}</legend>
    <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.id;
        const text = typeof o === "string" ? o : o.label;
        return (
          <label key={val} className={optCls(value === val)} data-testid={`${id}-option-${slug(val)}`}>
            <input type="radio" name={id} value={val} checked={value === val} onChange={() => onChange(val)} className="accent-amber-400" />
            <span>{text}{o.hint && <span className="block text-xs text-slate-500">{o.hint}</span>}</span>
          </label>
        );
      })}
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
  </fieldset>
);

export const MultiChoice = ({ id, label, options, value = [], onChange, error, required }) => (
  <fieldset>
    <legend className="field-label">{label}{required ? <span className="text-amber-400"> *</span> : <span className="text-slate-500 font-normal"> (optional)</span>}</legend>
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <label key={o} className={optCls(on)} data-testid={`${id}-option-${slug(o)}`}>
            <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])} className="accent-amber-400" />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
  </fieldset>
);

export const Honeypot = ({ value, onChange }) => (
  <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
    <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="fax_number" /></label>
  </div>
);
