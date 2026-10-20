export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function formatPrice(price: number | null): string {
  return price === null ? "Liên hệ" : `${price.toLocaleString("vi-VN")} đ`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// Local date components, not UTC — see the equivalent helper in apps/web.
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
