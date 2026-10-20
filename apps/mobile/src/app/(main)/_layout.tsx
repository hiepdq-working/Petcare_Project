import { Stack } from "expo-router";
import { RealtimeSync } from "../../shared/realtime/RealtimeSync";
import { fonts, DEFAULT_PALETTE } from "../../theme";

export default function MainLayout() {
  return (
    <>
    <RealtimeSync />
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: DEFAULT_PALETTE[800],
        headerTitleStyle: { fontFamily: fonts.sansSemi, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#f6faf7" },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="hospital/[id]" options={{ title: "Phòng khám" }} />
      <Stack.Screen name="pet/new" options={{ title: "Thêm thú cưng" }} />
      <Stack.Screen name="pet/[id]/index" options={{ title: "Hồ sơ thú cưng" }} />
      <Stack.Screen name="pet/[id]/edit" options={{ title: "Sửa hồ sơ" }} />
      <Stack.Screen name="pet/[id]/timeline" options={{ title: "Digital Life" }} />
      <Stack.Screen name="pet/[id]/vaccinations" options={{ title: "Sổ tiêm phòng" }} />
      <Stack.Screen name="record/[id]" options={{ title: "Hồ sơ bệnh án" }} />
      <Stack.Screen name="settings" options={{ title: "Cài đặt" }} />
      <Stack.Screen name="appointments" options={{ title: "Lịch hẹn của tôi" }} />
      <Stack.Screen name="post/new" options={{ title: "Bài viết mới" }} />
      <Stack.Screen name="post/[id]" options={{ title: "Bài viết" }} />
      <Stack.Screen name="saved" options={{ title: "Bài viết đã lưu" }} />
      <Stack.Screen name="favorites" options={{ title: "Phòng khám yêu thích" }} />
      <Stack.Screen name="groups/index" options={{ title: "Nhóm" }} />
      <Stack.Screen name="groups/[id]" options={{ title: "Nhóm" }} />
      <Stack.Screen name="notifications" options={{ title: "Thông báo" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Tin nhắn" }} />
    </Stack>
    </>
  );
}
