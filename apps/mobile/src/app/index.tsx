import { Redirect } from "expo-router";
import { useAuthStore } from "../features/auth/store";

// Anchor route: the protected-route guards in _layout.tsx send people here
// right after login/logout, and this hands them to the right side.
export default function Index() {
  const status = useAuthStore((state) => state.status);
  return <Redirect href={status === "authenticated" ? "/feed" : "/login"} />;
}
