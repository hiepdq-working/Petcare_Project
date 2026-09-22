import { Navigate } from "react-router-dom";
import { UserRole } from "@petcare/types";
import { useAuthStore } from "../features/auth/store";

// Pet Profile and Admin > Duyệt phòng khám are the only built features so
// far — Pet Owners land on their pet list, Admin lands on the approval
// queue. Other roles get a placeholder until their dashboards are built.
export function DashboardRedirect() {
  const role = useAuthStore((state) => state.user?.role);

  if (role === UserRole.PET_OWNER) {
    return <Navigate to="/pets" replace />;
  }

  if (role === UserRole.ADMIN) {
    return <Navigate to="/admin/partner-registrations" replace />;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center text-brand-700">
      Bảng điều khiển cho vai trò này đang được xây dựng.
    </div>
  );
}
