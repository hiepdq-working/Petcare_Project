import { Image, View } from "react-native";
import { AppText } from "./AppText";
import { useBrand } from "../../theme";

export function Avatar({ uri, size = 56, fallback = "🐾", radius }: { uri?: string | null; size?: number; fallback?: string; radius?: number }) {
  const brand = useBrand();
  const r = radius ?? size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: brand[100], overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <AppText style={{ fontSize: size * 0.45 }}>{fallback}</AppText>
      )}
    </View>
  );
}
