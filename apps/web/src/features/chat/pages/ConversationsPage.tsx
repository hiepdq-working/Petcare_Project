import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../api/chat.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";

const POLL_INTERVAL_MS = 10_000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function ConversationsPage() {
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.listConversations,
    refetchInterval: POLL_INTERVAL_MS,
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Tin nhắn</h1>

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}
      {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
      {query.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Chưa có cuộc trò chuyện nào.
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {query.data?.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/messages/${conversation.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:opacity-80"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg">
              {conversation.otherUserAvatar ? (
                <img src={conversation.otherUserAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                "🙂"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-brand-900 ${conversation.unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
                {conversation.otherUserName}
              </p>
              <p className="truncate text-sm text-brand-700/70">
                {conversation.lastMessageType === "image" ? "📷 Đã gửi một ảnh" : (conversation.lastMessage ?? "")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {conversation.lastMessageAt ? (
                <span className="text-xs text-brand-700/60">{timeAgo(conversation.lastMessageAt)}</span>
              ) : null}
              {conversation.unreadCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-xs font-semibold text-white">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
