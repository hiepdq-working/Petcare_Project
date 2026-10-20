import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationDto } from "@petcare/types";
import { notificationsApi } from "../../features/notifications/api/notifications.api";
import { extractErrorMessage } from "../../shared/api/client";
import { AppText } from "../../shared/components/AppText";
import { Card } from "../../shared/components/Card";
import { Screen } from "../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../shared/components/States";
import { timeAgo } from "../../shared/utils/format";
import { DEFAULT_PALETTE } from "../../theme";

// Where a notification leads (same mapping as the web's bell).
function hrefFor(n: NotificationDto): string | null {
  switch (n.type) {
    case "APPOINTMENT":
      return "/appointments";
    case "MESSAGE":
      return n.refId ? `/chat/${n.refId}` : "/messages";
    case "PROMOTION":
    case "SOCIAL":
      return n.refId ? `/post/${n.refId}` : null;
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["notifications", "list"], queryFn: notificationsApi.list });
  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Screen refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? <EmptyState title="Không có thông báo nào" /> : null}
      {query.data?.map((n) => (
        <Pressable
          key={n.id}
          onPress={() => {
            if (!n.isRead) markRead.mutate(n.id);
            const href = hrefFor(n);
            if (href) router.push(href as never);
          }}
        >
          <Card style={{ gap: 2, opacity: n.isRead ? 0.7 : 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <AppText variant="semi" style={{ flex: 1 }}>{n.title}</AppText>
              {!n.isRead ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: DEFAULT_PALETTE[600], marginTop: 6 }} /> : null}
            </View>
            {n.content ? <AppText variant="small" tone="muted">{n.content}</AppText> : null}
            <AppText variant="caption" tone="muted">{timeAgo(n.createdAt)}</AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
