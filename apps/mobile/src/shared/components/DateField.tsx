import { Pressable, View } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { AppText } from "./AppText";
import { useBrand } from "../../theme";

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  withTime?: boolean;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

// Android picker dialogs (the app targets Android first). With `withTime`
// the date dialog is followed by a time dialog.
export function DateField({ label, value, onChange, withTime, placeholder = "Chọn", minimumDate, maximumDate }: DateFieldProps) {
  const brand = useBrand();

  function open() {
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: "date",
      minimumDate,
      maximumDate,
      onChange: (event, picked) => {
        if (event.type !== "set" || !picked) return;
        if (!withTime) {
          onChange(picked);
          return;
        }
        DateTimePickerAndroid.open({
          value: picked,
          mode: "time",
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== "set" || !time) return;
            const merged = new Date(picked);
            merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(merged);
          },
        });
      },
    });
  }

  const text = value
    ? withTime
      ? value.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : value.toLocaleDateString("vi-VN")
    : placeholder;

  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" style={{ fontFamily: "Inter_500Medium" }}>
        {label}
      </AppText>
      <Pressable
        onPress={open}
        style={{ borderWidth: 1, borderColor: brand[200], backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between" }}
      >
        <AppText tone={value ? "default" : "muted"}>{text}</AppText>
        {value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <AppText variant="small" tone="muted">
              Xoá
            </AppText>
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}
