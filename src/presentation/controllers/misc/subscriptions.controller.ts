import { SubscriptionsService } from "@app/services/subscriptions.service";
import { DiamondCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { dateFormatter } from "@pres/shared/date-formatter.util";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import {
  SubscriptionsMenuButton,
  SubscriptionsRoutes,
  SubscriptionsSubscribeAdsButton,
  SubscriptionsUnsubscribeAdsButton
} from "./subscriptions.shared";

@container.ProvideClass()
export class SubscriptionsController extends BotController {
  @container.InjectGetter(SubscriptionsService)
  private readonly ss!: SubscriptionsService;

  @Handle([AutoSkipCondition(), UseRouteCondition(SubscriptionsRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    const user = await context.user(false);
    const subscriptions = this.ss.get(user);

    const adsSubscriptionDate = subscriptions.whenSubscribedTo("ads");

    const adsSubscriptionStatus = adsSubscriptionDate
      ? `${emoji.white_check_mark} Подписан(-а) с ${dateFormatter.format(
          adsSubscriptionDate
        )}`
      : `${emoji.cross_mark_button} Не подписан(-а)`;

    const keyboard = autoKeyboard({
      inline: context.supportsInlineKeyboard(),
      keyboard: Keyboard.keyboard([
        [
          adsSubscriptionDate
            ? SubscriptionsUnsubscribeAdsButton()
            : SubscriptionsSubscribeAdsButton()
        ]
      ])
    });

    await context.send(
      ` Ваши подписки и их статус:
    
Рекламная: ${adsSubscriptionStatus}

(Согласно правилам ВК мы можем присылать вам рекламу не чаще чем 1 раз в неделю, за каждую полученную рекламную рассылку вы получите ${new DiamondCurrency(
        2
      )})`,
      {
        keyboard
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(SubscriptionsRoutes.SubAds)])
  async subscribeAds(context: ExtendedMessageContext) {
    const user = await context.user(true);
    this.ss.modify(user, sub => sub.subscribe("ads"));

    const keyboard = autoKeyboard({
      inline: context.supportsInlineKeyboard(),
      keyboard: Keyboard.keyboard([[SubscriptionsMenuButton()]])
    });

    await context.send(`${emoji.check_mark_button} Подписка оформлена`, {
      keyboard
    });
  }

  @Handle([
    AutoSkipCondition(),
    UseRouteCondition(SubscriptionsRoutes.UnSubAds)
  ])
  async unsubscribeAds(context: ExtendedMessageContext) {
    const user = await context.user(true);
    this.ss.modify(user, sub => sub.unsubscribe("ads"));

    const keyboard = autoKeyboard({
      inline: context.supportsInlineKeyboard(),
      keyboard: Keyboard.keyboard([[SubscriptionsMenuButton()]])
    });

    await context.send(`${emoji.check_mark_button} Подписка оформлена`, {
      keyboard
    });
  }
}
