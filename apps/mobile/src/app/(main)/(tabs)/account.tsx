import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { appointmentsApi } from "../../../features/appointments/api/appointments.api";
import { petsApi } from "../../../features/pets/api/pets.api";
import { useAuthStore } from "../../../features/auth/store";
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
  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const appointmentsQuery = useQuery({ queryKey: ["appointments", "mine"], queryFn: appointmentsApi.listMine });

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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <AppText variant="small" tone="muted">
            {greeting()}, {user?.name}
          </AppText>
          <AppText variant="display">Hôm nay bé cưng của bạn thế nào?</AppText>
        </View>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10} accessibilityLabel="Cài đặt">
          <Ionicons name="settings-outline" size={24} color={DEFAULT_PALETTE[700]} />
        </Pressable>
      </View>

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

      <View style={{ flexDirection: "row", gap: 12 }}>
        <QuickAction icon="medkit-outline" label="Tìm phòng khám" onPress={() => router.push("/discover")} />
        <QuickAction icon="calendar-outline" label="Lịch hẹn" onPress={() => router.push("/appointments")} />
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
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Card style={{ alignItems: "center", gap: 8, paddingVertical: 18 }}>
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
