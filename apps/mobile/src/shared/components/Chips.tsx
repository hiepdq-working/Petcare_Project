import { Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { useBrand } from "../../theme";

// Single-select chips — the native stand-in for a <select>.
export function Chips<T extends string>({ label, options, value, onChange }: { label?: string; options: { value: T; label: string }[]; value: T | ""; onChange: (value: T) => void }) {
  const brand = useBrand();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="small" style={{ fontFamily: "Inter_500Medium" }}>
          {label}
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: active ? brand[700] : brand[200], backgroundColor: active ? brand[700] : "#fff" }}
            >
              <AppText variant="small" style={{ color: active ? "#fff" : brand[800], fontFamily: "Inter_500Medium" }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
