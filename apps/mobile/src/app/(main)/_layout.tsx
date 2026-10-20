import { Stack } from "expo-router";
import { fonts, DEFAULT_PALETTE } from "../../theme";

export default function MainLayout() {
  return (
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
    </Stack>
  );
}
