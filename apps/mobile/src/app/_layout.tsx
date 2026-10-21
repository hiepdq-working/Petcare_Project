import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { restoreSession } from "../shared/api/client";
import { getCachedUser, registerAuthFailureHandler } from "../shared/api/token-store";
import { clearQueryCache, queryClient, queryPersister, QUERY_CACHE_MAX_AGE, shouldPersistQuery } from "../shared/query/client";
import { OfflineBanner } from "../shared/components/OfflineBanner";
import { useAuthStore } from "../features/auth/store";
import { ToastHost } from "../shared/components/Toast";
import { colors, DEFAULT_PALETTE } from "../theme";

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
      void clearQueryCache();
      void useAuthStore.getState().clearSession();
    });
    void (async () => {
      const result = await restoreSession();
      if (result.status === "ok") {
        await useAuthStore.getState().setSession(result.session.user, result.session.accessToken);
        return;
      }
      // Couldn't reach the server: stay signed in on the cached profile so the
      // app opens with cached data instead of bouncing to the login screen.
      if (result.status === "offline") {
        const cached = await getCachedUser();
        if (cached) {
          useAuthStore.getState().resumeOffline(JSON.parse(cached));
          return;
        }
      }
      await clearQueryCache();
      await useAuthStore.getState().clearSession();
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
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: QUERY_CACHE_MAX_AGE,
          buster: "v1",
          dehydrateOptions: { shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey, query.state.status) },
        }}
      >
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === "guest"}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={status === "authenticated"}>
            <Stack.Screen name="(main)" />
          </Stack.Protected>
        </Stack>
        <ToastHost />
        <OfflineBanner />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
