import { useState } from "react";
import { Alert, Image, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "../../../features/pets/api/pets.api";
import { socialApi } from "../../../features/social/api/social.api";
import { extractErrorMessage, uploadImage } from "../../../shared/api/client";
import { AppText } from "../../../shared/components/AppText";
import { Button } from "../../../shared/components/Button";
import { Chips } from "../../../shared/components/Chips";
import { Screen } from "../../../shared/components/Screen";
import { ErrorBanner } from "../../../shared/components/States";
import { TextField } from "../../../shared/components/TextField";
import { DEFAULT_PALETTE } from "../../../theme";

// Pet Owner posts are camera-only by design (one live photo, like the web's
// Locket-style composer) — there is no gallery picker here.
export default function NewPostScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<{ localUri: string; url: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [petId, setPetId] = useState("");

  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });

  const mutation = useMutation({
    mutationFn: () =>
      socialApi.create({
        content: content.trim() || undefined,
        petId: petId || undefined,
        groupId,
        media: photo?.url ? [{ mediaUrl: photo.url, mediaType: "image" }] : [],
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.back();
    },
  });

  async function capture() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Cần quyền camera", "Hãy cho phép PetCare dùng camera trong Cài đặt của máy.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhoto({ localUri: asset.uri, url: null });
    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadImage(asset.uri, asset.mimeType);
      setPhoto({ localUri: asset.uri, url });
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen>
      {mutation.isError ? <ErrorBanner message={extractErrorMessage(mutation.error)} /> : null}
      {uploadError ? <ErrorBanner message={uploadError} /> : null}

      {photo ? (
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={{ width: 260, height: 260, borderRadius: 18, overflow: "hidden", backgroundColor: DEFAULT_PALETTE[100] }}>
            <Image source={{ uri: photo.localUri }} style={{ width: 260, height: 260 }} resizeMode="cover" />
            {uploading ? (
              <View style={{ ...absoluteFill, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                <AppText tone="white" variant="small">Đang tải ảnh lên...</AppText>
              </View>
            ) : null}
          </View>
          <Button title="Chụp lại" variant="secondary" onPress={() => void capture()} disabled={uploading} style={{ minHeight: 40 }} />
        </View>
      ) : (
        <Button title="📷 Chụp ảnh cùng thú cưng" variant="secondary" onPress={() => void capture()} style={{ minHeight: 120 }} />
      )}

      <TextField label="Viết vài dòng về khoảnh khắc này" value={content} onChangeText={setContent} multiline />

      {(petsQuery.data?.length ?? 0) > 0 ? (
        <Chips
          label="Gắn thẻ thú cưng (không bắt buộc)"
          value={petId}
          onChange={(v) => setPetId(v === petId ? "" : v)}
          options={(petsQuery.data ?? []).map((p) => ({ value: p.id, label: `🐾 ${p.name}` }))}
        />
      ) : null}

      <Button title="Đăng bài" loading={mutation.isPending} disabled={!photo?.url || uploading} onPress={() => mutation.mutate()} />
    </Screen>
  );
}

const absoluteFill = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };
