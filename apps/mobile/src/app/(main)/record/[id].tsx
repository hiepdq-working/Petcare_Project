import { Linking, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { healthApi } from "../../../features/health/api/health.api";
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

  if (query.isLoading) return <Screen><Loading /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorBanner message={extractErrorMessage(query.error)} /></Screen>;
  const record = query.data;

  return (
    <Screen>
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
      {record.files.length > 0 ? (
        <View style={{ gap: 8 }}>
          <AppText variant="title">File đính kèm</AppText>
          {record.files.map((file) => (
            <Pressable key={file.id} onPress={() => Linking.openURL(file.fileUrl)}>
              <Card style={{ padding: 12 }}>
                <AppText tone="brand">📎 {file.fileName}</AppText>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
