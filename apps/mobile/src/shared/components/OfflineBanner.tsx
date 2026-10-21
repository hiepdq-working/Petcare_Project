import { View } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";

// Slim pill shown only while the device has no connection; screens keep
// rendering whatever is cached.
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const insets = useSafeAreaInsets();
  if (isConnected !== false) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", bottom: insets.bottom + 84, left: 0, right: 0, alignItems: "center" }} accessibilityLiveRegion="polite">
      <View style={{ backgroundColor: "#374151", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, elevation: 6 }}>
        <AppText variant="caption" tone="white">
          📡 Không có mạng · đang hiện dữ liệu đã lưu
        </AppText>
      </View>
    </View>
  );
}
