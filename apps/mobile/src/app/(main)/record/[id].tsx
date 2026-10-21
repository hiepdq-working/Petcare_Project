import { useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { healthApi } from "../../../features/health/api/health.api";
import { AttachmentList } from "../../../features/health/AttachmentList";
import { MedicalRecordStatusBadge } from "../../../features/health/MedicalRecordStatusBadge";
import { extractErrorMessage } from "../../../shared/api/client";
import { AppText } from "../../../shared/components/AppText";
import { Card } from "../../../shared/components/Card";
import { Screen } from "../../../shared/components/Screen";
import { ErrorBanner, Loading } from "../../../shared/components/States";
import { formatDateTime } from "../../../shared/utils/format";

const FIELDS = [
  ["symptoms", "Triệu chứng"], ["cause", "Nguyên nhân"], ["diagnosis", "Chẩn đoán"],
  ["treatment", "Điều trị"], ["conclusion", "Kết luận"], ["notes", "Ghi chú"],
] as const;

export default function RecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["medical-records", id], queryFn: () => healthApi.getMedicalRecord(id) });

  const [showHistory, setShowHistory] = useState(false);

  if (query.isLoading) return <Screen><Loading /></Screen>;
  if (query.isError || !query.data) {
    return <Screen><ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /></Screen>;
  }
  const record = query.data;

  return (
    <Screen refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      <View style={{ gap: 6 }}>
        <AppText variant="display">Hồ sơ của {record.petName}</AppText>
        <MedicalRecordStatusBadge status={record.status} />
        <AppText variant="small" tone="muted">
          {record.hospitalName ?? "Phòng khám"} · {record.vetName ?? "Bác sĩ"} · {formatDateTime(record.recordDate)}
        </AppText>
      </View>
      <Card style={{ gap: 12 }}>
        {FIELDS.map(([key, label]) => {
          const value = record.currentVersion?.[key];
          return value ? (
            <View key={key}>
              <AppText variant="caption" tone="muted">{label}</AppText>
              <AppText>{value}</AppText>
            </View>
          ) : null;
        })}
        {!record.currentVersion || FIELDS.every(([key]) => !record.currentVersion?.[key]) ? (
          <AppText tone="muted">Chưa có nội dung khám.</AppText>
        ) : null}
      </Card>
      {record.files.length > 0 ? <AttachmentList files={record.files} /> : null}

      {record.versions.length > 1 ? (
        <>
          <Pressable onPress={() => setShowHistory((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showHistory }}>
            <AppText variant="semi" tone="brand">
              {showHistory ? "Ẩn" : "Xem"} lịch sử chỉnh sửa ({record.versions.length})
            </AppText>
          </Pressable>
          {showHistory
            ? [...record.versions]
                .sort((a, b) => b.versionNo - a.versionNo)
                .map((version) => (
                  <Card key={version.id} style={{ gap: 6 }}>
                    <AppText variant="semi">Phiên bản {version.versionNo} · {version.editedByName}</AppText>
                    <AppText variant="caption" tone="muted">{formatDateTime(version.createdAt)}</AppText>
                    {FIELDS.map(([key, label]) =>
                      version[key] ? (
                        <AppText key={key} variant="small">
                          <AppText variant="small" tone="muted">{label}: </AppText>
                          {version[key]}
                        </AppText>
                      ) : null,
                    )}
                  </Card>
                ))
            : null}
        </>
      ) : null}
    </Screen>
  );
}
