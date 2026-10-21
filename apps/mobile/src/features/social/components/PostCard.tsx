import { Linking, Pressable, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import type { PostDto } from "@petcare/types";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Card } from "../../../shared/components/Card";
import { formatDateTime } from "../../../shared/utils/format";
import { DEFAULT_PALETTE } from "../../../theme";

interface PostCardProps {
  post: PostDto;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onDelete?: () => void;
  // Detail screen: no link to itself.
  inDetail?: boolean;
}

export function PostCard({ post, onToggleLike, onToggleSave, onDelete, inDetail }: PostCardProps) {
  const isHospitalPost = post.hospitalId !== null;
  // Screen padding (16*2) + card padding (16*2). Explicit pixel sizes — Image
  // with only a % width + aspectRatio rendered blank on Android.
  const { width } = useWindowDimensions();
  const inner = width - 64;
  const imageSize = post.media.length === 1 ? inner : Math.floor((inner - 6) / 2);
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar uri={post.userAvatar} size={40} fallback={isHospitalPost ? "🏥" : "🙂"} />
        <View style={{ flex: 1 }}>
          <AppText variant="semi">
            {post.userName}
            {isHospitalPost ? <AppText variant="caption" tone="muted">  🏥 Phòng khám</AppText> : null}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatDateTime(post.createdAt)}
            {post.petName ? ` · 🐾 ${post.petName}` : ""}
            {post.vetName ? ` · 🩺 ${post.vetName}` : ""}
          </AppText>
          {post.groupName ? (
            <Pressable onPress={() => router.push(`/groups/${post.groupId}`)}>
              <AppText variant="caption" tone="brand">👥 {post.groupName}</AppText>
            </Pressable>
          ) : null}
        </View>
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Xoá bài viết">
            <AppText variant="small" tone="danger">Xoá</AppText>
          </Pressable>
        ) : null}
      </View>

      {post.kind === "PROMOTION" ? (
        <View style={{ backgroundColor: DEFAULT_PALETTE[700], borderRadius: 14, padding: 14, gap: 2 }}>
          <AppText variant="label" style={{ color: DEFAULT_PALETTE[100], fontSize: 10 }}>🏷️ Khuyến mãi</AppText>
          <AppText variant="title" tone="white">{post.promoTitle}</AppText>
          {post.discountText ? <AppText variant="display" tone="white" style={{ fontSize: 22 }}>{post.discountText}</AppText> : null}
          <AppText variant="caption" style={{ color: DEFAULT_PALETTE[100] }}>
            {post.promoStartsAt ? `Từ ${new Date(post.promoStartsAt).toLocaleDateString("vi-VN")} · ` : ""}
            Đến hết {post.promoEndsAt ? new Date(post.promoEndsAt).toLocaleDateString("vi-VN") : ""}
          </AppText>
        </View>
      ) : null}

      {post.content ? <AppText>{post.content}</AppText> : null}

      {post.media.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {post.media.map((m) => (
            <Image
              key={m.id}
              source={{ uri: m.mediaUrl }}
              style={{ width: imageSize, height: imageSize, borderRadius: 12, backgroundColor: DEFAULT_PALETTE[100] }}
              contentFit="cover"
            />
          ))}
        </View>
      ) : null}

      {isHospitalPost && post.hospitalLat !== null && post.hospitalLng !== null ? (
        <Pressable
          onPress={() => Linking.openURL(`geo:${post.hospitalLat},${post.hospitalLng}?q=${post.hospitalLat},${post.hospitalLng}(${encodeURIComponent(post.hospitalName ?? "Phòng khám")})`)}
          style={{ alignSelf: "flex-start", backgroundColor: DEFAULT_PALETTE[50], borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <AppText variant="small" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>
            📍 Xem vị trí {post.hospitalName ?? "phòng khám"} trên bản đồ
          </AppText>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 18, marginTop: 2 }}>
        <Pressable
          onPress={onToggleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${post.likedByMe ? "Bỏ thích" : "Thích"} bài viết, ${post.likeCount} lượt thích`}
          accessibilityState={{ selected: post.likedByMe }}
        >
          <AppText variant="small" style={{ fontFamily: "Inter_600SemiBold", color: post.likedByMe ? "#dc2626" : DEFAULT_PALETTE[800] }}>
            {post.likedByMe ? "❤️" : "🤍"} {post.likeCount}
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => !inDetail && router.push(`/post/${post.id}`)}
          hitSlop={8}
          accessibilityRole={inDetail ? "text" : "button"}
          accessibilityLabel={`${post.commentCount} bình luận`}
        >
          <AppText variant="small" style={{ fontFamily: "Inter_600SemiBold" }}>💬 {post.commentCount} bình luận</AppText>
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          hitSlop={8}
          style={{ marginLeft: "auto" }}
          accessibilityRole="button"
          accessibilityLabel={post.savedByMe ? "Bỏ lưu bài viết" : "Lưu bài viết"}
          accessibilityState={{ selected: post.savedByMe }}
        >
          <AppText variant="small" style={{ fontFamily: "Inter_600SemiBold", color: post.savedByMe ? DEFAULT_PALETTE[700] : DEFAULT_PALETTE[800] }}>
            {post.savedByMe ? "🔖 Đã lưu" : "🔖 Lưu"}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}
