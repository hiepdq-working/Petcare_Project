import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/notifications.api";

const POLL_INTERVAL_MS = 30_000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

// Simple polling instead of real-time push/sockets — appropriate for MVP
// scale (see ARCHITECTURE.md roadmap: Redis/sockets are a later-phase
// concern once there's a reason to need instant delivery).
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: notificationsApi.list,
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = unreadQuery.data ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-brand-50"
        aria-label="Thông báo"
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-10 w-80 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          <p className="px-3 py-2 text-sm font-semibold text-brand-900">Thông báo</p>
          {listQuery.isLoading ? <p className="px-3 py-4 text-sm text-brand-700/70">Đang tải...</p> : null}
          {listQuery.data?.length === 0 ? (
            <p className="px-3 py-4 text-sm text-brand-700/70">Không có thông báo nào.</p>
          ) : null}
          <div className="max-h-96 overflow-y-auto">
            {listQuery.data?.map((notification) => (
              <button
                key={notification.id}
                onClick={() => !notification.isRead && markReadMutation.mutate(notification.id)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-brand-50 ${
                  notification.isRead ? "text-brand-700/70" : "text-brand-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{notification.title}</span>
                  {!notification.isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" /> : null}
                </div>
                {notification.content ? <p className="mt-0.5 text-xs">{notification.content}</p> : null}
                <p className="mt-1 text-xs text-brand-700/50">{timeAgo(notification.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
