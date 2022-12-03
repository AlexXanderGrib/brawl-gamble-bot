import { CacheService } from "@app/services/cache.service";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { Config, container, GroupID } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { IKeyboardProxyButton, Keyboard } from "vk-io";

@container.ProvideClass()
export class SuggestsController extends BotController {
  @container.InjectGetter(Config)
  private readonly config!: Config;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(CacheService)
  private readonly cacheService!: CacheService;

  @Handle([AutoSkipCondition({ outgoing: true, fromGroups: true })])
  async suggest(context: ExtendedMessageContext, next: CallableFunction) {
    const text = context.normalizedText();

    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    for (const suggestion of this.config.aspects?.suggests ?? []) {
      if (suggestion.keywords.some((kw: string) => text.includes(kw))) {
        await context.reply(`Возможно ты имел ввиду "${suggestion.object}"?`, {
          keyboard: Keyboard.keyboard([
            suggestion.button as IKeyboardProxyButton
          ])
            .inline(supportsInlineKeyboard)
            .oneTime(!supportsInlineKeyboard)
        });

        return;
      }
    }

    const isDialog = await this.cacheService
      .forUser(context.clientId())
      .get("is_dialog");

    if (!isDialog) {
      await context.reply(
        `${emoji.warning} Неизвестная команда "${text}". Пиши "меню" чтобы открыть меню`,
        {
          keyboard: autoKeyboard({ inline: supportsInlineKeyboard }),
          content_source: JSON.stringify({
            type: "message",
            peer_id: context.peerId,
            owner_id: -this.groupId,
            conversation_message_id: context.conversationMessageId
          })
        }
      );

      return;
    }

    return next();
  }
}
