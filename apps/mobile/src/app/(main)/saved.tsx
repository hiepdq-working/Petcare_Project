import { RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "../../features/social/api/social.api";
import { PostCard } from "../../features/social/components/PostCard";
import { usePostActions } from "../../features/social/usePostActions";
import { useAuthStore } from "../../features/auth/store";
import { extractErrorMessage } from "../../shared/api/client";
import { Screen } from "../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../shared/components/States";

export default function SavedScreen() {
  const user = useAuthStore((state) => state.user);
  const actions = usePostActions();
  const query = useQuery({ queryKey: ["posts", "saved"], queryFn: socialApi.listSaved });
  return (
    <Screen refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Chưa có bài viết nào được lưu" description="Bấm Lưu ở dưới mỗi bài viết để xem lại sau." />
      ) : null}
      {query.data?.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onToggleLike={() => actions.toggleLike(post.id)}
          onToggleSave={() => actions.toggleSave(post.id)}
          onDelete={post.userId === user?.id ? () => actions.confirmDelete(post.id) : undefined}
        />
      ))}
    </Screen>
  );
}
