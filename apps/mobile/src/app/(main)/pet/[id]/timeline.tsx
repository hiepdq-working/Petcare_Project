import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { PetEventDto, PetEventType } from "@petcare/types";
import { petsApi } from "../../../../features/pets/api/pets.api";
import { extractErrorMessage } from "../../../../shared/api/client";
import { Avatar } from "../../../../shared/components/Avatar";
import { AppText } from "../../../../shared/components/AppText";
import { Card } from "../../../../shared/components/Card";
import { Screen } from "../../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../../shared/components/States";
import { formatDateTime } from "../../../../shared/utils/format";
import { DEFAULT_PALETTE } from "../../../../theme";

const EVENT_ICON: Record<PetEventType, string> = {
  MEDICAL: "🏥", VACCINATION: "💉", WEIGHT: "⚖️", APPOINTMENT: "📅", SOCIAL_POST: "📷", SHOP_ORDER: "🛒",
  BIRTHDAY: "🎂", ADOPTION: "🏠", OWNERSHIP_TRANSFER: "🔄", AI_ALERT: "⚠️", REMINDER: "🔔",
};
const EVENT_LABEL: Record<PetEventType, string> = {
  MEDICAL: "Khám bệnh", VACCINATION: "Tiêm phòng", WEIGHT: "Cân nặng", APPOINTMENT: "Lịch hẹn", SOCIAL_POST: "Bài viết",
  SHOP_ORDER: "Đơn hàng", BIRTHDAY: "Sinh nhật", ADOPTION: "Nhận nuôi", OWNERSHIP_TRANSFER: "Chuyển chủ",
  AI_ALERT: "Cảnh báo", REMINDER: "Nhắc nhở",
};
const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

export default function TimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petQuery = useQuery({ queryKey: ["pets", id], queryFn: () => petsApi.get(id) });
  const timelineQuery = useQuery({ queryKey: ["pets", id, "timeline"], queryFn: () => petsApi.getTimeline(id) });

  const stats = useMemo(() => {
    const events = timelineQuery.data ?? [];
    const lastVaccination = events.filter((e) => e.eventType === "VACCINATION").sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0];
    return {
      posts: events.filter((e) => e.eventType === "SOCIAL_POST").length,
      checkups: events.filter((e) => e.eventType === "MEDICAL").length,
      lastVaccination: lastVaccination ? new Date(lastVaccination.eventDate).toLocaleDateString("vi-VN") : "Chưa có",
    };
  }, [timelineQuery.data]);

  const groups = useMemo(() => {
    const events = [...(timelineQuery.data ?? [])].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    const byMonth = new Map<string, PetEventDto[]>();
    for (const event of events) {
      const d = new Date(event.eventDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(event);
    }
    return Array.from(byMonth.entries()).map(([key, items]) => {
      const [yearStr, monthStr] = key.split("-");
      return { label: `${MONTHS[Number(monthStr)] ?? ""} ${yearStr}`, items };
    });
  }, [timelineQuery.data]);

  function open(event: PetEventDto) {
    if (event.eventType === "MEDICAL" && event.referenceId) router.push(`/record/${event.referenceId}`);
    else if (event.eventType === "VACCINATION") router.push(`/pet/${id}/vaccinations`);
  }

  const pet = petQuery.data;
  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar uri={pet?.avatar} size={64} />
        <View>
          <AppText variant="label" tone="brand">Digital Life</AppText>
          <AppText variant="display">{pet?.name ?? "Thú cưng"}</AppText>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Bài viết" value={String(stats.posts)} />
        <Stat label="Lần khám" value={String(stats.checkups)} />
        <Stat label="Mũi tiêm gần nhất" value={stats.lastVaccination} small />
      </View>

      {timelineQuery.isLoading ? <Loading /> : null}
      {timelineQuery.isError ? <ErrorBanner message={extractErrorMessage(timelineQuery.error)} /> : null}
      {!timelineQuery.isLoading && (timelineQuery.data?.length ?? 0) === 0 ? <EmptyState title="Chưa có sự kiện nào trong dòng thời gian" /> : null}

      {groups.map((group) => (
        <View key={group.label} style={{ gap: 10 }}>
          <AppText variant="label" tone="brand">{group.label}</AppText>
          {group.items.map((event, index) => {
            const title = (event.payload?.title as string | undefined) ?? EVENT_LABEL[event.eventType];
            const summary = event.payload?.summary as string | undefined;
            const isLast = index === group.items.length - 1;
            return (
              <Pressable key={event.id} onPress={() => open(event)} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: DEFAULT_PALETTE[100], alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 16 }}>{EVENT_ICON[event.eventType]}</AppText>
                  </View>
                  {!isLast ? <View style={{ width: 2, flex: 1, backgroundColor: DEFAULT_PALETTE[100], marginTop: 4 }} /> : null}
                </View>
                <Card style={{ flex: 1, padding: 12, marginBottom: 4 }}>
                  <AppText variant="semi">{title}</AppText>
                  {summary ? <AppText variant="small" tone="muted">{summary}</AppText> : null}
                  <AppText variant="caption" tone="muted" style={{ marginTop: 4 }}>{formatDateTime(event.eventDate)}</AppText>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <Card style={{ flex: 1, padding: 12, gap: 2 }}>
      <AppText variant={small ? "semi" : "title"} style={small ? { fontSize: 14 } : undefined}>{value}</AppText>
      <AppText variant="caption" tone="muted">{label}</AppText>
    </Card>
  );
}
