import { useRef, useState, type ChangeEvent } from "react";
import { petsApi } from "../api/pets.api";
import { extractErrorMessage } from "../../../shared/api/client";

interface AvatarUploaderProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
}

// Uploads immediately on file selection (rather than deferring to form
// submit) so the preview always reflects what's actually stored server
// side — see modules/uploads on the backend for the real disk-upload flow.
export function AvatarUploader({ value, onChange }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await petsApi.uploadAvatar(file);
      onChange(url);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-24 w-24 overflow-hidden rounded-full bg-brand-100">
        {value ? (
          <img src={value} alt="Ảnh đại diện" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🐾</div>
        )}
      </div>
      <label className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
        {uploading ? "Đang tải ảnh lên..." : "Chọn ảnh đại diện"}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
