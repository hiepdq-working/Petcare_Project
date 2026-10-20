import { useState } from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../features/auth/api/auth.api";
import { useAuthStore } from "../../features/auth/store";
import { extractErrorMessage } from "../../shared/api/client";
import { AuthShell } from "../../shared/components/AuthShell";
import { AppText } from "../../shared/components/AppText";
import { Button } from "../../shared/components/Button";
import { TextField } from "../../shared/components/TextField";
import { ErrorBanner } from "../../shared/components/States";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: (session) => useAuthStore.getState().setSession(session.user, session.accessToken, session.refreshToken),
  });

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại PetCare">
      {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <Link href="/forgot-password" style={{ alignSelf: "flex-end" }}>
        <AppText variant="small" tone="brand">
          Quên mật khẩu?
        </AppText>
      </Link>
      <Button title="Đăng nhập" onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!email || !password} />
      <View style={{ alignItems: "center", gap: 8 }}>
        <Link href="/register">
          <AppText variant="small" tone="muted">
            Chưa có tài khoản? <AppText variant="small" tone="brand" style={{ fontFamily: "Inter_700Bold" }}>Đăng ký ngay</AppText>
          </AppText>
        </Link>
      </View>
    </AuthShell>
  );
}
