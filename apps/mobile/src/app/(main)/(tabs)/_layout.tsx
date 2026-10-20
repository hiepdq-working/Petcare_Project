import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts, DEFAULT_PALETTE } from "../../../theme";

// Land on the account hub after login (the web lands on the feed, which
// arrives in M2).
export const unstable_settings = { anchor: "account" };

// M1 tabs. Trang chủ (bảng tin) and Tin nhắn join in M2.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DEFAULT_PALETTE[700],
        tabBarInactiveTintColor: DEFAULT_PALETTE[700] + "80",
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: DEFAULT_PALETTE[100] },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: "Khám phá", tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: "Lịch hẹn", tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Tài khoản", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
