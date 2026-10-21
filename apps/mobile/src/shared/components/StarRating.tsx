import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBrand } from "../../theme";

// Read-only when `onChange` is omitted. Each star is its own accessible
// button so screen readers announce "3 sao" rather than an emoji.
export function StarRating({ value, onChange, size = 26 }: { value: number; onChange?: (value: number) => void; size?: number }) {
  const brand = useBrand();
  return (
    <View
      style={{ flexDirection: "row", gap: onChange ? 6 : 2 }}
      accessible={!onChange}
      accessibilityLabel={onChange ? undefined : `${value} trên 5 sao`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = <Ionicons name={star <= value ? "star" : "star-outline"} size={size} color={star <= value ? "#f59e0b" : brand[300]} />;
        return onChange ? (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${star} sao`}
            accessibilityState={{ selected: star === value }}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}
