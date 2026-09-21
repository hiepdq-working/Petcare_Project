import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const mutation = useMutation({ mutationFn: authApi.resetPassword });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ token, newPassword });
  }

  if (!token) {
    return (
      <AuthLayout title="Liên kết không hợp lệ">
        <Alert message="Thiếu token đặt lại mật khẩu trong đường dẫn." />
      </AuthLayout>
    );
  }

  if (mutation.isSuccess) {
    return (
      <AuthLayout title="Đặt lại mật khẩu thành công">
        <Alert kind="success" message="Bạn có thể đăng nhập bằng mật khẩu mới." />
        <Link to="/login" className="text-center text-sm font-semibold text-brand-700">
          Đăng nhập ngay
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Đặt mật khẩu mới">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
        <TextField
          label="Mật khẩu mới"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" loading={mutation.isPending}>
          Đặt lại mật khẩu
        </Button>
      </form>
    </AuthLayout>
  );
}
