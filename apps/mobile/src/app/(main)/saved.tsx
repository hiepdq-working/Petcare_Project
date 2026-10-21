import { RefreshControl, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "../../features/social/api/social.api";
import { PostCard } from "../../features/social/components/PostCard";
import { usePostActions } from "../../features/social/usePostActions";
import { useAuthStore } from "../../features/auth/store";
import { extractErrorMessage } from "../../shared/api/client";
import { ListScreen } from "../../shared/components/ListScreen";
import { EmptyState, ErrorBanner, Loading } from "../../shared/components/States";

export default function SavedScreen() {
  const user = useAuthStore((state) => state.user);
  const actions = usePostActions();
  const query = useQuery({ queryKey: ["posts", "saved"], queryFn: socialApi.listSaved });
  return (
    <ListScreen
      data={query.data ?? []}
      keyExtractor={(post) => post.id}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      ListHeaderComponent={
        query.isLoading || query.isError ? (
          <View style={{ gap: 14 }}>
            {query.isLoading ? <Loading /> : null}
            {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        query.isLoading || query.isError ? undefined : (
          <EmptyState title="Chưa có bài viết nào được lưu" description="Bấm Lưu ở dưới mỗi bài viết để xem lại sau." />
        )
      }
      renderItem={({ item: post }) => (
        <PostCard
          post={post}
          onToggleLike={() => actions.toggleLike(post.id)}
          onToggleSave={() => actions.toggleSave(post.id)}
          onDelete={post.userId === user?.id ? () => actions.confirmDelete(post.id) : undefined}
        />
      )}
    />
  );
}
