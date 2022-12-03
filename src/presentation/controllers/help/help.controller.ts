import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import { HelpRoutes } from "./help.shared";
import { InfoInfoButton, InfoRoutes } from "./info.shared";
import { SupportMenuButton, SupportRoutes } from "./support.shared";

@container.ProvideClass()
export class HelpController extends BotController {
  @Handle([AutoSkipCondition(), UseRouteCondition(HelpRoutes.Help)])
  async menu(context: ExtendedMessageContext) {
    await context.reply(
      ` Чем могу вам помочь?
    
${SupportRoutes.Menu}
${InfoRoutes.Info}`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([
            [SupportMenuButton()],
            [InfoInfoButton()]
          ])
        })
      }
    );
  }
}
