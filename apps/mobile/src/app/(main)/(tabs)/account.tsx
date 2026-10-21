import { Pressable, RefreshControl, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { appointmentsApi } from "../../../features/appointments/api/appointments.api";
import { petsApi } from "../../../features/pets/api/pets.api";
import { useAuthStore } from "../../../features/auth/store";
import { PromoBanner } from "../../../features/social/components/PromoBanner";
import { socialApi } from "../../../features/social/api/social.api";
import { TabHeader } from "../../../shared/components/TabHeader";
import { PillTabs } from "../../../shared/components/PillTabs";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Card } from "../../../shared/components/Card";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { Screen } from "../../../shared/components/Screen";
import { extractErrorMessage } from "../../../shared/api/client";
import { formatAge } from "../../../shared/utils/pet";
import { greeting } from "../../../shared/utils/format";
import { DEFAULT_PALETTE } from "../../../theme";

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - 32 - 12) / 3);
  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const appointmentsQuery = useQuery({ queryKey: ["appointments", "mine"], queryFn: appointmentsApi.listMine });

  const feedQuery = useQuery({ queryKey: ["posts", "feed"], queryFn: socialApi.listFeed });
  const promotionsQuery = useQuery({ queryKey: ["posts", "promotions"], queryFn: socialApi.listPromotions });
  const [momentsTab, setMomentsTab] = useState<"photo" | "video">("photo");
  const myPhotos = (feedQuery.data ?? []).filter((p) => p.userId === user?.id && p.media.length > 0);

  const nextAppointment = (appointmentsQuery.data ?? [])
    .filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED" && new Date(a.dateTime).getTime() > Date.now())
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))[0];

  const refreshing = petsQuery.isRefetching || appointmentsQuery.isRefetching;
  const refresh = () => {
    void petsQuery.refetch();
    void appointmentsQuery.refetch();
  };

  return (
    <Screen topInset refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <TabHeader
        title="Tài khoản"
        subtitle={`${greeting()}, ${user?.name}`}
        right={
          <Pressable onPress={() => router.push("/settings")} hitSlop={10} accessibilityLabel="Cài đặt">
            <Ionicons name="settings-outline" size={24} color={DEFAULT_PALETTE[700]} />
          </Pressable>
        }
      />

      <Pressable onPress={() => router.push("/appointments")}>
        <View style={{ backgroundColor: DEFAULT_PALETTE[700], borderRadius: 20, padding: 20, gap: 4 }}>
          {nextAppointment ? (
            <>
              <AppText variant="label" style={{ color: DEFAULT_PALETTE[100] }}>
                Lịch hẹn sắp tới
              </AppText>
              <AppText variant="title" tone="white">
                {nextAppointment.petName} · {nextAppointment.serviceName}
              </AppText>
              <AppText variant="small" style={{ color: DEFAULT_PALETTE[100] }}>
                {nextAppointment.hospitalName} ·{" "}
                {new Date(nextAppointment.dateTime).toLocaleString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="title" tone="white">
                Chăm bé thật tốt mỗi ngày
              </AppText>
              <AppText variant="small" style={{ color: DEFAULT_PALETTE[100] }}>
                Theo dõi sức khoẻ, đặt lịch khám và lưu lại khoảnh khắc cùng bé cưng của bạn.
              </AppText>
            </>
          )}
        </View>
      </Pressable>

      <PromoBanner promotions={promotionsQuery.data ?? []} />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <QuickAction icon="calendar-outline" label="Lịch hẹn" onPress={() => router.push("/appointments")} />
        <QuickAction icon="heart-outline" label="Yêu thích" onPress={() => router.push("/favorites")} />
        <QuickAction icon="bookmark-outline" label="Đã lưu" onPress={() => router.push("/saved")} />
        <QuickAction icon="people-outline" label="Nhóm" onPress={() => router.push("/groups")} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <AppText variant="title">Thú cưng của tôi</AppText>
        <Pressable onPress={() => router.push("/pet/new")} hitSlop={8}>
          <AppText variant="semi" tone="brand">
            + Thêm thú cưng
          </AppText>
        </Pressable>
      </View>

      {petsQuery.isLoading ? <Loading /> : null}
      {petsQuery.isError ? <ErrorBanner message={extractErrorMessage(petsQuery.error)} /> : null}
      {!petsQuery.isLoading && petsQuery.data?.length === 0 ? (
        <EmptyState title="Bạn chưa có thú cưng nào" description="Thêm hồ sơ để đặt lịch khám và theo dõi sức khoẻ." />
      ) : null}
      {petsQuery.data?.map((pet) => {
        const age = formatAge(pet.birthDate);
        return (
          <Pressable key={pet.id} onPress={() => router.push(`/pet/${pet.id}`)}>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Avatar uri={pet.avatar} size={60} radius={16} />
              <View style={{ flex: 1 }}>
                <AppText variant="semi">{pet.name}</AppText>
                <AppText variant="small" tone="muted">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                  {age ? ` · ${age}` : ""}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={DEFAULT_PALETTE[400]} />
            </Card>
          </Pressable>
        );
      })}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <AppText variant="title">Khoảnh khắc đáng yêu</AppText>
      </View>
      <PillTabs
        tabs={[{ value: "photo", label: "Ảnh" }, { value: "video", label: "Video" }]}
        value={momentsTab}
        onChange={setMomentsTab}
      />
      {momentsTab === "video" ? <EmptyState title="Chưa hỗ trợ video" description="Hiện bạn chỉ có thể chia sẻ ảnh." /> : null}
      {momentsTab === "photo" && myPhotos.length === 0 ? (
        <EmptyState title="Chưa có ảnh nào" description="Ảnh bạn đăng ở Bảng tin sẽ hiện ở đây." />
      ) : null}
      {momentsTab === "photo" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {myPhotos.map((post) => (
            <Pressable key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
              <Image source={{ uri: post.media[0]!.mediaUrl }} style={{ width: tile, height: tile, borderRadius: 12, backgroundColor: DEFAULT_PALETTE[100] }} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Card style={{ alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 4 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: DEFAULT_PALETTE[100], alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={icon} size={22} color={DEFAULT_PALETTE[700]} />
        </View>
        <AppText variant="small" style={{ fontFamily: "Inter_500Medium" }}>
          {label}
        </AppText>
      </Card>
    </Pressable>
  );
}
