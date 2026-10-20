import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Bookmark, Users } from "lucide-react";
import { socialApi } from "../../features/social/api/social.api";
import { PromoCard } from "../../features/social/components/PromoBanner";
import { groupsApi } from "../../features/groups/api/groups.api";
import { favoritesApi } from "../../features/favorites/api/favorites.api";
import { Card } from "../../shared/components/Card";
import { LoadingState } from "../../shared/components/LoadingState";


export function RightRail() {
  // Reuses the same feed data FeedPage shows (shared query cache) — filtered
  // to Hospital-authored posts to stand in for "quảng cáo hospital" with
  // real content instead of a fabricated ads feature.
  const feedQuery = useQuery({ queryKey: ["posts", "feed"], queryFn: socialApi.listFeed });
  const hospitalPosts = (feedQuery.data ?? []).filter((p) => p.hospitalId !== null).slice(0, 3);
  const promotionsQuery = useQuery({ queryKey: ["posts", "promotions"], queryFn: socialApi.listPromotions });
  const promotions = (promotionsQuery.data ?? []).slice(0, 2);
  const favoritesQuery = useQuery({ queryKey: ["favorites", "hospitals"], queryFn: favoritesApi.listHospitals });
  const groupsQuery = useQuery({ queryKey: ["groups", "mine"], queryFn: () => groupsApi.list(true) });
  const savedQuery = useQuery({ queryKey: ["posts", "saved"], queryFn: socialApi.listSaved });

  const shortcuts = [
    { to: "/favorites", icon: Heart, label: "Phòng khám yêu thích", count: favoritesQuery.data?.length },
    { to: "/saved", icon: Bookmark, label: "Bài viết đã lưu", count: savedQuery.data?.length },
    { to: "/groups", icon: Users, label: "Nhóm", count: groupsQuery.data?.length },
  ];

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 py-6 pl-4 lg:flex">
      {promotions.length > 0 ? (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-500">Khuyến mãi</p>
          <div className="flex flex-col gap-3">
            {promotions.map((post) => (
              <PromoCard key={post.id} post={post} compact />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-500">Từ các phòng khám</p>
        {feedQuery.isLoading ? <LoadingState /> : null}
        {!feedQuery.isLoading && hospitalPosts.length === 0 ? (
          <Card className="p-4 text-sm text-brand-700/60">Chưa có bài viết nào từ phòng khám.</Card>
        ) : null}
        <div className="flex flex-col gap-3">
          {hospitalPosts.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`}>
              <Card className="overflow-hidden transition hover:opacity-90">
                {post.media[0] ? (
                  <img src={post.media[0].mediaUrl} alt="" className="h-28 w-full object-cover" />
                ) : null}
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-brand-900">{post.hospitalName}</p>
                  {post.content ? <p className="line-clamp-2 text-xs text-brand-700/70">{post.content}</p> : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-500">Lối tắt</p>
        <Card className="flex flex-col p-1">
          {shortcuts.map(({ to, icon: Icon, label, count }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              <span className="flex items-center gap-2">
                <Icon size={16} /> {label}
              </span>
              {count ? <span className="text-xs font-semibold text-brand-500">{count}</span> : null}
            </Link>
          ))}
        </Card>
      </div>
    </aside>
  );
}
