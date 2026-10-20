import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { groupsApi } from "../api/groups.api";
import { socialApi } from "../../social/api/social.api";
import { PostCard } from "../../social/components/PostCard";
import { PetOwnerPostComposer } from "../../social/pages/FeedPage";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const groupQuery = useQuery({ queryKey: ["groups", "detail", id], queryFn: () => groupsApi.getOne(id!) });
  const group = groupQuery.data;
  const postsQuery = useQuery({
    queryKey: ["posts", "group", id],
    queryFn: () => groupsApi.listPosts(id!),
    enabled: Boolean(group?.joinedByMe),
  });

  const refreshGroup = () => queryClient.invalidateQueries({ queryKey: ["groups"] });
  const joinMutation = useMutation({ mutationFn: () => groupsApi.join(id!), onSuccess: refreshGroup });
  const leaveMutation = useMutation({ mutationFn: () => groupsApi.leave(id!), onSuccess: refreshGroup });

  const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ["posts"] });
  const likeMutation = useMutation({ mutationFn: (postId: string) => socialApi.toggleLike(postId), onSuccess: refreshPosts });
  const saveMutation = useMutation({ mutationFn: (postId: string) => socialApi.toggleSave(postId), onSuccess: refreshPosts });
  const deleteMutation = useMutation({ mutationFn: (postId: string) => socialApi.remove(postId), onSuccess: refreshPosts });

  if (groupQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }
  if (groupQuery.isError || !group) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(groupQuery.error)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/groups" className="text-sm text-brand-700 hover:underline">
        ← Tất cả nhóm
      </Link>

      <Card className="mt-4 overflow-hidden">
        <div className="aspect-[3/1] w-full bg-brand-100">
          {group.cover ? (
            <img src={group.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">👥</div>
          )}
        </div>
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold text-brand-900">{group.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-brand-700/70">
              <Users size={14} /> {group.memberCount} thành viên · Chủ nhóm: {group.ownerName}
            </p>
            {group.description ? <p className="mt-2 text-sm text-brand-700/90">{group.description}</p> : null}
          </div>
          {group.joinedByMe ? (
            group.isOwner ? null : (
              <Button variant="ghost" fullWidth={false} onClick={() => leaveMutation.mutate()} loading={leaveMutation.isPending}>
                Rời nhóm
              </Button>
            )
          ) : (
            <Button fullWidth={false} onClick={() => joinMutation.mutate()} loading={joinMutation.isPending}>
              Tham gia
            </Button>
          )}
        </div>
      </Card>

      {joinMutation.isError ? <div className="mt-3"><Alert message={extractErrorMessage(joinMutation.error)} /></div> : null}
      {leaveMutation.isError ? <div className="mt-3"><Alert message={extractErrorMessage(leaveMutation.error)} /></div> : null}

      {!group.joinedByMe ? (
        <Card className="mt-6 p-6 text-center text-sm text-brand-700/80">
          Tham gia nhóm để xem và đăng bài viết.
        </Card>
      ) : (
        <>
          <div className="mt-6">
            <PetOwnerPostComposer onPosted={refreshPosts} groupId={group.id} />
          </div>

          {postsQuery.isLoading ? <LoadingState /> : null}
          {postsQuery.isError ? <div className="mt-4"><Alert message={extractErrorMessage(postsQuery.error)} /></div> : null}
          {!postsQuery.isLoading && postsQuery.data?.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="Chưa có bài viết nào trong nhóm" description="Hãy chia sẻ khoảnh khắc đầu tiên." />
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4">
            {postsQuery.data?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                canDelete={group.isOwner}
                onToggleLike={() => likeMutation.mutate(post.id)}
                onToggleSave={() => saveMutation.mutate(post.id)}
                onDelete={() => {
                  if (window.confirm("Xoá bài viết này?")) deleteMutation.mutate(post.id);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
