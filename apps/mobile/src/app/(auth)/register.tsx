import { useState } from "react";
import { Link } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../features/auth/api/auth.api";
import { extractErrorMessage } from "../../shared/api/client";
import { AuthShell } from "../../shared/components/AuthShell";
import { AppText } from "../../shared/components/AppText";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { TextField } from "../../shared/components/TextField";
import { ErrorBanner } from "../../shared/components/States";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => authApi.register({ name: name.trim(), email: email.trim(), password }),
  });

  if (mutation.isSuccess) {
    return (
      <AuthShell title="Kiểm tra email của bạn" subtitle="Một bước nữa để kích hoạt tài khoản">
        <Card style={{ gap: 12 }}>
          <AppText>{mutation.data.message}</AppText>
          <Link href="/login">
            <AppText tone="brand" style={{ fontFamily: "Inter_700Bold" }}>
              Quay lại đăng nhập
            </AppText>
          </Link>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Tạo tài khoản" subtitle="Dành cho chủ nuôi thú cưng">
      {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
      <TextField label="Họ và tên" value={name} onChangeText={setName} />
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Mật khẩu (ít nhất 8 ký tự)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <Button
        title="Đăng ký"
        onPress={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={name.trim().length < 2 || !email || password.length < 8}
      />
      <Link href="/login" style={{ alignSelf: "center" }}>
        <AppText variant="small" tone="brand">
          Đã có tài khoản? Đăng nhập
        </AppText>
      </Link>
    </AuthShell>
  );
}
