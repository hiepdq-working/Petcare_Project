import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../../../features/chat/api/chat.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Card } from "../../../shared/components/Card";
import { ListScreen } from "../../../shared/components/ListScreen";
import { TabHeader } from "../../../shared/components/TabHeader";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { timeAgo } from "../../../shared/utils/format";
import { DEFAULT_PALETTE } from "../../../theme";

export default function MessagesScreen() {
  const query = useQuery({ queryKey: ["conversations"], queryFn: chatApi.listConversations });
  return (
    <ListScreen
      topInset
      data={query.data ?? []}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      ListHeaderComponent={
        <View style={{ gap: 14 }}>
          <TabHeader title="Tin nhắn" />
          {query.isLoading ? <Loading /> : null}
          {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
        </View>
      }
      ListEmptyComponent={
        query.isLoading || query.isError ? undefined : (
          <EmptyState title="Chưa có cuộc trò chuyện nào" description="Vào trang phòng khám và bấm “Nhắn tin” để bắt đầu." />
        )
      }
      renderItem={({ item: c }) => (
        <Pressable onPress={() => router.push(`/chat/${c.id}`)} accessibilityRole="button" accessibilityLabel={`Cuộc trò chuyện với ${c.otherUserName}${c.unreadCount > 0 ? `, ${c.unreadCount} tin chưa đọc` : ""}`}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar uri={c.otherUserAvatar} size={48} fallback="🏥" />
            <View style={{ flex: 1 }}>
              <AppText variant="semi">{c.otherUserName}</AppText>
              <AppText variant="small" tone={c.unreadCount > 0 ? "default" : "muted"} numberOfLines={1} style={c.unreadCount > 0 ? { fontFamily: "Inter_600SemiBold" } : undefined}>
                {c.lastMessageType === "image" ? "📷 Đã gửi một ảnh" : c.lastMessage ?? "Chưa có tin nhắn"}
              </AppText>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              {c.lastMessageAt ? <AppText variant="caption" tone="muted">{timeAgo(c.lastMessageAt)}</AppText> : null}
              {c.unreadCount > 0 ? (
                <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: DEFAULT_PALETTE[700], alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}>
                  <AppText variant="caption" tone="white" style={{ fontFamily: "Inter_700Bold" }}>{c.unreadCount}</AppText>
                </View>
              ) : null}
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}
