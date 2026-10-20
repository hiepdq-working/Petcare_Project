import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { hospitalApi } from "../../../features/hospital/api/hospital.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Badge } from "../../../shared/components/Badge";
import { Card } from "../../../shared/components/Card";
import { Chips } from "../../../shared/components/Chips";
import { Screen } from "../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { TextField } from "../../../shared/components/TextField";

// Same default center as the seed clinic (TP.HCM) when location is denied.
const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 };
const RADII = [5, 10, 25, 50];

export default function DiscoverScreen() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [located, setLocated] = useState(false);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [nameQuery, setNameQuery] = useState("");

  async function useMyLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Chưa có quyền vị trí", "Đang dùng khu vực mặc định (TP.HCM). Bạn có thể cấp quyền trong Cài đặt của máy.");
        return;
      }
      // A device with no GPS fix can leave getCurrentPositionAsync pending
      // forever, so use the last known position first and cap the wait.
      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
        ]));
      if (!position) {
        Alert.alert("Không lấy được vị trí", "Đang dùng khu vực mặc định (TP.HCM).");
        return;
      }
      setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocated(true);
    } catch {
      Alert.alert("Không lấy được vị trí", "Đang dùng khu vực mặc định (TP.HCM).");
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    void useMyLocation();
  }, []);

  const query = useQuery({
    queryKey: ["hospitals", "nearby", center, radiusKm],
    queryFn: () => hospitalApi.searchNearby({ lat: center.lat, lng: center.lng, radiusKm }),
  });

  const term = nameQuery.trim().toLowerCase();
  const results = (query.data ?? []).filter((h) => !term || h.name.toLowerCase().includes(term));

  return (
    <Screen topInset refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      <AppText variant="display">Khám phá</AppText>
      <AppText variant="small" tone="muted">
        {located ? "Phòng khám gần vị trí của bạn" : "Phòng khám gần khu vực mặc định (TP.HCM)"}
      </AppText>

      <TextField value={nameQuery} onChangeText={setNameQuery} placeholder="Tìm phòng khám theo tên..." />
      <Chips
        value={String(radiusKm)}
        onChange={(v) => setRadiusKm(Number(v))}
        options={RADII.map((r) => ({ value: String(r), label: `${r} km` }))}
      />
      <Pressable onPress={() => void useMyLocation()} disabled={locating}>
        <AppText variant="small" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>
          {locating ? "Đang lấy vị trí..." : "📍 Dùng vị trí của tôi"}
        </AppText>
      </Pressable>

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && !query.isError && results.length === 0 ? (
        <EmptyState
          title={term ? `Không có phòng khám nào khớp "${nameQuery}"` : `Không có phòng khám trong bán kính ${radiusKm}km`}
          description="Hãy thử tăng bán kính tìm kiếm."
        />
      ) : null}

      {results.map((h) => (
        <Pressable key={h.id} onPress={() => router.push(`/hospital/${h.id}`)}>
          <Card style={{ flexDirection: "row", gap: 14 }}>
            <Avatar uri={h.logo} size={64} radius={16} fallback="🏥" />
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <AppText variant="semi" style={{ flex: 1 }}>{h.name}</AppText>
                <Badge tone="brand">{`${h.distanceKm} km`}</Badge>
              </View>
              {h.address ? <AppText variant="small" tone="muted" numberOfLines={1}>{h.address}</AppText> : null}
              {h.description ? <AppText variant="small" numberOfLines={2}>{h.description}</AppText> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                {h.isEmergency ? <Badge tone="red">Cấp cứu 24/7</Badge> : null}
                <Pressable onPress={() => Linking.openURL(`geo:${h.lat},${h.lng}?q=${h.lat},${h.lng}(${encodeURIComponent(h.name)})`)}>
                  <AppText variant="caption" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>🗺️ Mở bản đồ</AppText>
                </Pressable>
                {h.phone ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${h.phone}`)}>
                    <AppText variant="caption" tone="brand" style={{ fontFamily: "Inter_600SemiBold" }}>📞 {h.phone}</AppText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
