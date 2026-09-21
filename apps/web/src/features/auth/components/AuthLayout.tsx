import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">🐾</div>
          <span className="text-lg font-bold text-brand-900">PetCare</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-brand-700/80">{subtitle}</p> : null}
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-brand-700/80">{footer}</div> : null}
      </div>
    </div>
  );
}
