import { ReplenishmentsService } from "@app/services/replenishments.service";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { VKPayTransactionContext } from "vk-io";

@container.ProvideClass()
export class VKPayController extends BotController<VKPayTransactionContext> {
  @container.InjectGetter(ReplenishmentsService)
  private readonly replenishments!: ReplenishmentsService;

  @Handle([() => true])
  async handleVKPay(context: VKPayTransactionContext) {
    const amount = context.amount / 100;
    await this.replenishments.add({
      amount,
      id: `${context.fromId}-${context.createdAt}`,
      type: "vkpay",
      user_id: context.fromId
    });
  }
}
