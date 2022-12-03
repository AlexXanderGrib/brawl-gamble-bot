import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { MessageSubscriptionContext } from "vk-io";

@container.ProvideClass()
export class MessagesStateController extends BotController<MessageSubscriptionContext> {
  @container.InjectGetter(AchievementNotificationService)
  private ans!: AchievementNotificationService;

  @Handle<MessageSubscriptionContext>([ctx => ctx.is(["message_allow"])])
  async onSub(context: MessageSubscriptionContext) {
    await this.ans.fetchUnlockAndNotify(context.userId, "subscriber");
  }
}
