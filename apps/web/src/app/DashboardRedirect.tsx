import { Navigate } from "react-router-dom";
import { UserRole } from "@petcare/types";
import { useAuthStore } from "../features/auth/store";

// Pet Profile is the first (and so far only) built feature — Pet Owners
// land on their pet list. Other roles get a placeholder until their
// dashboards (Hospital, Admin) are built.
export function DashboardRedirect() {
  const role = useAuthStore((state) => state.user?.role);

  if (role === UserRole.PET_OWNER) {
    return <Navigate to="/pets" replace />;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center text-brand-700">
      Bảng điều khiển cho vai trò này đang được xây dựng.
    </div>
  );
}
