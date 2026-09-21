import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({ mutationFn: authApi.register });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ name, email, password });
  }

  if (mutation.isSuccess) {
    return (
      <AuthLayout title="Kiểm tra email của bạn">
        <Alert kind="success" message={mutation.data.message} />
        <Link to="/login" className="text-center text-sm font-semibold text-brand-700">
          Quay lại đăng nhập
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Dành cho người nuôi thú cưng"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-brand-700">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
        <TextField label="Họ và tên" required value={name} onChange={(e) => setName(e.target.value)} />
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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" loading={mutation.isPending}>
          Đăng ký
        </Button>
      </form>
    </AuthLayout>
  );
}
