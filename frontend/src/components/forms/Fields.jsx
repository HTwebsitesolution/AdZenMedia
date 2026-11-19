const base = "w-full rounded-xl bg-white border border-black/15 px-4 py-3 text-[#15171C] placeholder:text-[#8a8d94] focus:border-[#2247FF] focus:outline-none focus:ring-2 focus:ring-[#2247FF]/20 transition-colors";
const opt = (on) => <span className="text-[#6b6f78] font-normal">{on ? "" : " (optional)"}</span>;

export const TextField = ({ id, label, value, onChange, error, required, type = "text", hint, testid, ...rest }) => (
  <div>
    <label htmlFor={id} className="field-label">{label}{required ? <span className="text-[#2247FF]"> *</span> : opt(false)}</label>
    <input id={id} type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className={base}
      aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} required={required} data-testid={testid || id} {...rest} />
    {hint && <p className="text-xs text-[#6b6f78] mt-1">{hint}</p>}
    {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
  </div>
);

export const TextArea = ({ id, label, value, onChange, error, required, testid, rows = 4 }) => (
  <div>
    <label htmlFor={id} className="field-label">{label}{required ? <span className="text-[#2247FF]"> *</span> : opt(false)}</label>
    <textarea id={id} rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} className={base}
      aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} maxLength={2000} data-testid={testid || id} />
    {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
  </div>
);

const optCls = (on) => `flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors duration-150 focus-within:ring-2 focus-within:ring-[#2247FF]/40 ${on ? "border-[#2247FF] bg-[#DFE5FF]" : "border-black/15 bg-white hover:border-black/30"}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const ChoiceGroup = ({ id, label, options, value, onChange, error, required, columns = 1 }) => (
  <fieldset>
    <legend className="field-label">{label}{required ? <span className="text-[#2247FF]"> *</span> : opt(false)}</legend>
    <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.id;
        const text = typeof o === "string" ? o : o.label;
        return (
          <label key={val} className={optCls(value === val)} data-testid={`${id}-option-${slug(val)}`}>
            <input type="radio" name={id} value={val} checked={value === val} onChange={() => onChange(val)} className="mt-1 accent-[#2247FF]" />
            <span>{text}{o.hint && <span className="block text-xs text-[#6b6f78]">{o.hint}</span>}</span>
          </label>
        );
      })}
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
  </fieldset>
);

export const MultiChoice = ({ id, label, options, value = [], onChange, error, required }) => (
  <fieldset>
    <legend className="field-label">{label}{required ? <span className="text-[#2247FF]"> *</span> : opt(false)}</legend>
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.id;
        const text = typeof o === "string" ? o : o.label;
        const on = value.includes(val);
        return (
          <label key={val} className={optCls(on)} data-testid={`${id}-option-${slug(val)}`}>
            <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== val) : [...value, val])} className="mt-1 accent-[#2247FF]" />
            <span>{text}{o.hint && <span className="block text-xs text-[#6b6f78]">{o.hint}</span>}</span>
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
