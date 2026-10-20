import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import type { PostDto } from "@petcare/types";

export function formatPromoEnd(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// One live promotion as a gradient card. Everything shown is the hospital's
// own data — nothing here is a placeholder.
export function PromoCard({ post, compact = false }: { post: PostDto; compact?: boolean }) {
  return (
    <Link
      to={`/posts/${post.id}`}
      className={`block shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-sm transition hover:opacity-95 ${
        compact ? "w-full p-4" : "w-72 snap-start p-5"
      }`}
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
        <Tag size={12} /> Khuyến mãi
      </span>
      <h3 className={`mt-2 font-display font-semibold leading-snug ${compact ? "text-base" : "text-lg"}`}>
        {post.promoTitle}
      </h3>
      {post.discountText ? (
        <p className={`mt-1 font-display font-bold ${compact ? "text-xl" : "text-2xl"}`}>{post.discountText}</p>
      ) : null}
      <p className="mt-2 text-xs text-brand-100">
        {post.hospitalName} · đến {formatPromoEnd(post.promoEndsAt)}
      </p>
    </Link>
  );
}

// Horizontal strip of live promotions (hidden entirely when there are none).
export function PromoBanner({ promotions }: { promotions: PostDto[] }) {
  if (promotions.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-brand-900">Khuyến mãi từ phòng khám</h2>
      <div className="flex snap-x gap-3 overflow-x-auto pb-1">
        {promotions.map((post) => (
          <PromoCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
