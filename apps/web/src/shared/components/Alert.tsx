interface AlertProps {
  kind?: "error" | "success";
  message: string;
}

export function Alert({ kind = "error", message }: AlertProps) {
  const styles = kind === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-brand-50 text-brand-700 border-brand-200";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}
