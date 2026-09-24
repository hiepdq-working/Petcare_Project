import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "../../social/api/social.api";
import { PostCard } from "../../social/components/PostCard";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

export function AdminFeedPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "posts"], queryFn: socialApi.adminListAll });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialApi.adminRemove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });

  function handleDelete(id: string) {
    if (window.confirm("Xoá bài viết này khỏi hệ thống?")) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Quản trị</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Kiểm duyệt bảng tin</h1>
      <p className="mt-1 text-sm text-brand-700/70">Xem toàn bộ bài viết trong hệ thống và xoá nội dung vi phạm.</p>

      <div className="mt-6 flex flex-col gap-4">
        {query.isLoading ? <LoadingState /> : null}
        {!query.isLoading && query.data?.length === 0 ? <EmptyState title="Chưa có bài viết nào" /> : null}
        {query.data?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            canDelete
            onToggleLike={() => {}}
            onDelete={() => handleDelete(post.id)}
            linkToDetail={false}
          />
        ))}
      </div>
    </div>
  );
}
