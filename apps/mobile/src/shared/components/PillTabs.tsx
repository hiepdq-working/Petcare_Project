import { Pressable, ScrollView } from "react-native";
import { AppText } from "./AppText";
import { useBrand } from "../../theme";

interface PillTabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function PillTabs<T extends string>({ tabs, value, onChange }: PillTabsProps<T>) {
  const brand = useBrand();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={{ backgroundColor: active ? brand[700] : "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}
          >
            <AppText variant="semi" style={{ fontSize: 14, color: active ? "#fff" : brand[700] }}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
