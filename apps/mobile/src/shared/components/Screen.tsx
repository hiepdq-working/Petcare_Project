import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type RefreshControlProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  // Top inset is handled by the navigation header on pushed screens; only
  // header-less screens (login, tab roots) need it.
  topInset?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({ children, scroll = true, topInset = false, refreshControl }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = { padding: 16, paddingTop: 16 + (topInset ? insets.top : 0), paddingBottom: 24 + insets.bottom, gap: 14 };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {scroll ? (
        <ScrollView contentContainerStyle={padding} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padding]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}
