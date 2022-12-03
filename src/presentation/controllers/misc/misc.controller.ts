import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { ca } from "@pres/shared/conditional-add";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import { HelpHelpButton, HelpRoutes } from "../help/help.shared";
import { InfoRoutes } from "../help/info.shared";
import { SupportRoutes } from "../help/support.shared";
import { DataMiningMenuButton, DataMiningRoutes } from "./data-mining.shared";
import { MiscRoutes } from "./misc.shared";
import {
  SubscriptionsMenuButton,
  SubscriptionsRoutes
} from "./subscriptions.shared";

@container.ProvideClass()
export class MiscController extends BotController {
  @Handle([AutoSkipCondition(), UseRouteCondition(MiscRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    context.currentActivity = "settings";
    await context.reply(
      `${emoji.robot} ${emoji.gear} Доп. Настройки:
    
${SubscriptionsRoutes.Menu}
${context.enabledModules.includes("game") ? DataMiningRoutes.Menu : ""}

${HelpRoutes.Help}
└ ${SupportRoutes.Menu}
└ ${InfoRoutes.Info}`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([
            [SubscriptionsMenuButton()],

            ...ca([
              context.enabledModules.includes("game"),
              [DataMiningMenuButton()]
            ]),

            [HelpHelpButton()]
          ])
        })
      }
    );
  }
}
