import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@petcare/types";
import { useAuthStore } from "../../features/auth/store";
import { hospitalApi } from "../../features/hospital/api/hospital.api";
import { vetsApi } from "../../features/vets/api/vets.api";
import { BrandScope } from "../../shared/components/BrandScope";
import { TopBar } from "./TopBar";
import { Sidebar, hasSidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { RightRail } from "./RightRail";

// Re-colors the whole workspace shell (Sidebar, TopBar, every brand-* class
// on the page) to a Hospital Owner's or Vet's own clinic brand color — see
// shared/components/BrandScope.tsx. Query keys match the ones those roles'
// own profile pages already use, so this never issues a duplicate request.
function useOwnHospitalBrandColor(role: UserRole | undefined): string | null | undefined {
  const hospitalQuery = useQuery({
    queryKey: ["hospital", "me"],
    queryFn: hospitalApi.getMine,
    enabled: role === UserRole.HOSPITAL_OWNER,
  });
  const vetQuery = useQuery({
    queryKey: ["vets", "me"],
    queryFn: vetsApi.getMyProfile,
    enabled: role === UserRole.VET,
  });

  if (role === UserRole.HOSPITAL_OWNER) return hospitalQuery.data?.brandColor;
  if (role === UserRole.VET) return vetQuery.data?.hospitalBrandColor;
  return undefined;
}

export function AppShell() {
  const role = useAuthStore((state) => state.user?.role);
  const showSidebar = hasSidebar(role);
  // Pet Owner (and any role without a sidebar workspace) gets the consumer
  // bottom-tab shell instead — see Sidebar.tsx's NAV_BY_ROLE for which roles
  // get a workspace sidebar.
  const isPetOwner = role === UserRole.PET_OWNER;
  const brandColor = useOwnHospitalBrandColor(role);

  return (
    <BrandScope color={brandColor}>
      <div className="min-h-screen">
        <TopBar />
        <div className="mx-auto flex max-w-7xl">
          {showSidebar ? <Sidebar role={role as UserRole} /> : null}
          <main className={`min-w-0 flex-1 ${isPetOwner ? "pb-24" : "pb-8"}`}>
            <Outlet />
          </main>
          {isPetOwner ? <RightRail /> : null}
        </div>
        {isPetOwner ? <BottomNav /> : null}
      </div>
    </BrandScope>
  );
}
