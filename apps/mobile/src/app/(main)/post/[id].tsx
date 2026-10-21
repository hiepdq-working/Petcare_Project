import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostCommentDto } from "@petcare/types";
import { socialApi } from "../../../features/social/api/social.api";
import { PostCard } from "../../../features/social/components/PostCard";
import { usePostActions } from "../../../features/social/usePostActions";
import { useAuthStore } from "../../../features/auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { Screen } from "../../../shared/components/Screen";
import { ErrorBanner, Loading } from "../../../shared/components/States";
import { TextField } from "../../../shared/components/TextField";
import { timeAgo } from "../../../shared/utils/format";
import { queryRefreshControl } from "../../../shared/components/queryRefresh";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const actions = usePostActions();
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<PostCommentDto | null>(null);

  const query = useQuery({ queryKey: ["posts", id], queryFn: () => socialApi.getOne(id) });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["posts"] });

  const addComment = useMutation({
    mutationFn: () => socialApi.addComment(id, { content: comment.trim(), parentId: replyTo?.id }),
    onSuccess: () => {
      setComment("");
      setReplyTo(null);
      refresh();
    },
  });
  const removeComment = useMutation({ mutationFn: (commentId: string) => socialApi.removeComment(id, commentId), onSuccess: refresh });

  function confirmDeleteComment(commentId: string) {
    Alert.alert("Xoá bình luận?", undefined, [
      { text: "Giữ lại", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: () => removeComment.mutate(commentId) },
    ]);
  }

  if (query.isLoading) return <Screen><Loading /></Screen>;
  if (query.isError || !query.data) {
    return <Screen><ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /></Screen>;
  }
  const { post, comments } = query.data;
  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  function renderComment(c: PostCommentDto, depth: number) {
    return (
      <View key={c.id} style={{ flexDirection: "row", gap: 10, marginLeft: depth * 28 }}>
        <Avatar uri={c.userAvatar} size={32} fallback={c.userRole === "HOSPITAL_OWNER" ? "🏥" : "🙂"} />
        <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 10, gap: 2 }}>
          <AppText variant="small" style={{ fontFamily: "Inter_600SemiBold" }}>
            {c.userName}
            {c.userRole === "HOSPITAL_OWNER" ? <AppText variant="caption" tone="brand">  🏥 Phòng khám</AppText> : null}
          </AppText>
          <AppText variant="small">{c.content}</AppText>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 2 }}>
            <AppText variant="caption" tone="muted">{timeAgo(c.createdAt)}</AppText>
            {depth === 0 ? (
              <Pressable onPress={() => setReplyTo(c)}>
                <AppText variant="caption" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>Trả lời</AppText>
              </Pressable>
            ) : null}
            {c.userId === user?.id ? (
              <Pressable onPress={() => confirmDeleteComment(c.id)}>
                <AppText variant="caption" tone="danger">Xoá</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <Screen refreshControl={queryRefreshControl(query)}>
      <PostCard
        post={post}
        inDetail
        onToggleLike={() => actions.toggleLike(post.id)}
        onToggleSave={() => actions.toggleSave(post.id)}
        onDelete={post.userId === user?.id ? () => actions.confirmDelete(post.id, () => router.back()) : undefined}
      />

      <AppText variant="title">Bình luận</AppText>
      {roots.length === 0 ? <AppText variant="small" tone="muted">Chưa có bình luận nào.</AppText> : null}
      {roots.map((c) => (
        <View key={c.id} style={{ gap: 8 }}>
          {renderComment(c, 0)}
          {repliesOf(c.id).map((r) => renderComment(r, 1))}
        </View>
      ))}

      <Card style={{ gap: 10 }}>
        {replyTo ? (
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="small" tone="muted">Đang trả lời {replyTo.userName}</AppText>
            <Pressable onPress={() => setReplyTo(null)}><AppText variant="small" tone="danger">Huỷ</AppText></Pressable>
          </View>
        ) : null}
        {addComment.isError ? <ErrorBanner message={extractErrorMessage(addComment.error)} /> : null}
        <TextField value={comment} onChangeText={setComment} placeholder="Viết bình luận..." multiline />
        <Button title="Gửi bình luận" loading={addComment.isPending} disabled={!comment.trim()} onPress={() => addComment.mutate()} />
      </Card>
    </Screen>
  );
}
