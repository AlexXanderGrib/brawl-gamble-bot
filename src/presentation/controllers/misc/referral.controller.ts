import { ReferralService } from "@app/services/referral.service";
import { DiamondCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { container, GroupID } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { ReferralRoutes } from "./referral.shared";

@container.ProvideClass()
export class ReferralController extends BotController {
  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(ReferralService)
  private readonly refService!: ReferralService;

  private _getLink(referrer: number) {
    return `vk.me/public${this.groupId}?ref=${referrer}`;
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(ReferralRoutes.Menu)])
  async info(context: ExtendedMessageContext) {
    await context.setActivity().catch(() => undefined);

    const referrer = context.clientId();
    const referrals = await this.refService.getReferrals(referrer);
    const link = this._getLink(referrer);

    await context.send(
      ` Реферальная программа:
    
${emoji.busts_in_silhouette} Приглашённые друзья(${referrals.length}): 
${
  referrals.map((userId, idx) => `${idx + 1}) @id${userId}`).join("\n") ||
  `${emoji.sad_but_relieved_face} Никого`
}

${emoji.fire} За каждого приглашенного друга вы получите ${new DiamondCurrency(
        3
      )} , а ваш друг получит приятный подарок при входе!

${
  emoji.gear
} Скопируйте текст ниже и отправьте своему другу, чтобы пригласить его в игру ${
        emoji.point_down
      }`,
      {
        keyboard: autoKeyboard({ inline: context.supportsInlineKeyboard() })
      }
    );

    await context.send(
      `${
        emoji.money_with_wings
      } Заходи в Бравл Бота по моей ссылке и получи ${new DiamondCurrency(
        5
      )} в подарок!

${emoji.point_right} ${link}`
    );
  }
}
