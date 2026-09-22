import { Logger } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer, type OnGatewayConnection, type OnGatewayDisconnect } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";
import type { AccessTokenPayload } from "../../common/security/jwt-payload";
import { env } from "../../config/env";

// The push half of every "MVP polling, ready to upgrade" feature built
// earlier (NotificationBell, chat) — a per-user room (`user:<id>`) that
// any service can emit into via emitToUser(), without that service
// knowing anything about sockets. Auth mirrors JwtAuthGuard exactly (same
// JwtService, same secret) but runs once at connection time instead of
// per-request, since a socket has no per-message Authorization header.
@WebSocketGateway({ cors: { origin: env.webOrigin, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
