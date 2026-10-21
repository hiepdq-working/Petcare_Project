import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { StaffPosition, UserRole } from "@petcare/types";
import { LoadingState } from "../../../shared/components/LoadingState";
import { useStaffMe } from "../../hospital-staff/useStaffMe";
import { useAuthStore } from "../store";

// UX guard on top of RequireRole: clinic staff are split by position
// (receptionist vs nurse), while owners pass straight through. The API
// enforces the same split.
export function RequireStaffPosition({ position, children }: { position: StaffPosition[]; children: ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const staffMe = useStaffMe();

  if (role !== UserRole.HOSPITAL_STAFF) return <>{children}</>;
  if (staffMe.isLoading) return <LoadingState />;
  if (!staffMe.data || !position.includes(staffMe.data.position)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
