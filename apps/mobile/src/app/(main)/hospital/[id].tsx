import { useState } from "react";
import { Alert, Linking, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceDto } from "@petcare/types";
import { appointmentsApi } from "../../../features/appointments/api/appointments.api";
import { hospitalApi } from "../../../features/hospital/api/hospital.api";
import { petsApi } from "../../../features/pets/api/pets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { Chips } from "../../../shared/components/Chips";
import { DateField } from "../../../shared/components/DateField";
import { PillTabs } from "../../../shared/components/PillTabs";
import { Screen } from "../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { TextField } from "../../../shared/components/TextField";
import { formatDate, formatPrice } from "../../../shared/utils/format";
import { BrandScope } from "../../../theme";

type Tab = "services" | "booking" | "reviews";
const TABS: { value: Tab; label: string }[] = [
  { value: "services", label: "Dịch vụ" },
  { value: "booking", label: "Đặt lịch" },
  { value: "reviews", label: "Đánh giá" },
];

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("services");
  const hospitalQuery = useQuery({ queryKey: ["hospitals", id], queryFn: () => hospitalApi.getPublicById(id) });

  if (hospitalQuery.isLoading) return <Screen><Loading /></Screen>;
  if (hospitalQuery.isError || !hospitalQuery.data) return <Screen><ErrorBanner message={extractErrorMessage(hospitalQuery.error)} /></Screen>;
  const hospital = hospitalQuery.data;

  return (
    // The clinic's own brand color re-themes this whole screen, like the web.
    <BrandScope color={hospital.brandColor}>
      <Screen>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <Avatar uri={hospital.logo} size={64} radius={18} fallback="🏥" />
            <View style={{ flex: 1 }}>
              <AppText variant="title">{hospital.name}</AppText>
              {hospital.address ? <AppText variant="small" tone="muted">{hospital.address}</AppText> : null}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {hospital.isEmergency ? <Badge tone="red">Cấp cứu 24/7</Badge> : null}
            {hospital.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${hospital.phone}`)}>
                <AppText variant="small" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>📞 {hospital.phone}</AppText>
              </Pressable>
            ) : null}
            {hospital.lat !== null && hospital.lng !== null ? (
              <Pressable onPress={() => Linking.openURL(`geo:${hospital.lat},${hospital.lng}?q=${hospital.lat},${hospital.lng}(${encodeURIComponent(hospital.name)})`)}>
                <AppText variant="small" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>🗺️ Bản đồ</AppText>
              </Pressable>
            ) : null}
          </View>
          {hospital.description ? <AppText>{hospital.description}</AppText> : null}
        </Card>

        <PillTabs tabs={TABS} value={tab} onChange={setTab} />
        {tab === "services" ? <ServicesTab hospitalId={id} /> : null}
        {tab === "booking" ? <BookingTab hospitalId={id} /> : null}
        {tab === "reviews" ? <ReviewsTab hospitalId={id} /> : null}
      </Screen>
    </BrandScope>
  );
}

function ServicesTab({ hospitalId }: { hospitalId: string }) {
  const query = useQuery({ queryKey: ["services", "hospital", hospitalId], queryFn: () => hospitalApi.listServices(hospitalId) });
  if (query.isLoading) return <Loading />;
  if (query.data?.length === 0) return <EmptyState title="Phòng khám chưa cập nhật dịch vụ" />;
  return (
    <>
      {query.data?.map((s) => (
        <Card key={s.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="semi">{s.name}</AppText>
            {s.description ? <AppText variant="small" tone="muted">{s.description}</AppText> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <AppText variant="semi" tone="brand">{formatPrice(s.price)}</AppText>
            {s.duration ? <AppText variant="caption" tone="muted">{s.duration} phút</AppText> : null}
          </View>
        </Card>
      ))}
    </>
  );
}

function BookingTab({ hospitalId }: { hospitalId: string }) {
  const queryClient = useQueryClient();
  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const servicesQuery = useQuery({ queryKey: ["services", "hospital", hospitalId], queryFn: () => hospitalApi.listServices(hospitalId) });
  const vetsQuery = useQuery({ queryKey: ["vets", "hospital", hospitalId], queryFn: () => hospitalApi.listVets(hospitalId) });

  const [petId, setPetId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [vetId, setVetId] = useState("");
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        petId,
        hospitalId,
        serviceId,
        vetId: vetId || undefined,
        // A real instant (ISO) so the server stores the time the user picked.
        dateTime: dateTime!.toISOString(),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      Alert.alert("Đặt lịch thành công", "Phòng khám sẽ sớm xác nhận lịch hẹn của bạn.");
      router.replace("/appointments");
    },
  });

  if (petsQuery.isLoading || servicesQuery.isLoading) return <Loading />;
  if (petsQuery.data?.length === 0) {
    return (
      <Card style={{ gap: 12 }}>
        <AppText>Bạn chưa có hồ sơ thú cưng nào. Hãy thêm hồ sơ trước khi đặt lịch.</AppText>
        <Button title="Thêm thú cưng" onPress={() => router.push("/pet/new")} />
      </Card>
    );
  }

  return (
    <Card style={{ gap: 14 }}>
      {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
      <Chips label="Thú cưng" value={petId} onChange={setPetId} options={(petsQuery.data ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.species}` }))} />
      <Chips
        label="Dịch vụ"
        value={serviceId}
        onChange={setServiceId}
        options={(servicesQuery.data ?? []).map((s: ServiceDto) => ({ value: s.id, label: s.price ? `${s.name} — ${s.price.toLocaleString("vi-VN")}đ` : s.name }))}
      />
      {(vetsQuery.data?.length ?? 0) > 0 ? (
        <Chips
          label="Bác sĩ mong muốn (không bắt buộc)"
          value={vetId}
          onChange={(v) => setVetId(v === vetId ? "" : v)}
          options={(vetsQuery.data ?? []).map((v) => ({ value: v.id, label: v.specialty ? `${v.name} (${v.specialty})` : v.name }))}
        />
      ) : null}
      <DateField label="Thời gian mong muốn" value={dateTime} onChange={setDateTime} withTime minimumDate={new Date()} placeholder="Chọn ngày và giờ" />
      <TextField label="Ghi chú cho phòng khám (không bắt buộc)" value={notes} onChangeText={setNotes} multiline />
      <Button title="Đặt lịch hẹn" loading={mutation.isPending} disabled={!petId || !serviceId || !dateTime} onPress={() => mutation.mutate()} />
    </Card>
  );
}

