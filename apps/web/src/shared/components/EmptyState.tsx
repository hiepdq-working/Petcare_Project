import type { ReactNode } from "react";
import { Card } from "./Card";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      {icon ? (
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          {icon}
        </span>
      ) : null}
      <p className="font-semibold text-brand-900">{title}</p>
      {description ? <p className="text-sm text-brand-700/70">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}
