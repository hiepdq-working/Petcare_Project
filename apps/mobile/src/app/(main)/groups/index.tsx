import { useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../../../features/groups/api/groups.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Avatar } from "../../../shared/components/Avatar";
import { AppText } from "../../../shared/components/AppText";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { ImagePickerField } from "../../../shared/components/ImagePickerField";
import { PillTabs } from "../../../shared/components/PillTabs";
import { Screen } from "../../../shared/components/Screen";
import { EmptyState, ErrorBanner, Loading } from "../../../shared/components/States";
import { TextField } from "../../../shared/components/TextField";

type Tab = "mine" | "discover";
const TABS: { value: Tab; label: string }[] = [
  { value: "mine", label: "Nhóm của tôi" },
  { value: "discover", label: "Khám phá" },
];

export default function GroupsScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("mine");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["groups", tab], queryFn: () => groupsApi.list(tab === "mine") });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["groups"] });

  const createMutation = useMutation({
    mutationFn: () => groupsApi.create({ name: name.trim(), description: description.trim() || undefined, cover: cover ?? undefined }),
    onSuccess: (group) => {
      refresh();
      setName("");
      setDescription("");
      setCover(null);
      setShowForm(false);
      router.push(`/groups/${group.id}`);
    },
  });
  const joinMutation = useMutation({ mutationFn: (id: string) => groupsApi.join(id), onSuccess: refresh });

  return (
    <Screen refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
      <Button title={showForm ? "Đóng" : "+ Tạo nhóm"} variant={showForm ? "secondary" : "primary"} onPress={() => setShowForm((v) => !v)} />

      {showForm ? (
        <Card style={{ gap: 12 }}>
          {createMutation.isError ? <ErrorBanner message={extractErrorMessage(createMutation.error)} /> : null}
          <ImagePickerField value={cover} onChange={setCover} />
          <TextField label="Tên nhóm" value={name} onChangeText={setName} />
          <TextField label="Mô tả (không bắt buộc)" value={description} onChangeText={setDescription} multiline />
          <Button title="Tạo nhóm" loading={createMutation.isPending} disabled={name.trim().length < 3} onPress={() => createMutation.mutate()} />
        </Card>
      ) : null}

      <PillTabs tabs={TABS} value={tab} onChange={setTab} />

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorBanner message={extractErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState
          title={tab === "mine" ? "Bạn chưa tham gia nhóm nào" : "Chưa có nhóm nào"}
          description={tab === "mine" ? "Tạo nhóm mới hoặc sang tab Khám phá để tham gia." : "Hãy là người tạo nhóm đầu tiên."}
        />
      ) : null}

      {query.data?.map((g) => (
        <Pressable key={g.id} onPress={() => router.push(`/groups/${g.id}`)}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar uri={g.cover} size={56} radius={14} fallback="👥" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="semi">{g.name}</AppText>
              <AppText variant="caption" tone="muted">{g.memberCount} thành viên · {g.ownerName}</AppText>
              {g.description ? <AppText variant="small" numberOfLines={1}>{g.description}</AppText> : null}
            </View>
            {g.joinedByMe ? null : (
              <Button title="Tham gia" onPress={() => joinMutation.mutate(g.id)} style={{ minHeight: 38 }} />
            )}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
