import { Pressable } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { favoritesApi } from "./api/favorites.api";
import { DEFAULT_PALETTE } from "../../theme";

export function FavoriteButton({ hospitalId }: { hospitalId: string }) {
  const queryClient = useQueryClient();
  const listQuery = useQuery({ queryKey: ["favorites", "hospitals"], queryFn: favoritesApi.listHospitals });
  const mutation = useMutation({
    mutationFn: () => favoritesApi.toggleHospital(hospitalId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["favorites", "hospitals"] }),
  });
  const favorited = (listQuery.data ?? []).some((h) => h.id === hospitalId);
  return (
    <Pressable onPress={() => mutation.mutate()} disabled={mutation.isPending || listQuery.isLoading} hitSlop={10} accessibilityRole="button" accessibilityLabel={favorited ? "Bỏ yêu thích" : "Yêu thích"}>
      <Ionicons name={favorited ? "heart" : "heart-outline"} size={26} color={favorited ? "#ef4444" : DEFAULT_PALETTE[500]} />
    </Pressable>
  );
}
