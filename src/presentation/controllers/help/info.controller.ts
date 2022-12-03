import { I18nService } from "@app/services/i18n.service";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { InfoRoutes } from "./info.shared";

@container.ProvideClass()
export class InfoController extends BotController {
  @container.InjectGetter(I18nService)
  private readonly i18n!: I18nService;

  @Handle([AutoSkipCondition(), UseRouteCondition(InfoRoutes.Info)])
  async info(context: ExtendedMessageContext) {
    const supportsInlineKeyboard = context.supportsInlineKeyboard();
    const locale = await this.i18n.getLocale(context.lang());

    await context.reply(locale.info || "Блок информации не заполнен", {
      keyboard: autoKeyboard({ inline: supportsInlineKeyboard })
    });
  }
}
