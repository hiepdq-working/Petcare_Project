import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../features/auth/api/auth.api";
import { useAuthStore } from "../../features/auth/store";
import { extractErrorMessage } from "../../shared/api/client";
import { AppText } from "../../shared/components/AppText";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { ImagePickerField } from "../../shared/components/ImagePickerField";
import { Screen } from "../../shared/components/Screen";
import { ErrorBanner } from "../../shared/components/States";
import { TextField } from "../../shared/components/TextField";

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user)!;
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatar, setAvatar] = useState<string | null>(user.avatar);

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim(), phone: phone.trim() || undefined, avatar }),
    onSuccess: (updated) => {
      useAuthStore.getState().updateUser(updated);
      Alert.alert("Đã lưu", "Thông tin cá nhân đã được cập nhật.");
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: user.hasPassword ? currentPassword : undefined, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Đã đổi mật khẩu", "Mật khẩu mới có hiệu lực ngay.");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: async () => {
      queryClient.clear();
      await useAuthStore.getState().clearSession();
    },
  });

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <AppText variant="title">Thông tin cá nhân</AppText>
        {profileMutation.isError ? <ErrorBanner message={extractErrorMessage(profileMutation.error)} /> : null}
        <ImagePickerField value={avatar} onChange={setAvatar} />
        <TextField label="Họ và tên" value={name} onChangeText={setName} />
        <TextField label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <AppText variant="small" tone="muted">Email: {user.email}</AppText>
        <Button title="Lưu thông tin" loading={profileMutation.isPending} disabled={name.trim().length < 2} onPress={() => profileMutation.mutate()} />
      </Card>

      <Card style={{ gap: 14 }}>
        <AppText variant="title">{user.hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}</AppText>
        {passwordMutation.isError ? <ErrorBanner message={extractErrorMessage(passwordMutation.error)} /> : null}
        {user.hasPassword ? (
          <TextField label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
        ) : null}
        <TextField label="Mật khẩu mới (ít nhất 8 ký tự)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
        <Button
          title="Cập nhật mật khẩu"
          variant="secondary"
          loading={passwordMutation.isPending}
          disabled={newPassword.length < 8 || (user.hasPassword && !currentPassword)}
          onPress={() => passwordMutation.mutate()}
        />
      </Card>

      <View style={{ marginTop: 4 }}>
        <Button title="Đăng xuất" variant="danger" loading={logoutMutation.isPending} onPress={() => logoutMutation.mutate()} />
      </View>
    </Screen>
  );
}
