import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { refreshSession } from "../shared/api/client";
import { registerAuthFailureHandler } from "../shared/api/token-store";
import { useAuthStore } from "../features/auth/store";
import { colors, DEFAULT_PALETTE } from "../theme";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // On launch, trade the stored refresh token for a fresh session.
  useEffect(() => {
    registerAuthFailureHandler(() => {
      queryClient.clear();
      void useAuthStore.getState().clearSession();
    });
    void (async () => {
      const session = await refreshSession();
      if (session) {
        await useAuthStore.getState().setSession(session.user, session.accessToken);
      } else {
        await useAuthStore.getState().clearSession();
      }
    })();
  }, []);

  if (!fontsLoaded || status === "checking") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={DEFAULT_PALETTE[600]} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === "guest"}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={status === "authenticated"}>
            <Stack.Screen name="(main)" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
