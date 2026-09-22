import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "../../auth/api/auth.api";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { TextField } from "../../../shared/components/TextField";
import { ImageUploader } from "../../../shared/components/ImageUploader";
import { Card } from "../../../shared/components/Card";
import { LoadingState } from "../../../shared/components/LoadingState";

export function SettingsPage() {
  const storeUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.getMe });
  const user = meQuery.data ?? storeUser;

  const [profileForm, setProfileForm] = useState({ name: "", phone: "", avatar: null as string | null });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, phone: user.phone ?? "", avatar: user.avatar });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone || undefined,
        avatar: profileForm.avatar,
      }),
    onSuccess: (updated) => updateUser(updated),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        currentPassword: user?.hasPassword ? passwordForm.currentPassword : undefined,
        newPassword: passwordForm.newPassword,
      }),
    onSuccess: () => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }),
  });

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    profileMutation.mutate();
  }

  function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    passwordMutation.mutate();
  }

  const passwordMismatch =
    passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword;

  if (meQuery.isLoading && !storeUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message="Không tìm thấy thông tin tài khoản" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Cài đặt</h1>

      <h2 className="mb-3 text-lg font-semibold text-brand-900">Thông tin cá nhân</h2>
      <form onSubmit={handleProfileSubmit}>
        <Card className="flex flex-col gap-4 p-6">
          {profileMutation.isError ? <Alert message={extractErrorMessage(profileMutation.error)} /> : null}
          {profileMutation.isSuccess ? <Alert kind="success" message="Đã lưu thông tin cá nhân" /> : null}

          <ImageUploader
            value={profileForm.avatar}
            onChange={(url) => setProfileForm((f) => ({ ...f, avatar: url }))}
            uploadFn={authApi.uploadAvatar}
            label="Chọn ảnh đại diện"
            shape="circle"
            placeholderIcon="🙂"
          />

          <TextField
            label="Họ và tên"
            required
            value={profileForm.name}
            onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField label="Email" value={user.email} disabled className="opacity-60" />
          <TextField
            label="Số điện thoại"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
          />

          <Button type="submit" loading={profileMutation.isPending} disabled={profileForm.name.trim().length === 0}>
            Lưu thông tin
          </Button>
        </Card>
      </form>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-brand-900">
        {user.hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}
      </h2>
      {!user.hasPassword ? (
        <p className="mb-3 text-sm text-brand-700/70">
          Tài khoản của bạn đăng nhập bằng Google và chưa có mật khẩu. Đặt mật khẩu để có thể đăng nhập bằng email
          nữa.
        </p>
      ) : null}
      <form onSubmit={handlePasswordSubmit}>
        <Card className="flex flex-col gap-4 p-6">
          {passwordMutation.isError ? <Alert message={extractErrorMessage(passwordMutation.error)} /> : null}
          {passwordMutation.isSuccess ? <Alert kind="success" message="Đã cập nhật mật khẩu" /> : null}

          {user.hasPassword ? (
            <TextField
              label="Mật khẩu hiện tại"
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            />
          ) : null}
          <TextField
            label="Mật khẩu mới"
            type="password"
            required
            minLength={8}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
          />
          <TextField
            label="Xác nhận mật khẩu mới"
            type="password"
            required
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            error={passwordMismatch ? "Mật khẩu xác nhận không khớp" : undefined}
          />

          <Button
            type="submit"
            loading={passwordMutation.isPending}
            disabled={
              passwordForm.newPassword.length < 8 ||
              passwordMismatch ||
              (user.hasPassword && passwordForm.currentPassword.length === 0)
            }
          >
            {user.hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
