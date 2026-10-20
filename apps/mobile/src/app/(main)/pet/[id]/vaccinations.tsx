import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { healthApi } from "../../../../features/health/api/health.api";
import { extractErrorMessage } from "../../../../shared/api/client";
import { AppText } from "../../../../shared/components/AppText";
import { Button } from "../../../../shared/components/Button";
import { Card } from "../../../../shared/components/Card";
import { DateField } from "../../../../shared/components/DateField";
import { Screen } from "../../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../../shared/components/States";
import { TextField } from "../../../../shared/components/TextField";
import { formatDate, toDateKey } from "../../../../shared/utils/format";

export default function VaccinationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["vaccinations", id], queryFn: () => healthApi.listVaccinations(id) });
  const [showForm, setShowForm] = useState(false);
  const [vaccineName, setVaccineName] = useState("");
  const [dateGiven, setDateGiven] = useState<Date | null>(new Date());
  const [nextDue, setNextDue] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      healthApi.createVaccination({
        petId: id,
        vaccineName: vaccineName.trim(),
        dateGiven: toDateKey(dateGiven!),
        nextDueDate: nextDue ? toDateKey(nextDue) : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vaccinations", id] });
      void queryClient.invalidateQueries({ queryKey: ["pets", id, "timeline"] });
      setVaccineName("");
      setNextDue(null);
      setNotes("");
      setShowForm(false);
    },
  });

  return (
    <Screen>
      <Button title={showForm ? "Đóng" : "+ Ghi nhận mũi tiêm"} variant={showForm ? "secondary" : "primary"} onPress={() => setShowForm((v) => !v)} />

      {showForm ? (
        <Card style={{ gap: 12 }}>
          {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
          <TextField label="Tên vắc-xin" value={vaccineName} onChangeText={setVaccineName} />
          <DateField label="Ngày tiêm" value={dateGiven} onChange={setDateGiven} maximumDate={new Date()} />
          <DateField label="Ngày tái chủng (không bắt buộc)" value={nextDue} onChange={setNextDue} minimumDate={new Date()} />
          <TextField label="Ghi chú (không bắt buộc)" value={notes} onChangeText={setNotes} multiline />
          <Button title="Lưu" loading={mutation.isPending} disabled={!vaccineName.trim() || !dateGiven} onPress={() => mutation.mutate()} />
        </Card>
      ) : null}

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? <EmptyState title="Chưa có mũi tiêm nào được ghi nhận" /> : null}

      {query.data?.map((v) => (
        <Card key={v.id} style={{ gap: 2 }}>
          <AppText variant="semi">💉 {v.vaccineName}</AppText>
          <AppText variant="small" tone="muted">Ngày tiêm: {formatDate(v.dateGiven)}</AppText>
          {v.nextDueDate ? <AppText variant="small" tone="brand">Tái chủng: {formatDate(v.nextDueDate)}</AppText> : null}
          {v.notes ? <AppText variant="small">{v.notes}</AppText> : null}
          <AppText variant="caption" tone="muted">Ghi nhận bởi {v.createdByName}</AppText>
        </Card>
      ))}
      <View style={{ height: 8 }} />
    </Screen>
  );
}
