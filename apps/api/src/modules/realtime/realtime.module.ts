import { Global, Module } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";

// @Global so NotificationService/ChatService (and anything future) can
// inject RealtimeGateway without importing this module explicitly —
// matches PetEventModule/NotificationModule's existing convention.
@Global()
@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
