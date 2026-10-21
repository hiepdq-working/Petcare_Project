import { Pressable, RefreshControl, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { healthApi } from "../../../../features/health/api/health.api";
import { MedicalRecordStatusBadge } from "../../../../features/health/MedicalRecordStatusBadge";
import { extractErrorMessage } from "../../../../shared/api/client";
import { AppText } from "../../../../shared/components/AppText";
import { Card } from "../../../../shared/components/Card";
import { Screen } from "../../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../../shared/components/States";
import { formatDateTime } from "../../../../shared/utils/format";

export default function PetRecordsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["medical-records", "pet", id], queryFn: () => healthApi.listMedicalRecordsByPet(id) });

  return (
    <Screen refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data?.length === 0 ? (
        <EmptyState title="Chưa có hồ sơ bệnh án" description="Hồ sơ sẽ xuất hiện sau khi phòng khám khám cho bé." />
      ) : null}
      {query.data?.map((record) => (
        <Pressable
          key={record.id}
          onPress={() => router.push(`/record/${record.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Hồ sơ ngày ${formatDateTime(record.recordDate)}`}
        >
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <AppText variant="semi" style={{ flex: 1 }} numberOfLines={2}>
                {record.currentVersion?.diagnosis ?? record.currentVersion?.conclusion ?? "Hồ sơ khám bệnh"}
              </AppText>
              <MedicalRecordStatusBadge status={record.status} />
            </View>
            <AppText variant="small" tone="muted">
              {record.hospitalName ?? "Phòng khám"} · {record.vetName ?? "Bác sĩ"}
            </AppText>
            <AppText variant="caption" tone="muted">{formatDateTime(record.recordDate)}</AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
