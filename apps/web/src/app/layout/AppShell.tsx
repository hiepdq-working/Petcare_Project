import { Outlet } from "react-router-dom";
import { UserRole } from "@petcare/types";
import { useAuthStore } from "../../features/auth/store";
import { TopBar } from "./TopBar";
import { Sidebar, hasSidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const role = useAuthStore((state) => state.user?.role);
  const showSidebar = hasSidebar(role);
  // Pet Owner (and any role without a sidebar workspace) gets the consumer
  // bottom-tab shell instead — see Sidebar.tsx's NAV_BY_ROLE for which roles
  // get a workspace sidebar.
  const showBottomNav = role === UserRole.PET_OWNER;

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto flex max-w-7xl">
        {showSidebar ? <Sidebar role={role as UserRole} /> : null}
        <main className={`min-w-0 flex-1 ${showBottomNav ? "pb-24" : "pb-8"}`}>
          <Outlet />
        </main>
      </div>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
