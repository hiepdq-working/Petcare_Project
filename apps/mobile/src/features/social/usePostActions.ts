import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "./api/social.api";

// Like / save / delete wired to refresh every post list at once.
export function usePostActions() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["posts"] });
  const like = useMutation({ mutationFn: (id: string) => socialApi.toggleLike(id), onSuccess: refresh });
  const save = useMutation({ mutationFn: (id: string) => socialApi.toggleSave(id), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => socialApi.remove(id), onSuccess: refresh });

  function confirmDelete(id: string) {
    Alert.alert("Xoá bài viết?", "Bài viết sẽ bị xoá vĩnh viễn.", [
      { text: "Giữ lại", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: () => remove.mutate(id) },
    ]);
  }

  return {
    toggleLike: (id: string) => like.mutate(id),
    toggleSave: (id: string) => save.mutate(id),
    confirmDelete,
    refresh,
  };
}
