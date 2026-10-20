import { Module } from "@nestjs/common";
import { GroupController } from "./group.controller";
import { GroupService } from "./group.service";
import { GroupRepository } from "./group.repository";

@Module({
  controllers: [GroupController],
  providers: [GroupService, GroupRepository],
  // PostModule checks membership/ownership when posting in or moderating a group.
  exports: [GroupRepository],
})
export class GroupModule {}
