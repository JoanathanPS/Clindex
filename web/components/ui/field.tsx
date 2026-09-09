import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export const inputClass =
  "field-input placeholder:text-ink/40";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="console-label mb-2 block">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-ink/50">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      )}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClass} {...props} />;
}
