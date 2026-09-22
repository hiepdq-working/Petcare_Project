import type { ReactNode } from "react";
import { Card } from "./Card";

type TileTone = "blue" | "coral" | "mint" | "amber" | "violet";

const TILE_STYLES: Record<TileTone, string> = {
  blue: "bg-sky-100 text-sky-700",
  coral: "bg-rose-100 text-rose-600",
  mint: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
};

interface StatCardProps {
  icon: ReactNode;
  tone?: TileTone;
  value: ReactNode;
  label: string;
  trend?: string;
}

export function StatCard({ icon, tone = "mint", value, label, trend }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TILE_STYLES[tone]}`}>{icon}</span>
        {trend ? <span className="text-xs font-semibold text-brand-500">{trend}</span> : null}
      </div>
      <div>
        <p className="font-display text-2xl font-semibold text-brand-900">{value}</p>
        <p className="text-sm text-brand-700/70">{label}</p>
      </div>
    </Card>
  );
}
