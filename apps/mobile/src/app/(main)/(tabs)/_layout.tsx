import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../../../features/chat/api/chat.api";
import { fonts, DEFAULT_PALETTE } from "../../../theme";

// Same four tabs as the web's bottom nav: Trang chủ (feed), Khám phá,
// Tin nhắn, Tài khoản. "Lịch hẹn" is opened from the account hub.
export const unstable_settings = { anchor: "feed" };

export default function TabsLayout() {
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: chatApi.listConversations });
  const unreadChats = (conversations.data ?? []).reduce((sum, c) => sum + c.unreadCount, 0);

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
        name="feed"
        options={{ title: "Trang chủ", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: "Khám phá", tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Tin nhắn",
          tabBarBadge: unreadChats > 0 ? unreadChats : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Tài khoản", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
