import { useRef, useState, type ChangeEvent } from "react";
import { partnersApi } from "../api/partners.api";
import { extractErrorMessage } from "../../../shared/api/client";

interface DocumentUploaderProps {
  label: string;
  required?: boolean;
  value: string | undefined;
  onChange: (url: string) => void;
}

// Uploads immediately on file selection (same pattern as
// features/pets/components/AvatarUploader) so what's shown always
// reflects what's actually stored, ready to submit with the form.
export function DocumentUploader({ label, required, value, onChange }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await partnersApi.uploadDocument(file);
      onChange(url);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-brand-900">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-brand-200 px-4 py-3 text-sm hover:bg-brand-50">
        <span className={value ? "text-brand-900" : "text-brand-700/60"}>
          {uploading ? "Đang tải lên..." : value ? "Đã tải lên — nhấn để thay đổi" : "Chọn file (ảnh hoặc PDF)"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      {value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
          Xem file đã tải lên
        </a>
      ) : null}
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
