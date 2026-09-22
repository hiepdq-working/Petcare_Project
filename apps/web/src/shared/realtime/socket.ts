import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "../api/token-store";

// The API's public origin without the /api prefix — Socket.IO connects at
// the server root, REST calls go through /api (see shared/api/client.ts).
const SOCKET_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

let socket: Socket | null = null;

// `auth` as a function (not a plain object) is re-evaluated on every
// (re)connect attempt, so a token refreshed by the axios interceptor
// after this module loaded is still picked up automatically on reconnect.
export function connectSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (callback) => callback({ token: getAccessToken() }),
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function getSocket(): Socket | null {
  return socket;
}
