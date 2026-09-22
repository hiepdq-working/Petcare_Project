import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Optional leading icon, matching the icon-prefixed inputs in the register mockups. */
  icon?: ReactNode;
}

export function TextField({ label, error, icon, id, className, ...rest }: TextFieldProps) {
  const inputId = id ?? label;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-brand-900">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-brand-400">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200 ${
            icon ? "pl-10" : ""
          } ${error ? "border-red-400" : "border-brand-200"} ${className ?? ""}`}
          {...rest}
        />
      </div>
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
