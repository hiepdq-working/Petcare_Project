import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "../api/social.api";
import { PostCard } from "../components/PostCard";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

export function SavedPostsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["posts", "saved"], queryFn: socialApi.listSaved });

  const likeMutation = useMutation({
    mutationFn: (id: string) => socialApi.toggleLike(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
  const saveMutation = useMutation({
    mutationFn: (id: string) => socialApi.toggleSave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Bài viết đã lưu</h1>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Chưa có bài viết nào được lưu" description="Bấm Lưu ở dưới mỗi bài viết để xem lại sau." />
      ) : null}

      <div className="flex flex-col gap-4">
        {query.data?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onToggleLike={() => likeMutation.mutate(post.id)}
            onToggleSave={() => saveMutation.mutate(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
