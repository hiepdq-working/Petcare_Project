import type { ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "./AppText";
import { Screen } from "./Screen";
import { DEFAULT_PALETTE } from "../../theme";

// Gradient-style hero (solid teal band — no extra gradient dependency)
// above the form card, echoing the web's split-hero login.
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Screen topInset>
      <View style={{ backgroundColor: DEFAULT_PALETTE[700], borderRadius: 24, padding: 22, gap: 6 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
          <AppText style={{ fontSize: 22 }}>🐾</AppText>
        </View>
        <AppText variant="display" tone="white" style={{ marginTop: 8 }}>
          Kết nối yêu thương với thú cưng
        </AppText>
        <AppText variant="small" style={{ color: DEFAULT_PALETTE[100] }}>
          Theo dõi sức khoẻ, đặt lịch khám và lưu giữ từng khoảnh khắc cùng bé cưng.
        </AppText>
      </View>
      <View style={{ gap: 4, marginTop: 6 }}>
        <AppText variant="title">{title}</AppText>
        <AppText variant="small" tone="muted">
          {subtitle}
        </AppText>
      </View>
      {children}
    </Screen>
  );
}
