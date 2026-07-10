export function FieldRow({ children, cols = 1 }) {
  const colClass = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-1";
  return <div className={`grid grid-cols-1 gap-4 ${colClass}`}>{children}</div>;
}

function Label({ label, required, hint }) {
  if (!label) return null;
  return (
    <label className="mb-1 flex items-baseline justify-between text-sm font-medium text-brand-950">
      <span>
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {hint && <span className="text-xs font-normal text-brand-900/40">{hint}</span>}
    </label>
  );
}

const baseInput =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 shadow-sm outline-none transition placeholder:text-brand-900/30 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-brand-50 disabled:text-brand-900/40";

export function TextField({ label, required, hint, className = "", ...props }) {
  return (
    <div className={className}>
      <Label label={label} required={required} hint={hint} />
      <input className={baseInput} {...props} />
    </div>
  );
}

export function TextAreaField({ label, required, hint, className = "", ...props }) {
  return (
    <div className={className}>
      <Label label={label} required={required} hint={hint} />
      <textarea className={`${baseInput} min-h-[88px] resize-y`} {...props} />
    </div>
  );
}

export function SelectField({ label, required, hint, className = "", children, ...props }) {
  return (
    <div className={className}>
      <Label label={label} required={required} hint={hint} />
      <select className={baseInput} {...props}>
        {children}
      </select>
    </div>
  );
}

export function CheckboxField({ label, className = "", ...props }) {
  return (
    <label className={`flex items-start gap-2 text-sm text-brand-900/70 ${className}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-300" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function PillCheckboxGroup({ label, required, options, values, onToggle }) {
  return (
    <div>
      <Label label={label} required={required} />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-brand-400 bg-brand-500 text-white"
                  : "border-brand-200 bg-white text-brand-900/60 hover:bg-brand-50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
