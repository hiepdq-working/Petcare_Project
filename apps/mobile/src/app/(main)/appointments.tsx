import { Alert, RefreshControl, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppointmentStatus } from "@petcare/types";
import { appointmentsApi } from "../../features/appointments/api/appointments.api";
import { extractErrorMessage } from "../../shared/api/client";
import { AppText } from "../../shared/components/AppText";
import { Badge, type BadgeTone } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { Screen } from "../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../shared/components/States";
import { formatDateTime } from "../../shared/utils/format";

const LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", IN_PROGRESS: "Đang khám", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
};
const TONES: Record<AppointmentStatus, BadgeTone> = {
  PENDING: "amber", CONFIRMED: "brand", IN_PROGRESS: "blue", COMPLETED: "green", CANCELLED: "red",
};

export default function AppointmentsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["appointments", "mine"], queryFn: appointmentsApi.listMine });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancelMine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  function confirmCancel(id: string) {
    Alert.alert("Huỷ lịch hẹn?", "Phòng khám sẽ nhận được thông báo huỷ.", [
      { text: "Giữ lịch", style: "cancel" },
      { text: "Huỷ lịch", style: "destructive", onPress: () => cancelMutation.mutate(id) },
    ]);
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} /> : null}
      {cancelMutation.isError ? <ErrorBanner message={extractErrorMessage(cancelMutation.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Bạn chưa có lịch hẹn nào" description="Vào tab Khám phá để chọn phòng khám và đặt lịch." />
      ) : null}
      {query.data?.map((a) => (
        <Card key={a.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <AppText variant="semi" style={{ flex: 1 }}>{a.petName} · {a.serviceName}</AppText>
            <Badge tone={TONES[a.status]}>{LABELS[a.status]}</Badge>
          </View>
          <AppText variant="small" tone="muted">{a.hospitalName}</AppText>
          <AppText variant="small">{formatDateTime(a.dateTime)}</AppText>
          {a.vetName ? <AppText variant="small" tone="muted">Bác sĩ mong muốn: {a.vetName}</AppText> : null}
          {a.notes ? <AppText variant="small" tone="muted">{a.notes}</AppText> : null}
          {a.status === "PENDING" || a.status === "CONFIRMED" ? (
            <Button title="Huỷ lịch hẹn" variant="danger" onPress={() => confirmCancel(a.id)} style={{ minHeight: 40, marginTop: 4 }} />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
