import { useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
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

// Android opens native picker dialogs (date, then time when `withTime`); iOS
// has no dialog, so it shows an inline picker in a bottom sheet with
// Cancel / Done.
export function DateField({ label, value, onChange, withTime, placeholder = "Chọn", minimumDate, maximumDate }: DateFieldProps) {
  const brand = useBrand();
  const [iosOpen, setIosOpen] = useState(false);
  // What the iOS picker currently shows; only committed on "Xong".
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  function open() {
    if (Platform.OS === "ios") {
      setDraft(value ?? new Date());
      setIosOpen(true);
      return;
    }
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: "date",
      minimumDate,
      maximumDate,
      onValueChange: (_event, picked) => {
        if (!withTime) {
          onChange(picked);
          return;
        }
        DateTimePickerAndroid.open({
          value: picked,
          mode: "time",
          is24Hour: true,
          onValueChange: (_timeEvent, time) => {
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
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
        style={{ borderWidth: 1, borderColor: brand[200], backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between" }}
      >
        <AppText tone={value ? "default" : "muted"}>{text}</AppText>
        {value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Xoá ${label}`}>
            <AppText variant="small" tone="muted">
              Xoá
            </AppText>
          </Pressable>
        ) : null}
      </Pressable>

      {Platform.OS === "ios" ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setIosOpen(false)} accessibilityLabel="Đóng bộ chọn" />
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable onPress={() => setIosOpen(false)} hitSlop={8} accessibilityRole="button">
                <AppText tone="muted">Huỷ</AppText>
              </Pressable>
              <AppText variant="semi">{label}</AppText>
              <Pressable
                onPress={() => {
                  onChange(draft);
                  setIosOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <AppText tone="brand" style={{ fontFamily: "Inter_700Bold" }}>
                  Xong
                </AppText>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode={withTime ? "datetime" : "date"}
              display="inline"
              locale="vi-VN"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={brand[700]}
              onValueChange={(_event, picked) => setDraft(picked)}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
