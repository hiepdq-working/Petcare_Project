import { useState } from "react";
import { Alert, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { ErrorBanner } from "./States";
import { extractErrorMessage, uploadImage } from "../api/client";

interface ImagePickerFieldProps {
  value: string | null;
  onChange: (url: string) => void;
  size?: number;
}

// Picks from the gallery or camera and uploads straight away, so the
// preview always shows what is actually stored (same idea as the web's
// ImageUploader). quality 0.7 keeps photos well under the 5 MB limit.
export function ImagePickerField({ value, onChange, size = 96 }: ImagePickerFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(asset.uri, asset.mimeType);
      onChange(url);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function pickFromLibrary() {
    await handleResult(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 }));
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Cần quyền camera", "Hãy cho phép PetCare dùng camera trong Cài đặt của máy.");
      return;
    }
    await handleResult(await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 }));
  }

  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <Avatar uri={value} size={size} radius={24} />
      {error ? <ErrorBanner message={error} /> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Chọn ảnh" variant="secondary" onPress={pickFromLibrary} loading={uploading} style={{ minHeight: 40 }} />
        <Button title="Chụp ảnh" variant="secondary" onPress={takePhoto} disabled={uploading} style={{ minHeight: 40 }} />
      </View>
    </View>
  );
}