function ReviewsTab({ hospitalId }: { hospitalId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["reviews", hospitalId], queryFn: () => hospitalApi.listReviews(hospitalId) });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const mutation = useMutation({
    mutationFn: () => hospitalApi.createReview({ hospitalId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      setRating(0);
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["reviews", hospitalId] });
    },
  });

  if (query.isLoading) return <Loading />;
  const summary = query.data;
  return (
    <>
      <Card style={{ gap: 4 }}>
        <AppText variant="title">
          {summary && summary.totalCount > 0 ? `⭐ ${summary.averageRating.toFixed(1)} / 5` : "Chưa có đánh giá"}
        </AppText>
        {summary && summary.totalCount > 0 ? <AppText variant="small" tone="muted">{summary.totalCount} đánh giá</AppText> : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <AppText variant="semi">Đánh giá của bạn</AppText>
        {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} hitSlop={6}>
              <AppText style={{ fontSize: 28 }}>{star <= rating ? "⭐" : "☆"}</AppText>
            </Pressable>
          ))}
        </View>
        <TextField value={comment} onChangeText={setComment} placeholder="Nhận xét (không bắt buộc)" multiline />
        <Button title="Gửi đánh giá" loading={mutation.isPending} disabled={rating === 0} onPress={() => mutation.mutate()} />
        <AppText variant="caption" tone="muted">Chỉ chủ nuôi đã hoàn thành lịch khám tại đây mới đánh giá được.</AppText>
      </Card>

      {summary?.reviews.map((r) => (
        <Card key={r.id} style={{ gap: 4 }}>
          <AppText variant="semi">{r.userName} · {"⭐".repeat(r.rating)}</AppText>
          {r.comment ? <AppText>{r.comment}</AppText> : null}
          <AppText variant="caption" tone="muted">{formatDate(r.createdAt)}</AppText>
        </Card>
      ))}
    </>
  );
}
