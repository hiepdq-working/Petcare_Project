import type { ReactNode } from "react";

export type BadgeTone = "brand" | "amber" | "blue" | "green" | "red" | "violet" | "neutral";

const TONE_STYLES: Record<BadgeTone, string> = {
  brand: "bg-brand-100 text-brand-800",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-700",
  neutral: "bg-brand-50 text-brand-700/80",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_STYLES[tone]}`}>
      {children}
    </span>
  );
}
