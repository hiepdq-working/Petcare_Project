import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "@petcare/types";
import { useAuthStore } from "../store";

// Frontend mirror of the backend's RolesGuard — purely a UX guard (the
// API enforces the real authorization), so a user without this role just
// gets bounced to their own home instead of seeing a route that would
// 403 on every request.
export function RequireRole({ role, children }: { role: UserRole | UserRole[]; children: ReactNode }) {
  const userRole = useAuthStore((state) => state.user?.role);
  const allowed = Array.isArray(role) ? role : [role];

  if (!userRole || !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
