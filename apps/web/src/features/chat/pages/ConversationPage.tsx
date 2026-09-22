import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessageDto } from "@petcare/types";
import { chatApi } from "../api/chat.api";
import { useAuthStore } from "../../auth/store";
import { getSocket } from "../../../shared/realtime/socket";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { LoadingState } from "../../../shared/components/LoadingState";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);

  const conversationsQuery = useQuery({ queryKey: ["conversations"], queryFn: chatApi.listConversations });
  const conversation = conversationsQuery.data?.find((c) => c.id === id);

  const messagesQuery = useQuery({
    queryKey: ["conversations", id, "messages"],
    queryFn: () => chatApi.getMessages(id!),
  });

  // "message:new" fires the instant either side sends (see
  // ChatService.sendMessage) — only react to it for the thread that's
  // actually open right now.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewMessage = (message: MessageDto) => {
      if (message.conversationId === id) {
        queryClient.invalidateQueries({ queryKey: ["conversations", id, "messages"] });
      }
    };
    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [id, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (input: { message?: string; mediaUrl?: string }) => chatApi.sendMessage(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setContent("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messagesQuery.data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (content.trim().length > 0) {
      sendMutation.mutate({ message: content.trim() });
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await chatApi.uploadImage(file);
      sendMutation.mutate({ mediaUrl: url });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px-6rem)] max-w-xl flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-3 border-b border-brand-100 pb-3">
        <Link to="/messages" className="text-brand-700 hover:underline">
          ←
        </Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-base">
          {conversation?.otherUserAvatar ? (
            <img src={conversation.otherUserAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            "🙂"
          )}
        </div>
        <p className="font-semibold text-brand-900">{conversation?.otherUserName ?? "..."}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messagesQuery.isLoading ? <LoadingState /> : null}
        {messagesQuery.isError ? <Alert message={extractErrorMessage(messagesQuery.error)} /> : null}

        <div className="flex flex-col gap-2">
          {messagesQuery.data?.map((message) => {
            const isMine = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine ? "bg-brand-700 text-white" : "bg-white text-brand-900 shadow-sm"
                  }`}
                >
                  {message.messageType === "image" && message.mediaUrl ? (
                    <img src={message.mediaUrl} alt="" className="max-w-full rounded-xl" />
                  ) : null}
                  {message.message ? <p className="whitespace-pre-wrap">{message.message}</p> : null}
                  <p className={`mt-1 text-right text-xs ${isMine ? "text-white/70" : "text-brand-700/60"}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {sendMutation.isError ? (
        <div className="mt-2">
          <Alert message={extractErrorMessage(sendMutation.error)} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <label className="shrink-0 cursor-pointer text-xl">
          {uploading ? "⏳" : "📷"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
        <input
          type="text"
          placeholder="Nhắn tin..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={content.trim().length === 0 || sendMutation.isPending}
          className="shrink-0 rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
