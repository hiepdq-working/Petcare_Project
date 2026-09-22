import { petsApi } from "../api/pets.api";
import { ImageUploader } from "../../../shared/components/ImageUploader";

interface AvatarUploaderProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
}

export function AvatarUploader({ value, onChange }: AvatarUploaderProps) {
  return (
    <ImageUploader
      value={value}
      onChange={onChange}
      uploadFn={petsApi.uploadAvatar}
      label="Chọn ảnh đại diện"
      shape="circle"
    />
  );
}
