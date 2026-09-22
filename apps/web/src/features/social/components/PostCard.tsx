import { Link } from "react-router-dom";
import type { PostDto } from "@petcare/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

interface PostCardProps {
  post: PostDto;
  currentUserId?: string;
  onToggleLike: () => void;
  onDelete?: () => void;
  linkToDetail?: boolean;
}

export function PostCard({ post, currentUserId, onToggleLike, onDelete, linkToDetail = true }: PostCardProps) {
  const isOwn = post.userId === currentUserId;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg">
          {post.userAvatar ? <img src={post.userAvatar} alt="" className="h-full w-full object-cover" /> : "🙂"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-900">{post.userName}</p>
          <p className="text-xs text-brand-700/60">
            {formatDateTime(post.createdAt)}
            {post.petName ? (
              <>
                {" · "}
                <span className="text-brand-700/80">🐾 {post.petName}</span>
              </>
            ) : null}
          </p>
        </div>
        {isOwn && onDelete ? (
          <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Xoá
          </button>
        ) : null}
      </div>

      {post.content ? <p className="mt-3 whitespace-pre-wrap text-brand-900">{post.content}</p> : null}

      {post.media.length > 0 ? (
        <div className={`mt-3 grid gap-1.5 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.media.map((m) => (
            <img key={m.id} src={m.mediaUrl} alt="" className="aspect-square w-full rounded-xl object-cover" />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-4 text-sm text-brand-700/80">
        <button
          onClick={onToggleLike}
          className={`font-semibold hover:underline ${post.likedByMe ? "text-red-600" : ""}`}
        >
          {post.likedByMe ? "❤️" : "🤍"} {post.likeCount}
        </button>
        {linkToDetail ? (
          <Link to={`/posts/${post.id}`} className="font-semibold hover:underline">
            💬 {post.commentCount} bình luận
          </Link>
        ) : (
          <span className="font-semibold">💬 {post.commentCount} bình luận</span>
        )}
      </div>
    </div>
  );
}
