import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import type { PostDto } from "@petcare/types";
import { AppText } from "../../../shared/components/AppText";
import { DEFAULT_PALETTE } from "../../../theme";

function formatEnd(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "";
}

export function PromoCard({ post, width = 270 }: { post: PostDto; width?: number }) {
  return (
    <Pressable onPress={() => router.push(`/post/${post.id}`)} style={{ width }}>
      <View style={{ backgroundColor: DEFAULT_PALETTE[700], borderRadius: 18, padding: 16, gap: 4 }}>
        <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
          <AppText variant="label" tone="white" style={{ fontSize: 10 }}>
            🏷️ Khuyến mãi
          </AppText>
        </View>
        <AppText variant="title" tone="white" numberOfLines={2}>
          {post.promoTitle}
        </AppText>
        {post.discountText ? (
          <AppText variant="display" tone="white" style={{ fontSize: 22 }}>
            {post.discountText}
          </AppText>
        ) : null}
        <AppText variant="caption" style={{ color: DEFAULT_PALETTE[100] }}>
          {post.hospitalName} · đến {formatEnd(post.promoEndsAt)}
        </AppText>
      </View>
    </Pressable>
  );
}

// Live promotions strip; renders nothing when there are none.
export function PromoBanner({ promotions }: { promotions: PostDto[] }) {
  if (promotions.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="title">Khuyến mãi từ phòng khám</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {promotions.map((post) => (
          <PromoCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
}
