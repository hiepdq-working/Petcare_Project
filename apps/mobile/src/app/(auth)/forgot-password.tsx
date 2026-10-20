import { useState } from "react";
import { Link } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../features/auth/api/auth.api";
import { extractErrorMessage } from "../../shared/api/client";
import { AuthShell } from "../../shared/components/AuthShell";
import { AppText } from "../../shared/components/AppText";
import { Button } from "../../shared/components/Button";
import { TextField } from "../../shared/components/TextField";
import { ErrorBanner } from "../../shared/components/States";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const mutation = useMutation({ mutationFn: () => authApi.forgotPassword({ email: email.trim() }) });

  return (
    <AuthShell title="Quên mật khẩu" subtitle="Nhập email để nhận hướng dẫn đặt lại mật khẩu">
      {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
      {mutation.isSuccess ? (
        <ErrorBannerSuccess />
      ) : null}
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Button title="Gửi hướng dẫn" onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!email} />
      <Link href="/login" style={{ alignSelf: "center" }}>
        <AppText variant="small" tone="brand">
          Quay lại đăng nhập
        </AppText>
      </Link>
    </AuthShell>
  );
}

function ErrorBannerSuccess() {
  return (
    <AppText variant="small" tone="brand">
      Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.
    </AppText>
  );
}
