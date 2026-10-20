import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { groupsApi } from "../api/groups.api";
import { socialApi } from "../../social/api/social.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { ImageUploader } from "../../../shared/components/ImageUploader";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PillTabs } from "../../../shared/components/PillTabs";
import { TextField } from "../../../shared/components/TextField";

type Tab = "mine" | "discover";
const TABS: { value: Tab; label: string }[] = [
  { value: "mine", label: "Nhóm của tôi" },
  { value: "discover", label: "Khám phá" },
];

export function GroupsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("mine");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["groups", tab], queryFn: () => groupsApi.list(tab === "mine") });

  const createMutation = useMutation({
    mutationFn: () =>
      groupsApi.create({ name, description: description || undefined, cover: cover ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setName("");
      setDescription("");
      setCover(null);
      setShowForm(false);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => groupsApi.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-brand-900">Nhóm</h1>
        <Button fullWidth={false} onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} /> {showForm ? "Đóng" : "Tạo nhóm"}
        </Button>
      </div>

      {showForm ? (
        <Card as="form" onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4 p-5">
          {createMutation.isError ? <Alert message={extractErrorMessage(createMutation.error)} /> : null}
          <ImageUploader
            value={cover}
            onChange={setCover}
            uploadFn={socialApi.uploadImage}
            label="Chọn ảnh bìa"
            shape="rect"
            placeholderIcon="👥"
          />
          <TextField label="Tên nhóm" required value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-description" className="text-sm font-medium text-brand-900">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              id="group-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <Button type="submit" loading={createMutation.isPending} disabled={name.trim().length < 3}>
            Tạo nhóm
          </Button>
        </Card>
      ) : null}

      <div className="mb-4">
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState
          title={tab === "mine" ? "Bạn chưa tham gia nhóm nào" : "Chưa có nhóm nào"}
          description={tab === "mine" ? "Tạo nhóm mới hoặc sang tab Khám phá để tham gia." : "Hãy là người tạo nhóm đầu tiên."}
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((group) => (
          <Card key={group.id} className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-100">
              {group.cover ? (
                <img src={group.cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">👥</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/groups/${group.id}`} className="font-semibold text-brand-900 hover:underline">
                {group.name}
              </Link>
              <p className="flex items-center gap-1 text-xs text-brand-700/70">
                <Users size={12} /> {group.memberCount} thành viên · {group.ownerName}
              </p>
              {group.description ? <p className="line-clamp-1 text-sm text-brand-700/80">{group.description}</p> : null}
            </div>
            {group.joinedByMe ? (
              <Link to={`/groups/${group.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                Xem
              </Link>
            ) : (
              <Button
                fullWidth={false}
                onClick={() => joinMutation.mutate(group.id)}
                loading={joinMutation.isPending && joinMutation.variables === group.id}
              >
                Tham gia
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
