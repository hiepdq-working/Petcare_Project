import type { CSSProperties, ReactNode } from "react";
import { buildBrandScaleVars } from "../utils/brandScale";

// Wraps children in a scope that overrides the app's default --brand-*
// CSS variables with a hospital's chosen color, so every brand-* Tailwind
// class underneath (bg-brand-700, text-brand-900, ring-brand-200, ...)
// re-colors automatically. With no color, renders children unwrapped — the
// global :root default (index.css) applies as usual.
export function BrandScope({ color, children }: { color: string | null | undefined; children: ReactNode }) {
  if (!color) return <>{children}</>;
  return <div style={buildBrandScaleVars(color) as CSSProperties}>{children}</div>;
}
