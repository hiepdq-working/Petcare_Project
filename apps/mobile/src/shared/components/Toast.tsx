import { useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { AppText } from "./AppText";

interface ToastState {
  message: string | null;
  tone: "info" | "error";
  id: number;
  show: (message: string, tone?: "info" | "error") => void;
  hide: () => void;
}

// A lightweight replacement for Alert.alert on non-blocking feedback.
export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: "info",
  id: 0,
  show: (message, tone = "info") => set((state) => ({ message, tone, id: state.id + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = {
  info: (message: string) => useToast.getState().show(message, "info"),
  error: (message: string) => useToast.getState().show(message, "error"),
};

export function ToastHost() {
  const { message, tone, id, hide } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 3200);
    return () => clearTimeout(timer);
  }, [message, id, hide]);

  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 16, right: 16, top: insets.top + 8, alignItems: "center" }}
      accessibilityLiveRegion="polite"
    >
      <View
        style={{
          backgroundColor: tone === "error" ? "#b91c1c" : "#14532d",
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          maxWidth: "100%",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <AppText variant="small" tone="white">
          {message}
        </AppText>
      </View>
    </View>
  );
}
