import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostCommentDto } from "@petcare/types";
import { socialApi } from "../api/social.api";
import { PostCard } from "../components/PostCard";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<PostCommentDto | null>(null);

  const query = useQuery({ queryKey: ["posts", id], queryFn: () => socialApi.getOne(id!) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["posts", id] });

  const likeMutation = useMutation({ mutationFn: () => socialApi.toggleLike(id!), onSuccess: invalidate });

  const deleteMutation = useMutation({
    mutationFn: () => socialApi.remove(id!),
    onSuccess: () => navigate("/feed"),
  });

  const commentMutation = useMutation({
    mutationFn: () => socialApi.addComment(id!, { content, parentId: replyTo?.id }),
    onSuccess: () => {
      invalidate();
      setContent("");
      setReplyTo(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => socialApi.removeComment(id!, commentId),
    onSuccess: invalidate,
  });

  function handleSubmitComment(event: FormEvent) {
    event.preventDefault();
    if (content.trim().length > 0) commentMutation.mutate();
  }

  function handleDeletePost() {
    if (window.confirm("Xoá bài viết này?")) {
      deleteMutation.mutate();
    }
  }

  function handleDeleteComment(commentId: string) {
    if (window.confirm("Xoá bình luận này?")) {
      deleteCommentMutation.mutate(commentId);
    }
  }

  if (query.isLoading) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-brand-700">Đang tải...</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  const { post, comments } = query.data;
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/feed" className="text-sm text-brand-700 hover:underline">
        ← Quay lại bảng tin
      </Link>

      <div className="mt-4">
        <PostCard
          post={post}
          currentUserId={user?.id}
          onToggleLike={() => likeMutation.mutate()}
          onDelete={handleDeletePost}
          linkToDetail={false}
        />
      </div>

      <h2 className="mb-3 mt-6 text-lg font-bold text-brand-900">Bình luận</h2>

      <form onSubmit={handleSubmitComment} className="mb-4 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        {commentMutation.isError ? <Alert message={extractErrorMessage(commentMutation.error)} /> : null}
        {replyTo ? (
          <div className="flex items-center justify-between text-sm text-brand-700/70">
            <span>Đang trả lời {replyTo.userName}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-brand-700 hover:underline">
              Huỷ
            </button>
          </div>
        ) : null}
        <textarea
          rows={2}
          placeholder="Viết bình luận..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-xl border border-brand-200 px-4 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />
        <Button type="submit" loading={commentMutation.isPending} disabled={content.trim().length === 0}>
          Gửi bình luận
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {topLevel.length === 0 ? <p className="text-center text-brand-700/70">Chưa có bình luận nào.</p> : null}
        {topLevel.map((comment) => (
          <div key={comment.id} className="flex flex-col gap-2">
            <CommentRow
              comment={comment}
              isOwn={comment.userId === user?.id}
              onReply={() => setReplyTo(comment)}
              onDelete={() => handleDeleteComment(comment.id)}
            />
            {repliesOf(comment.id).length > 0 ? (
              <div className="ml-8 flex flex-col gap-2">
                {repliesOf(comment.id).map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    isOwn={reply.userId === user?.id}
                    onReply={() => setReplyTo(comment)}
                    onDelete={() => handleDeleteComment(reply.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  isOwn,
  onReply,
  onDelete,
}: {
  comment: PostCommentDto;
  isOwn: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-900">{comment.userName}</p>
          <p className="text-sm text-brand-900">{comment.content}</p>
        </div>
        {isOwn ? (
          <button onClick={onDelete} className="shrink-0 text-xs text-red-600 hover:underline">
            Xoá
          </button>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-brand-700/60">
        <span>{formatDateTime(comment.createdAt)}</span>
        <button onClick={onReply} className="font-semibold hover:underline">
          Trả lời
        </button>
      </div>
    </div>
  );
}
