import { useState } from "react";
import { Alert, Modal, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import type { MedicalFileDto } from "@petcare/types";
import { AppText } from "../../shared/components/AppText";
import { Card } from "../../shared/components/Card";
import { DEFAULT_PALETTE } from "../../theme";

function isImage(file: MedicalFileDto): boolean {
  return file.fileType.startsWith("image") || /\.(png|jpe?g|webp|gif)$/i.test(file.fileName);
}

// Images open in a full-screen viewer; anything else (PDF, docs) is
// downloaded to the cache and handed to the system share sheet, which lists
// the apps that can actually open it.
export function AttachmentList({ files }: { files: MedicalFileDto[] }) {
  const [viewing, setViewing] = useState<MedicalFileDto | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function openFile(file: MedicalFileDto) {
    if (isImage(file)) {
      setViewing(file);
      return;
    }
    setBusyId(file.id);
    try {
      const target = new File(Paths.cache, file.fileName.replace(/[^\w.\-]+/g, "_"));
      if (target.exists) target.delete();
      const downloaded = await File.downloadFileAsync(file.fileUrl, target);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      } else {
        Alert.alert("Không mở được tệp", "Thiết bị chưa có ứng dụng phù hợp để mở tệp này.");
      }
    } catch {
      Alert.alert("Không tải được tệp", "Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <AppText variant="title">File đính kèm</AppText>
      {files.map((file) => (
        <Pressable
          key={file.id}
          onPress={() => void openFile(file)}
          disabled={busyId === file.id}
          accessibilityRole="button"
          accessibilityLabel={`Mở tệp ${file.fileName}`}
        >
          <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name={isImage(file) ? "image-outline" : "document-text-outline"} size={22} color={DEFAULT_PALETTE[700]} />
            <AppText tone="brand" style={{ flex: 1 }} numberOfLines={1}>{file.fileName}</AppText>
            <AppText variant="caption" tone="muted">{busyId === file.id ? "Đang tải..." : isImage(file) ? "Xem" : "Mở"}</AppText>
          </Card>
        </Pressable>
      ))}

      <Modal visible={!!viewing} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable
          onPress={() => setViewing(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel="Đóng ảnh"
        >
          {viewing ? <Image source={{ uri: viewing.fileUrl }} style={{ width: "100%", height: "80%" }} contentFit="contain" /> : null}
          <AppText tone="white" variant="small" style={{ textAlign: "center", marginTop: 12 }}>
            Chạm để đóng
          </AppText>
        </Pressable>
      </Modal>
    </View>
  );
}
