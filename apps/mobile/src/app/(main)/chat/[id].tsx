import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { chatApi } from "../../../features/chat/api/chat.api";
import { useAuthStore } from "../../../features/auth/store";
import { extractErrorMessage, uploadImage } from "../../../shared/api/client";
import { AppText } from "../../../shared/components/AppText";
import { ErrorBanner, Loading } from "../../../shared/components/States";
import { colors, DEFAULT_PALETTE } from "../../../theme";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const conversationsQuery = useQuery({ queryKey: ["conversations"], queryFn: chatApi.listConversations });
  const messagesQuery = useQuery({ queryKey: ["messages", id], queryFn: () => chatApi.getMessages(id) });
  const title = conversationsQuery.data?.find((c) => c.id === id)?.otherUserName ?? "Tin nhắn";

  const sendMutation = useMutation({
    mutationFn: (input: { message?: string; mediaUrl?: string }) => chatApi.sendMessage(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Opening the thread marks it read server-side (GET messages) — refresh
  // the unread badges to match.
  useEffect(() => {
    if (messagesQuery.isSuccess) void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [messagesQuery.isSuccess, queryClient]);

  function send() {
    const message = text.trim();
    if (!message) return;
    setText("");
    sendMutation.mutate({ message });
  }

  async function sendImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(result.assets[0].uri, result.assets[0].mimeType);
      sendMutation.mutate({ mediaUrl: url });
    } catch (err) {
      Alert.alert("Không gửi được ảnh", extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding" keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <Stack.Screen options={{ title }} />
      {messagesQuery.isLoading ? <Loading /> : null}
      {messagesQuery.isError ? <View style={{ padding: 16 }}><ErrorBanner message={extractErrorMessage(messagesQuery.error)} onRetry={() => void messagesQuery.refetch()} /></View> : null}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 14, gap: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      >
        {messagesQuery.data?.map((m) => {
          const mine = m.senderId === me?.id;
          return (
            <View key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <View style={{ backgroundColor: mine ? DEFAULT_PALETTE[700] : "#fff", borderRadius: 16, padding: m.mediaUrl ? 4 : 11, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}>
                {m.mediaUrl ? <Image source={{ uri: m.mediaUrl }} style={{ width: 200, height: 200, borderRadius: 12 }} contentFit="cover" /> : null}
                {m.message ? <AppText tone={mine ? "white" : "default"}>{m.message}</AppText> : null}
              </View>
              <AppText variant="caption" tone="muted" style={{ alignSelf: mine ? "flex-end" : "flex-start", marginTop: 2 }}>
                {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </AppText>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: DEFAULT_PALETTE[100] }}>
        <Pressable onPress={() => void sendImage()} disabled={uploading} hitSlop={8}>
          <Ionicons name="image-outline" size={26} color={uploading ? DEFAULT_PALETTE[300] : DEFAULT_PALETTE[700]} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={DEFAULT_PALETTE[700] + "80"}
          multiline
          style={{ flex: 1, maxHeight: 110, backgroundColor: DEFAULT_PALETTE[50], borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, fontFamily: "Inter_400Regular", fontSize: 15, color: DEFAULT_PALETTE[900] }}
        />
        <Pressable onPress={send} disabled={!text.trim() || sendMutation.isPending} hitSlop={8}>
          <Ionicons name="send" size={24} color={text.trim() ? DEFAULT_PALETTE[700] : DEFAULT_PALETTE[300]} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
