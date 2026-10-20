import { AppState } from "react-native";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "../api/config";
import { refreshSession } from "../api/client";
import { getAccessToken } from "../api/token-store";

// Socket.IO lives at the API root, REST at /api.
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;
let reconnecting = false;

// The server refuses a handshake with an expired access token by simply
// disconnecting. So: get a fresh token (this also rotates the stored refresh
// token), then connect again. `auth` is a function so every (re)connect
// attempt reads the newest token.
async function reconnectWithFreshToken(): Promise<void> {
  if (reconnecting || !socket) return;
  reconnecting = true;
  try {
    const session = await refreshSession();
    if (session && socket && !socket.connected) socket.connect();
  } finally {
    reconnecting = false;
  }
}

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: (callback) => callback({ token: getAccessToken() }),
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") void reconnectWithFreshToken();
    });
    socket.on("connect_error", () => {
      setTimeout(() => void reconnectWithFreshToken(), 3000);
    });
    // Android suspends sockets in the background — reconnect on return.
    AppState.addEventListener("change", (state) => {
      if (state === "active" && socket && !socket.connected && getAccessToken()) {
        void reconnectWithFreshToken();
      }
    });
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function getSocket(): Socket | null {
  return socket;
}
