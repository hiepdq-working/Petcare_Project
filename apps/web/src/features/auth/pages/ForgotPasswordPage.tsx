import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const mutation = useMutation({ mutationFn: authApi.forgotPassword });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ email });
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu"
      footer={
        <Link to="/login" className="font-semibold text-brand-700">
          Quay lại đăng nhập
        </Link>
      }
    >
      {mutation.isSuccess ? (
        <Alert kind="success" message="Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi." />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
          <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={mutation.isPending}>
            Gửi hướng dẫn
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
