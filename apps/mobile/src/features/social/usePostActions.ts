import { Alert } from "react-native";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { PostDto } from "@petcare/types";
import { extractErrorMessage } from "../../shared/api/client";
import { toast } from "../../shared/components/Toast";
import { socialApi } from "./api/social.api";

function isPost(value: unknown): value is PostDto {
  return typeof value === "object" && value !== null && "likeCount" in value && "savedByMe" in value;
}

// Rewrites every cached copy of a post — plain lists, infinite feed pages and
// the detail screen's { post, comments } — so a tap shows instantly everywhere.
function mapCached(data: unknown, patch: (post: PostDto) => PostDto): unknown {
  if (Array.isArray(data)) return data.map((item) => (isPost(item) ? patch(item) : item));
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.pages)) return { ...record, pages: record.pages.map((page) => mapCached(page, patch)) };
    if (isPost(record.post)) return { ...record, post: patch(record.post) };
  }
  return data;
}

function patchPost(queryClient: QueryClient, postId: string, patch: (post: PostDto) => PostDto) {
  const apply = (post: PostDto) => (post.id === postId ? patch(post) : post);
  queryClient.setQueriesData({ queryKey: ["posts"] }, (data: unknown) => mapCached(data, apply));
}

// Like / save apply optimistically and roll back (with a toast) on failure;
// delete waits for the server before reporting success.
export function usePostActions() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["posts"] });

  function optimistic(toggle: (id: string) => Promise<unknown>, patch: (post: PostDto) => PostDto) {
    return {
      mutationFn: toggle,
      onMutate: async (id: string) => {
        await queryClient.cancelQueries({ queryKey: ["posts"] });
        const snapshot = queryClient.getQueriesData({ queryKey: ["posts"] });
        patchPost(queryClient, id, patch);
        return { snapshot };
      },
      onError: (error: unknown, _id: string, context: { snapshot: [readonly unknown[], unknown][] } | undefined) => {
        context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
        toast.error(extractErrorMessage(error));
      },
      onSettled: refresh,
    };
  }

  const like = useMutation(
    optimistic(socialApi.toggleLike, (post) => ({
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: Math.max(0, post.likeCount + (post.likedByMe ? -1 : 1)),
    })),
  );
  const save = useMutation(optimistic(socialApi.toggleSave, (post) => ({ ...post, savedByMe: !post.savedByMe })));
  const remove = useMutation({
    mutationFn: (vars: { id: string; onDeleted?: () => void }) => socialApi.remove(vars.id),
    onSuccess: (_data, vars) => {
      refresh();
      toast.info("Đã xoá bài viết");
      vars.onDeleted?.();
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  function confirmDelete(id: string, onDeleted?: () => void) {
    Alert.alert("Xoá bài viết?", "Bài viết sẽ bị xoá vĩnh viễn.", [
      { text: "Giữ lại", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: () => remove.mutate({ id, onDeleted }) },
    ]);
  }

  return {
    toggleLike: (id: string) => like.mutate(id),
    toggleSave: (id: string) => save.mutate(id),
    confirmDelete,
    refresh,
  };
}
