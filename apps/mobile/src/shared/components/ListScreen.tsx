import { FlatList, KeyboardAvoidingView, Platform, type FlatListProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";

type ListScreenProps<T> = Omit<FlatListProps<T>, "contentContainerStyle"> & { topInset?: boolean };

// The virtualized counterpart of <Screen>: same background and padding, but
// rows are only mounted while visible, so long feeds / histories stay light.
export function ListScreen<T>({ topInset = false, ...props }: ListScreenProps<T>) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        {...props}
        contentContainerStyle={{ padding: 16, paddingTop: 16 + (topInset ? insets.top : 0), paddingBottom: 24 + insets.bottom, gap: 14 }}
      />
    </KeyboardAvoidingView>
  );
}
