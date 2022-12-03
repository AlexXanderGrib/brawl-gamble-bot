import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { DiamondCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import {
  DataMiningRoutes,
  DataMiningSetLocationButton
} from "./data-mining.shared";

@container.ProvideClass()
export class DataMiningController extends BotController {
  @container.InjectGetter(AchievementNotificationService)
  private readonly ans!: AchievementNotificationService;

  @Handle([AutoSkipCondition(), UseRouteCondition(DataMiningRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    await context.reply(
      `${emoji.computer_disk} Дата-Майнинг:
    
${emoji.computer} Вы можете получить ${DiamondCurrency.sign} за то, что поделитесь с ботом некоторыми знаниями о вас, которые потом могут быть использованы(в т.ч. третьими лицами) чтобы показывать вам более точную рекламу

${emoji.money_bag} За каждое из следующих действий даются достижения или ${DiamondCurrency.sign} напрямую:`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([[DataMiningSetLocationButton()]])
        })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(DataMiningRoutes.Location)])
  async setLocation(context: ExtendedMessageContext) {
    const user = await context.user(true);

    user.data.location = context.geo;

    await Promise.all([
      context.reply(
        `${emoji.check_mark_button} ${emoji.world_map} Местоположение получено!`,
        { keyboard: autoKeyboard({ inline: context.supportsInlineKeyboard() }) }
      ),
      this.ans.unlockAndNotify(user, "local_expert")
    ]);
  }
}
