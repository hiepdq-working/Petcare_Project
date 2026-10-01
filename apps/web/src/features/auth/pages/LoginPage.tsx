import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store";
import { extractErrorMessage } from "../../../shared/api/client";
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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Decorative panel, not a photo — no stock image to source legitimately,
          so a brand-gradient + paw pattern stands in for the mockup's hero photo. */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 md:flex md:w-1/2">
        <PawPrint className="absolute -left-10 -top-10 h-56 w-56 text-white/10" strokeWidth={1} />
        <PawPrint className="absolute bottom-10 right-10 h-40 w-40 text-white/10" strokeWidth={1} />
        <PawPrint className="absolute right-24 top-1/3 h-24 w-24 text-white/10" strokeWidth={1} />
        <div className="relative z-10 flex flex-1 flex-col justify-end p-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">🐾</span>
          <h2 className="mt-6 font-display text-4xl font-semibold leading-tight text-white">
            Kết nối yêu thương
            <br />
            với thú cưng
          </h2>
          <p className="mt-3 max-w-sm text-brand-100">
            Theo dõi sức khoẻ, đặt lịch khám và lưu giữ từng khoảnh khắc cùng bé cưng của bạn.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-app-gradient px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">🐾</div>
            <span className="font-display text-lg font-semibold text-brand-900">PetCare</span>
          </div>
          <h1 className="text-2xl font-semibold text-brand-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-brand-700/80">Chào mừng bạn quay lại PetCare</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

          <div className="mt-6 text-center text-sm text-brand-700/80">
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
            <p className="mt-1">
              <Link to="/hospitals/nearby" className="font-semibold text-brand-700">
                🔍 Tìm phòng khám gần bạn
              </Link>{" "}
              (không cần đăng nhập)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
