import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@petcare/types";
import { useAuthStore } from "../auth/store";
import { hospitalStaffApi } from "../vets/api/hospital-staff.api";

// A staff member's position and clinic. Disabled for every other role so
// Owners/Vets/Pet Owners never fire the request.
export function useStaffMe() {
  const role = useAuthStore((state) => state.user?.role);
  return useQuery({
    queryKey: ["hospital-staff", "me"],
    queryFn: hospitalStaffApi.getMe,
    enabled: role === UserRole.HOSPITAL_STAFF,
    staleTime: 60_000,
  });
}
