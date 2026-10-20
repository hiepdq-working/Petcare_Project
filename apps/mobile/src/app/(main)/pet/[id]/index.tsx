import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { petsApi } from "../../../../features/pets/api/pets.api";
import { extractErrorMessage } from "../../../../shared/api/client";
import { Avatar } from "../../../../shared/components/Avatar";
import { AppText } from "../../../../shared/components/AppText";
import { Button } from "../../../../shared/components/Button";
import { Card } from "../../../../shared/components/Card";
import { Screen } from "../../../../shared/components/Screen";
import { ErrorBanner, Loading } from "../../../../shared/components/States";
import { formatAge } from "../../../../shared/utils/pet";
import { formatDate } from "../../../../shared/utils/format";
import { Pressable } from "react-native";
import { DEFAULT_PALETTE } from "../../../../theme";

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["pets", id], queryFn: () => petsApi.get(id) });
  const removeMutation = useMutation({
    mutationFn: () => petsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.back();
    },
  });

  function confirmRemove() {
    Alert.alert("Xoá hồ sơ?", "Toàn bộ dữ liệu của bé sẽ bị xoá và không thể khôi phục.", [
      { text: "Huỷ", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: () => removeMutation.mutate() },
    ]);
  }

  if (query.isLoading) return <Screen><Loading /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorBanner message={extractErrorMessage(query.error)} /></Screen>;
  const pet = query.data;
  const age = formatAge(pet.birthDate);

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: 8 }}>
        <Avatar uri={pet.avatar} size={96} radius={26} />
        <AppText variant="display">{pet.name}</AppText>
        <AppText variant="small" tone="muted">
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ""}
        </AppText>
        <View style={{ alignSelf: "stretch", gap: 4, marginTop: 6 }}>
          {age ? <Row label="Tuổi" value={age} /> : null}
          {pet.birthDate ? <Row label="Ngày sinh" value={formatDate(pet.birthDate)} /> : null}
          {pet.weight ? <Row label="Cân nặng" value={`${pet.weight} kg`} /> : null}
          {pet.notes ? <Row label="Ghi chú" value={pet.notes} /> : null}
        </View>
      </Card>

      <NavRow icon="pulse-outline" label="Digital Life — dòng thời gian" onPress={() => router.push(`/pet/${id}/timeline`)} />
      <NavRow icon="shield-checkmark-outline" label="Sổ tiêm phòng" onPress={() => router.push(`/pet/${id}/vaccinations`)} />
      <NavRow icon="medkit-outline" label="Đặt lịch khám" onPress={() => router.push("/discover")} />

      {removeMutation.isError ? <ErrorBanner message={extractErrorMessage(removeMutation.error)} /> : null}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title="Sửa hồ sơ" variant="secondary" onPress={() => router.push(`/pet/${id}/edit`)} style={{ flex: 1 }} />
        <Button title="Xoá" variant="danger" onPress={confirmRemove} loading={removeMutation.isPending} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <AppText variant="small" tone="muted">{label}</AppText>
      <AppText variant="small" style={{ flexShrink: 1, textAlign: "right" }}>{value}</AppText>
    </View>
  );
}

function NavRow({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Ionicons name={icon} size={22} color={DEFAULT_PALETTE[700]} />
        <AppText variant="semi" style={{ flex: 1 }}>{label}</AppText>
        <Ionicons name="chevron-forward" size={18} color={DEFAULT_PALETTE[400]} />
      </Card>
    </Pressable>
  );
}
