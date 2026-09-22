import { useRef, useState, type ChangeEvent } from "react";
import { extractErrorMessage } from "../api/client";

interface ImageUploaderProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
  uploadFn: (file: File) => Promise<{ url: string }>;
  label?: string;
  shape?: "circle" | "rect";
  placeholderIcon?: string;
}

// Generic — used for Pet avatars, Hospital logo/cover, and anywhere else
// that needs "pick an image, upload it now, show the result". Uploads
// immediately on file selection (rather than deferring to form submit)
// so the preview always reflects what's actually stored server side.
export function ImageUploader({
  value,
  onChange,
  uploadFn,
  label = "Chọn ảnh",
  shape = "circle",
  placeholderIcon = "🐾",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadFn(file);
      onChange(url);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const frameClass =
    shape === "circle" ? "h-24 w-24 rounded-full" : "aspect-[3/1] w-full rounded-xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`overflow-hidden bg-brand-100 ${frameClass}`}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">{placeholderIcon}</div>
        )}
      </div>
      <label className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
        {uploading ? "Đang tải ảnh lên..." : label}
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
