import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store";
import { Button } from "../../../shared/components/Button";

// Placeholder landing page just to prove the Auth feature works end to
// end — the next feature (Pet profile) will replace this with a real
// home feed.
export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const mutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => clearSession(),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-900">Chào {user?.name} 👋</h1>
        <p className="mt-2 text-brand-700/80">
          Vai trò: {user?.role} · Email: {user?.email}
        </p>
        <div className="mt-6">
          <Button variant="ghost" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
}
