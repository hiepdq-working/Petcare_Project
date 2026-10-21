import { Navigate } from "react-router-dom";
import { UserRole } from "@petcare/types";
import { useAuthStore } from "../features/auth/store";

// Pet Owners land on the feed (matches "Sau khi đăng nhập sẽ vào trang feed"
// in the design brief), Admin lands on the approval queue, Hospital Owner
// lands on their own hospital profile, Vet lands on their own profile.
// Hospital Staff lands on the appointment queue (their shared workspace).
export function DashboardRedirect() {
  const role = useAuthStore((state) => state.user?.role);

  if (role === UserRole.PET_OWNER) {
    return <Navigate to="/feed" replace />;
  }

  if (role === UserRole.ADMIN) {
    return <Navigate to="/admin/partner-registrations" replace />;
  }

  if (role === UserRole.HOSPITAL_OWNER) {
    return <Navigate to="/hospital/profile" replace />;
  }

  if (role === UserRole.VET) {
    return <Navigate to="/vet/profile" replace />;
  }

  if (role === UserRole.HOSPITAL_STAFF) {
    return <Navigate to="/hospital/appointments" replace />;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center text-brand-700">
      Bảng điều khiển cho vai trò này đang được xây dựng.
    </div>
  );
}
