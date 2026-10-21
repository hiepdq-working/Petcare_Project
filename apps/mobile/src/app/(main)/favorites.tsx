import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi } from "../../features/favorites/api/favorites.api";
import { FavoriteButton } from "../../features/favorites/FavoriteButton";
import { extractErrorMessage } from "../../shared/api/client";
import { Avatar } from "../../shared/components/Avatar";
import { AppText } from "../../shared/components/AppText";
import { Badge } from "../../shared/components/Badge";
import { Card } from "../../shared/components/Card";
import { ListScreen } from "../../shared/components/ListScreen";
import { EmptyState, ErrorBanner, Loading } from "../../shared/components/States";

export default function FavoritesScreen() {
  const query = useQuery({ queryKey: ["favorites", "hospitals"], queryFn: favoritesApi.listHospitals });
  return (
    <ListScreen
      data={query.data ?? []}
      keyExtractor={(h) => h.id}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      ListHeaderComponent={
        query.isLoading || query.isError ? (
          <View style={{ gap: 14 }}>
            {query.isLoading ? <Loading /> : null}
            {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        query.isLoading || query.isError ? undefined : (
          <EmptyState title="Bạn chưa yêu thích phòng khám nào" description="Bấm biểu tượng trái tim ở trang phòng khám để lưu lại đây." />
        )
      }
      renderItem={({ item: h }) => (
        <Pressable onPress={() => router.push(`/hospital/${h.id}`)} accessibilityRole="button" accessibilityLabel={`Mở ${h.name}`}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar uri={h.logo} size={56} radius={14} fallback="🏥" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="semi">{h.name}</AppText>
              {h.address ? <AppText variant="small" tone="muted" numberOfLines={1}>{h.address}</AppText> : null}
              {h.isEmergency ? <Badge tone="red">Cấp cứu 24/7</Badge> : null}
            </View>
            <FavoriteButton hospitalId={h.id} />
          </Card>
        </Pressable>
      )}
    />
  );
}
