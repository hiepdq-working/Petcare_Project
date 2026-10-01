import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type PetDto, type PostMediaDto } from "@petcare/types";
import { socialApi } from "../api/social.api";
import { petsApi } from "../../pets/api/pets.api";
import { vetsApi } from "../../vets/api/vets.api";
import { PostCard } from "../components/PostCard";
import { CameraCapture } from "../components/CameraCapture";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const HOSPITAL_MAX_MEDIA = 5;

export function FeedPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [activePetId, setActivePetId] = useState<string | null>(null);

  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: petsApi.list,
    enabled: user?.role === UserRole.PET_OWNER,
  });

  const feedQuery = useQuery({ queryKey: ["posts", "feed"], queryFn: socialApi.listFeed, enabled: !activePetId });
  const petFeedQuery = useQuery({
    queryKey: ["posts", "pet", activePetId],
    queryFn: () => socialApi.listByPet(activePetId!),
    enabled: Boolean(activePetId),
  });

  const visiblePosts = activePetId ? petFeedQuery.data : feedQuery.data;
  const visibleLoading = activePetId ? petFeedQuery.isLoading : feedQuery.isLoading;

  const likeMutation = useMutation({
    mutationFn: (id: string) => socialApi.toggleLike(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  function handleDelete(id: string) {
    if (window.confirm("Xoá bài viết này?")) {
      deleteMutation.mutate(id);
    }
  }

  const invalidateFeed = () => queryClient.invalidateQueries({ queryKey: ["posts"] });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Bảng tin</h1>

      {user?.role === UserRole.HOSPITAL_OWNER ? (
        <HospitalPostComposer onPosted={invalidateFeed} />
      ) : (
        <PetOwnerPostComposer onPosted={invalidateFeed} />
      )}

      {/* Replaces Facebook-style "stories" with a row of the owner's own
          pets — selecting one filters the feed to just that pet's posts. */}
      {petsQuery.data && petsQuery.data.length > 0 ? (
        <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setActivePetId(null)}
            className={`flex shrink-0 flex-col items-center gap-1.5 ${!activePetId ? "" : "opacity-60"}`}
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-brand-100 text-xs font-bold text-brand-700 ${
                !activePetId ? "border-brand-700" : "border-transparent"
              }`}
            >
              Tất cả
            </span>
          </button>
          {petsQuery.data.map((pet: PetDto) => (
            <button
              key={pet.id}
              onClick={() => setActivePetId(pet.id)}
              className={`flex shrink-0 flex-col items-center gap-1.5 ${activePetId === pet.id ? "" : "opacity-60"}`}
            >
              <span
                className={`h-14 w-14 overflow-hidden rounded-full border-2 bg-brand-100 ${
                  activePetId === pet.id ? "border-brand-700" : "border-transparent"
                }`}
              >
                {pet.avatar ? (
                  <img src={pet.avatar} alt={pet.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl">🐾</span>
                )}
              </span>
              <span className="max-w-[56px] truncate text-xs font-medium text-brand-800">{pet.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {visibleLoading ? <LoadingState /> : null}
        {feedQuery.isError ? <Alert message={extractErrorMessage(feedQuery.error)} /> : null}
        {!visibleLoading && visiblePosts?.length === 0 ? (
          <EmptyState title="Chưa có bài viết nào" description="Hãy là người đầu tiên chia sẻ khoảnh khắc!" />
        ) : null}
        {visiblePosts?.map((post) => (
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

// Up to 5 uploaded photos, an optional vet tag from the hospital's own
// staff — matches HospitalAppointmentsPage-style forms elsewhere.
function HospitalPostComposer({ onPosted }: { onPosted: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [vetId, setVetId] = useState("");
  const [media, setMedia] = useState<Pick<PostMediaDto, "mediaUrl" | "mediaType">[]>([]);
  const [uploading, setUploading] = useState(false);

  const vetsQuery = useQuery({ queryKey: ["vets", "mine"], queryFn: vetsApi.list });

  const createMutation = useMutation({
    mutationFn: () => socialApi.create({ content: content || undefined, vetId: vetId || undefined, media }),
    onSuccess: () => {
      onPosted();
      setContent("");
      setVetId("");
      setMedia([]);
    },
  });

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, HOSPITAL_MAX_MEDIA - media.length);
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

  const canPost = content.trim().length > 0 || media.length > 0;

  return (
    <Card as="form" onSubmit={handleSubmit} className="p-5">
      {createMutation.isError ? (
        <div className="mb-3">
          <Alert message={extractErrorMessage(createMutation.error)} />
        </div>
      ) : null}

      <textarea
        rows={3}
        placeholder="Chia sẻ tin tức, hình ảnh phòng khám..."
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
        <label
          className={`text-sm font-semibold text-brand-700 ${media.length >= HOSPITAL_MAX_MEDIA ? "opacity-40" : "cursor-pointer hover:underline"}`}
        >
          {uploading ? "Đang tải ảnh..." : `+ Thêm ảnh (${media.length}/${HOSPITAL_MAX_MEDIA})`}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={media.length >= HOSPITAL_MAX_MEDIA}
            className="hidden"
            onChange={handleFilesChange}
          />
        </label>

        <select
          value={vetId}
          onChange={(e) => setVetId(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Không gắn thẻ bác sĩ</option>
          {vetsQuery.data?.map((vet) => (
            <option key={vet.id} value={vet.id}>
              🩺 {vet.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="mt-4" loading={createMutation.isPending} disabled={!canPost || uploading}>
        Đăng bài
      </Button>
    </Card>
  );
}

// Locket-style: the only way a Pet Owner gets a photo into a post is a
// live camera capture, never a file picker — see CameraCapture. Exactly 1
// photo per post (enforced server-side too, see PostService).
function PetOwnerPostComposer({ onPosted }: { onPosted: () => void }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [captured, setCaptured] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [petId, setPetId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });

  const createMutation = useMutation({
    mutationFn: () =>
      socialApi.create({
        content: content || undefined,
        petId: petId || undefined,
        media: uploadedUrl ? [{ mediaUrl: uploadedUrl, mediaType: "image" }] : [],
      }),
    onSuccess: () => {
      onPosted();
      reset();
    },
  });

  function reset() {
    if (captured) URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
    setUploadedUrl(null);
    setContent("");
    setPetId("");
    setUploadError(null);
  }

  async function handleCapture(blob: Blob) {
    setCameraOpen(false);
    const previewUrl = URL.createObjectURL(blob);
    setCaptured({ blob, previewUrl });
    setUploading(true);
    setUploadError(null);
    try {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const { url } = await socialApi.uploadImage(file);
      setUploadedUrl(url);
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (uploadedUrl) createMutation.mutate();
  }

  return (
    <Card className="p-5">
      {cameraOpen ? <CameraCapture onCapture={handleCapture} onClose={() => setCameraOpen(false)} /> : null}

      {!captured ? (
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 py-6 text-brand-700 hover:bg-brand-50"
        >
          📷 Chụp ảnh cùng thú cưng
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {uploadError ? <Alert message={uploadError} /> : null}
          {createMutation.isError ? <Alert message={extractErrorMessage(createMutation.error)} /> : null}

          <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-xl">
            <img src={captured.previewUrl} alt="" className="h-full w-full object-cover" />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                Đang tải ảnh lên...
              </div>
            ) : null}
          </div>

          <textarea
            rows={2}
            placeholder="Viết vài dòng về khoảnh khắc này..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />

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

          <div className="flex gap-3">
            <Button type="submit" loading={createMutation.isPending} disabled={!uploadedUrl || uploading}>
              Đăng bài
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Chụp lại
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
