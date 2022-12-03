import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { GroupMemberContext } from "vk-io";

@container.ProvideClass()
export class MembersController extends BotController {
  @container.InjectGetter(AchievementNotificationService)
  private ans!: AchievementNotificationService;

  @Handle<GroupMemberContext>([ctx => ctx.isJoin])
  async onJoin(context: GroupMemberContext, next: CallableFunction) {
    console.log(`https://vk.com/id${context.userId} is subscribed to group`);
    await this.ans.fetchUnlockAndNotify(context.userId, "subscriber");
    return next();
  }
}
