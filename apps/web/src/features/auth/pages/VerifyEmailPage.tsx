import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { AuthLayout } from "../components/AuthLayout";
import { Alert } from "../../../shared/components/Alert";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const mutation = useMutation({ mutationFn: authApi.verifyEmail });
  // The token is single-use (server clears it on success), so this must
  // fire at most once per token — a plain effect would call it twice
  // under StrictMode's dev double-invoke, and the second (now-invalid)
  // call's error would overwrite the first call's success.
  const firedForToken = useRef<string | null>(null);

  useEffect(() => {
    if (token && firedForToken.current !== token) {
      firedForToken.current = token;
      mutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <AuthLayout title="Liên kết không hợp lệ">
        <Alert message="Thiếu token xác thực trong đường dẫn." />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Xác thực email">
      {mutation.isPending ? <p className="text-sm text-brand-700">Đang xác thực...</p> : null}
      {mutation.isSuccess ? (
        <>
          <Alert kind="success" message="Xác thực email thành công!" />
          <Link to="/login" className="text-center text-sm font-semibold text-brand-700">
            Đăng nhập ngay
          </Link>
        </>
      ) : null}
      {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
    </AuthLayout>
  );
}
