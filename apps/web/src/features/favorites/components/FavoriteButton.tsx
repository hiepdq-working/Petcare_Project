import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { UserRole } from "@petcare/types";
import { favoritesApi } from "../api/favorites.api";
import { useAuthStore } from "../../auth/store";

// Hospital pages are public, so this renders nothing unless the viewer is a
// logged-in Pet Owner — the only role that can keep favorites.
export function FavoriteButton({ hospitalId }: { hospitalId: string }) {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const enabled = status === "authenticated" && role === UserRole.PET_OWNER;
  const queryClient = useQueryClient();

  const listQuery = useQuery({ queryKey: ["favorites", "hospitals"], queryFn: favoritesApi.listHospitals, enabled });
  const mutation = useMutation({
    mutationFn: () => favoritesApi.toggleHospital(hospitalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites", "hospitals"] }),
  });

  if (!enabled) return null;

  const favorited = (listQuery.data ?? []).some((h) => h.id === hospitalId);

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending || listQuery.isLoading}
      aria-label={favorited ? "Bỏ yêu thích phòng khám" : "Yêu thích phòng khám"}
      title={favorited ? "Bỏ yêu thích" : "Yêu thích"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-brand-50 disabled:opacity-60"
    >
      <Heart size={18} className={favorited ? "fill-red-500 text-red-500" : "text-brand-700/60"} />
    </button>
  );
}
