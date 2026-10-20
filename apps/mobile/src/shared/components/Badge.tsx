import { View } from "react-native";
import { AppText } from "./AppText";
import { colors, useBrand } from "../../theme";

export type BadgeTone = "brand" | "amber" | "blue" | "green" | "red" | "violet" | "neutral";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: string }) {
  const brand = useBrand();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    brand: { bg: brand[100], fg: brand[800] },
    amber: { bg: colors.amberBg, fg: colors.amber },
    blue: { bg: colors.blueBg, fg: colors.blue },
    green: { bg: colors.greenBg, fg: colors.green },
    red: { bg: colors.dangerBg, fg: colors.danger },
    violet: { bg: colors.violetBg, fg: colors.violet },
    neutral: { bg: brand[50], fg: brand[700] },
  };
  const { bg, fg } = map[tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" }}>
      <AppText variant="caption" style={{ color: fg, fontFamily: "Inter_600SemiBold" }}>
        {children}
      </AppText>
    </View>
  );
}
