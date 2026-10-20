import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "./socket";

// Server pushes "notification:new", "message:new" and "conversation:updated"
// to this user's room — just invalidate the caches and let React Query
// refetch (same approach as apps/web, no polling).
export function RealtimeSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNotification = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    const onMessage = () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    };
    socket.on("notification:new", onNotification);
    socket.on("message:new", onMessage);
    socket.on("conversation:updated", onMessage);
    return () => {
      socket.off("notification:new", onNotification);
      socket.off("message:new", onMessage);
      socket.off("conversation:updated", onMessage);
    };
  }, [queryClient]);
  return null;
}
