import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { colors, useBrand } from "../../theme";

export function Loading() {
  const brand = useBrand();
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <ActivityIndicator color={brand[600]} />
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={{ paddingVertical: 32, paddingHorizontal: 16, alignItems: "center", gap: 6 }}>
      <AppText variant="semi" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="small" tone="muted" style={{ textAlign: "center" }}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ backgroundColor: colors.dangerBg, borderRadius: 12, padding: 12, gap: 8 }} accessibilityRole="alert">
      <AppText variant="small" tone="danger">
        {message}
      </AppText>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Thử lại" hitSlop={8}>
          <AppText variant="small" tone="danger" style={{ fontFamily: "Inter_700Bold" }}>
            Thử lại
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
