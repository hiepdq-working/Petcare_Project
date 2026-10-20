import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { notificationsApi } from "../../features/notifications/api/notifications.api";
import { AppText } from "./AppText";
import { DEFAULT_PALETTE } from "../../theme";

// Title row shared by the tab screens, with the notification bell (and an
// optional extra action) on the right.
export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const unread = useQuery({ queryKey: ["notifications", "unread-count"], queryFn: notificationsApi.unreadCount });
  const count = unread.data ?? 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <AppText variant="display">{title}</AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      <Pressable onPress={() => router.push("/notifications")} hitSlop={10} accessibilityLabel="Thông báo">
        <Ionicons name="notifications-outline" size={26} color={DEFAULT_PALETTE[700]} />
        {count > 0 ? (
          <View style={{ position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}>
            <AppText variant="caption" style={{ color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" }}>
              {count > 9 ? "9+" : String(count)}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
