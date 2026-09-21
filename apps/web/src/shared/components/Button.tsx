import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const base = "w-full rounded-xl px-4 py-3 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-600",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50",
};

export function Button({ variant = "primary", loading, disabled, children, className, ...rest }: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
