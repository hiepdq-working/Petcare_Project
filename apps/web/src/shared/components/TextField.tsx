import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className, ...rest }: TextFieldProps) {
  const inputId = id ?? label;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-brand-900">
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-xl border px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200 ${
          error ? "border-red-400" : "border-brand-200"
        } ${className ?? ""}`}
        {...rest}
      />
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
