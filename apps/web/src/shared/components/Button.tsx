import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  /** Defaults to true to match every existing call site. Pass false for inline/icon buttons. */
  fullWidth?: boolean;
}

const base = "rounded-xl px-4 py-3 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-600 shadow-sm",
  secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50",
};

export function Button({
  variant = "primary",
  loading,
  disabled,
  fullWidth = true,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
