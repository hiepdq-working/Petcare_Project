import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { petsApi } from "../../../features/pets/api/pets.api";
import { PromoBanner } from "../../../features/social/components/PromoBanner";
import { PostCard } from "../../../features/social/components/PostCard";
import { socialApi } from "../../../features/social/api/social.api";
import { usePostActions } from "../../../features/social/usePostActions";
import { useAuthStore } from "../../../features/auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Screen } from "../../../shared/components/Screen";
import { TabHeader } from "../../../shared/components/TabHeader";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { DEFAULT_PALETTE } from "../../../theme";

export default function FeedScreen() {
  const user = useAuthStore((state) => state.user);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const actions = usePostActions();

  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const promotionsQuery = useQuery({ queryKey: ["posts", "promotions"], queryFn: socialApi.listPromotions });
  const feedQuery = useQuery({ queryKey: ["posts", "feed"], queryFn: socialApi.listFeed, enabled: !activePetId });
  const petFeedQuery = useQuery({
    queryKey: ["posts", "pet", activePetId],
    queryFn: () => socialApi.listByPet(activePetId!),
    enabled: Boolean(activePetId),
  });
  const active = activePetId ? petFeedQuery : feedQuery;
  const posts = active.data ?? [];

  const refreshing = active.isRefetching;
  const refresh = () => {
    void active.refetch();
    void promotionsQuery.refetch();
  };

  return (
    <Screen topInset refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <TabHeader
        title="Bảng tin"
        right={
          <Pressable
            onPress={() => router.push("/post/new")}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: DEFAULT_PALETTE[700], alignItems: "center", justifyContent: "center" }}
            accessibilityLabel="Tạo bài viết mới"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        }
      />

      <PromoBanner promotions={promotionsQuery.data ?? []} />

      {(petsQuery.data?.length ?? 0) > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          <PetChip label="Tất cả" selected={activePetId === null} onPress={() => setActivePetId(null)} fallback="✨" />
          {petsQuery.data?.map((pet) => (
            <PetChip key={pet.id} label={pet.name} uri={pet.avatar} selected={activePetId === pet.id} onPress={() => setActivePetId(pet.id)} />
          ))}
        </ScrollView>
      ) : null}

      {active.isLoading ? <Loading /> : null}
      {active.isError ? <ErrorBanner message={extractErrorMessage(active.error)} /> : null}
      {!active.isLoading && posts.length === 0 ? (
        <EmptyState title="Chưa có bài viết nào" description="Bấm dấu + để chia sẻ khoảnh khắc đầu tiên." />
      ) : null}

      {posts.map((post) => (
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

function PetChip({ label, uri, selected, onPress, fallback }: { label: string; uri?: string | null; selected: boolean; onPress: () => void; fallback?: string }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 4 }}>
      <View style={{ padding: 3, borderRadius: 999, borderWidth: 2, borderColor: selected ? DEFAULT_PALETTE[700] : "transparent" }}>
        <Avatar uri={uri} size={52} fallback={fallback} />
      </View>
      <AppText variant="caption" style={{ fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium" }}>
        {label}
      </AppText>
    </Pressable>
  );
}
