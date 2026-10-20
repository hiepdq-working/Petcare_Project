import { Image, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../../../features/groups/api/groups.api";
import { socialApi } from "../../../features/social/api/social.api";
import { PostCard } from "../../../features/social/components/PostCard";
import { usePostActions } from "../../../features/social/usePostActions";
import { useAuthStore } from "../../../features/auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { AppText } from "../../../shared/components/AppText";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { Screen } from "../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { DEFAULT_PALETTE } from "../../../theme";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const actions = usePostActions();

  const groupQuery = useQuery({ queryKey: ["groups", "detail", id], queryFn: () => groupsApi.getOne(id) });
  const group = groupQuery.data;
  const postsQuery = useQuery({
    queryKey: ["posts", "group", id],
    queryFn: () => socialApi.listByGroup(id),
    enabled: Boolean(group?.joinedByMe),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["groups"] });
  const joinMutation = useMutation({ mutationFn: () => groupsApi.join(id), onSuccess: () => { refresh(); void queryClient.invalidateQueries({ queryKey: ["posts"] }); } });
  const leaveMutation = useMutation({ mutationFn: () => groupsApi.leave(id), onSuccess: refresh });

  if (groupQuery.isLoading) return <Screen><Loading /></Screen>;
  if (groupQuery.isError || !group) return <Screen><ErrorBanner message={extractErrorMessage(groupQuery.error)} /></Screen>;

  return (
    <Screen>
      <Stack.Screen options={{ title: group.name }} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ height: 130, backgroundColor: DEFAULT_PALETTE[100], alignItems: "center", justifyContent: "center" }}>
          {group.cover ? <Image source={{ uri: group.cover }} style={{ width: "100%", height: 130 }} resizeMode="cover" /> : <AppText style={{ fontSize: 40 }}>👥</AppText>}
        </View>
        <View style={{ padding: 16, gap: 6 }}>
          <AppText variant="title">{group.name}</AppText>
          <AppText variant="small" tone="muted">{group.memberCount} thành viên · Chủ nhóm: {group.ownerName}</AppText>
          {group.description ? <AppText>{group.description}</AppText> : null}
          {group.joinedByMe ? (
            group.isOwner ? null : <Button title="Rời nhóm" variant="ghost" loading={leaveMutation.isPending} onPress={() => leaveMutation.mutate()} />
          ) : (
            <Button title="Tham gia nhóm" loading={joinMutation.isPending} onPress={() => joinMutation.mutate()} />
          )}
        </View>
      </Card>

      {joinMutation.isError ? <ErrorBanner message={extractErrorMessage(joinMutation.error)} /> : null}
      {leaveMutation.isError ? <ErrorBanner message={extractErrorMessage(leaveMutation.error)} /> : null}

      {!group.joinedByMe ? (
        <EmptyState title="Tham gia nhóm để xem và đăng bài viết" />
      ) : (
        <>
          <Button title="📷 Đăng bài trong nhóm" variant="secondary" onPress={() => router.push({ pathname: "/post/new", params: { groupId: id } })} />
          {postsQuery.isLoading ? <Loading /> : null}
          {postsQuery.isError ? <ErrorBanner message={extractErrorMessage(postsQuery.error)} /> : null}
          {!postsQuery.isLoading && postsQuery.data?.length === 0 ? <EmptyState title="Chưa có bài viết nào trong nhóm" description="Hãy chia sẻ khoảnh khắc đầu tiên." /> : null}
          {postsQuery.data?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={() => actions.toggleLike(post.id)}
              onToggleSave={() => actions.toggleSave(post.id)}
              onDelete={post.userId === user?.id || group.isOwner ? () => actions.confirmDelete(post.id) : undefined}
            />
          ))}
        </>
      )}
    </Screen>
  );
}
