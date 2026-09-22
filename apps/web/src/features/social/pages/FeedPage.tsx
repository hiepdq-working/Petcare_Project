import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostMediaDto } from "@petcare/types";
import { socialApi } from "../api/social.api";
import { petsApi } from "../../pets/api/pets.api";
import { PostCard } from "../components/PostCard";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";

export function FeedPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [petId, setPetId] = useState("");
  const [media, setMedia] = useState<Pick<PostMediaDto, "mediaUrl" | "mediaType">[]>([]);
  const [uploading, setUploading] = useState(false);

  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const feedQuery = useQuery({ queryKey: ["posts", "feed"], queryFn: socialApi.listFeed });

  const createMutation = useMutation({
    mutationFn: () => socialApi.create({ content: content || undefined, petId: petId || undefined, media }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      setContent("");
      setPetId("");
      setMedia([]);
    },
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => socialApi.toggleLike(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", "feed"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", "feed"] }),
  });

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { url } = await socialApi.uploadImage(file);
        setMedia((m) => [...m, { mediaUrl: url, mediaType: "image" }]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  function handleDelete(id: string) {
    if (window.confirm("Xoá bài viết này?")) {
      deleteMutation.mutate(id);
    }
  }

  const canPost = content.trim().length > 0 || media.length > 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Bảng tin</h1>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm">
        {createMutation.isError ? (
          <div className="mb-3">
            <Alert message={extractErrorMessage(createMutation.error)} />
          </div>
        ) : null}

        <textarea
          rows={3}
          placeholder="Chia sẻ khoảnh khắc cùng thú cưng của bạn..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />

        {media.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {media.map((m, index) => (
              <div key={m.mediaUrl} className="relative aspect-square overflow-hidden rounded-xl">
                <img src={m.mediaUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMedia((list) => list.filter((_, i) => i !== index))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
            {uploading ? "Đang tải ảnh..." : "+ Thêm ảnh"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
          </label>

          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Không gắn thẻ thú cưng</option>
            {petsQuery.data?.map((pet) => (
              <option key={pet.id} value={pet.id}>
                🐾 {pet.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="mt-4" loading={createMutation.isPending} disabled={!canPost || uploading}>
          Đăng bài
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-4">
        {feedQuery.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}
        {feedQuery.isError ? <Alert message={extractErrorMessage(feedQuery.error)} /> : null}
        {feedQuery.data?.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
            Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
          </div>
        ) : null}
        {feedQuery.data?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onToggleLike={() => likeMutation.mutate(post.id)}
            onDelete={() => handleDelete(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
