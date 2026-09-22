import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store";
import { extractErrorMessage } from "../../../shared/api/client";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session.user, session.accessToken);
      navigate("/");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại PetCare"
      footer={
        <>
          <p>
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-semibold text-brand-700">
              Đăng ký ngay
            </Link>
          </p>
          <p className="mt-1">
            Bạn là chủ phòng khám?{" "}
            <Link to="/partner/register" className="font-semibold text-brand-700">
              Đăng ký đối tác
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
        <TextField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <TextField
          label="Mật khẩu"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-brand-700">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" loading={mutation.isPending}>
          Đăng nhập
        </Button>
      </form>
    </AuthLayout>
  );
}
