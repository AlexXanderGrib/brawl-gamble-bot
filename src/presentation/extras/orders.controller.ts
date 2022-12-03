import { CacheService } from "@app/services/cache.service";
import { CurrencyCourseService } from "@app/services/currency-course.service";
import { NotificationService } from "@app/services/notifications.service";
import { RealCurrency } from "@domains/currency";
import { Notification } from "@domains/notifications";
import { MarketConfirmPurchaseButton } from "@pres/controllers/market.shared";
import { emoji } from "@xxhax/emoji";
import { round } from "@xxhax/safe-math";
import { BotController, Handle } from "src/bot";
import { AdminDomain, BotAPI, container } from "src/config";
import { API, Keyboard, MarketOrderContext } from "vk-io";

@container.ProvideClass()
export class OrdersController extends BotController<MarketOrderContext> {
  @container.InjectGetter(BotAPI)
  private readonly api!: API;

  @container.InjectGetter(AdminDomain)
  private readonly adminDomain!: string;

  @container.InjectGetter(CacheService)
  private readonly cacheService!: CacheService;

  @container.InjectGetter(NotificationService)
  private readonly notification!: NotificationService;

  @container.InjectGetter(CurrencyCourseService)
  private readonly currencyConvertor!: CurrencyCourseService;

  @Handle<MarketOrderContext>([ctx => ctx.is(["market_order_new"])])
  async onOrder(context: MarketOrderContext) {
    const storage = this.cacheService.forUser(context.userId);
    let total = round(parseInt(context.totalPrice.amount) / 100);

    if (context.totalPrice.currency.name !== "RUB") {
      const newPrice = await this.currencyConvertor.convert(
        total,
        context.totalPrice.currency.name
      );

      if (newPrice) total = newPrice;
    }

    const [client] = await this.api.users.get({
      user_ids: context.userId.toString()
    });
    const mention = client
      ? `@id${client.id} (${client.first_name})`
      : `@id${context.userId}`;

    try {
      await storage.sync({
        current_purchase_amount: total.toFixed(2),
        current_order: JSON.stringify({
          id: context.id,
          amount: total
        })
      });
    } catch (error) {
      await this.notification.deliverToAdmins(
        new Notification(
          `У ${mention} вылезла ошибка при заказе на ${new RealCurrency(
            total
          )}: 
${error instanceof Error ? error.stack : String(error)}`,
          []
        )
      );
    }

    const userNotification = new Notification(
      `Привет ${mention}! 

${
  emoji.eye_speech_bubble
} Вижу ты сделал заказ в нашей группе. Чтобы его оплатить и получить свой акк нажми на кнопку, которая у тебя появилась вод полем ввода сообщения

${emoji.warning} Если не хочешь оплачивать через меня, напиши админу ${
        emoji.point_right
      } @${this.adminDomain}

${emoji.point_down.repeat(3)}`,
      context.userId,
      {
        keyboard: Keyboard.keyboard([
          MarketConfirmPurchaseButton({
            label: `Получить (${new RealCurrency(total)})`
          })
        ])
          .oneTime()
          .toString()
      }
    );

    const adminNotification = new Notification(
      `${emoji.dollar} ${mention} Сделал заказ в группе на ${new RealCurrency(
        total
      )} (Получатель ${context.recipient.display_text}) @all`,
      []
    );

    await Promise.all([
      this.notification.deliver(userNotification),
      this.notification.deliverToAdmins(adminNotification),
      this.api.market.editOrder({
        order_id: context.id,
        user_id: context.userId,
        status: 1,
        comment_for_user: `Администраторы оповещены о заказе`
      })
    ]);

    console.log("EVERYONE IS NOTIFIED ABOUT ORDER");
  }
}
