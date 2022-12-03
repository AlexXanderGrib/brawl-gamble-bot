import { AccountsGenService } from "@app/services/accounts-gen.service";
import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { CasesService } from "@app/services/cases.service";
import { ConfigService } from "@app/services/config.service";
import { RankNotificationService } from "@app/services/rank-notification.service";
import { DiamondCurrency, GameCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { Balance } from "@xxhax/bablo";
import { emoji } from "@xxhax/emoji";
import { chunk } from "@xxhax/lists";
import { createTMatcher } from "@xxhax/match";
import { random } from "@xxhax/safe-math";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import { ReplenishmentsReplenishButton } from "../balance/replenishments.shared";
import {
  CaseOpenButton,
  CasesListButton,
  CasesRoutes,
  CaseViewButton
} from "./cases.shared";

@container.ProvideClass()
export class CasesController extends BotController {
  @container.InjectGetter(CasesService)
  private readonly casesService!: CasesService;

  @container.InjectGetter(AccountsGenService)
  private readonly ags!: AccountsGenService;

  @container.InjectGetter(ConfigService)
  private readonly config!: ConfigService;

  @container.InjectGetter(AchievementNotificationService)
  private readonly ans!: AchievementNotificationService;

  @container.InjectGetter(RankNotificationService)
  private readonly rankService!: RankNotificationService;

  @Handle([AutoSkipCondition(), UseRouteCondition(CasesRoutes.List)])
  async listCases(context: ExtendedMessageContext) {
    context.currentActivity = "cases";
    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    const casesData = this.casesService.present(
      this.config.isPermitted(context.clientId())
    );

    const keyboard = Keyboard.keyboard(
      chunk(casesData, 2).map(cs =>
        cs.map(([id, label]) => CaseViewButton({ id, label }))
      )
    );

    await context.reply(`Вот список доступных кейсов:`, {
      keyboard: autoKeyboard({ keyboard, inline: supportsInlineKeyboard })
    });
  }
  @Handle([AutoSkipCondition(), UseRouteCondition(CasesRoutes.View)])
  async viewCase(context: ExtendedMessageContext) {
    const id = context.messagePayload?.id;
    const maybeCase = this.casesService.get(id);

    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    if (maybeCase.isNone()) {
      await context.reply(`Такого кейса у нас нет.`, {
        keyboard: autoKeyboard({ inline: supportsInlineKeyboard })
      });
      return;
    }

    const currentCase = maybeCase.value;

    const text = currentCase.mappedDrop
      .map((drop, idx) => `${idx + 1}) ${drop}`)
      .join("\n");

    const price = String(
      new Balance(currentCase.price).withCurrency(
        currentCase.isPriceGems ? DiamondCurrency : GameCurrency
      )
    );

    await context.send(
      `${currentCase.fullName}:
${emoji.moneybag} Стоимость: ${price}

${emoji.tada} С кейса может выпасть:
${text}
      `,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([
            [CaseOpenButton({ id, price })],
            [CasesListButton({ color: Keyboard.SECONDARY_COLOR })]
          ]),
          inline: false
        })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(CasesRoutes.Open)])
  async openCase(context: ExtendedMessageContext) {
    const user = await context.user(true);
    const { deposit_balance, game_balance, diamond_balance } = user;
    const id = context.messagePayload?.id;
    const currentCase = this.casesService.get(id).value;

    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    if (
      !currentCase ||
      (currentCase.hidden && !this.config.isPermitted(context.clientId()))
    ) {
      await context.reply(`Такого кейса у нас нет.`, {
        keyboard: autoKeyboard({ inline: supportsInlineKeyboard })
      });
      return;
    }

    const { price, isPriceGems } = currentCase;

    const primaryBalance = isPriceGems ? diamond_balance : game_balance;

    if (!primaryBalance.isAffordable(price)) {
      const diff = -primaryBalance.afterTransaction(-price).value;

      const keyboard = Keyboard.keyboard([
        [
          ReplenishmentsReplenishButton({ amount: price, showActionName: true })
        ],

        [CasesListButton({ color: Keyboard.SECONDARY_COLOR })]
      ]);

      await context.reply(
        `${
          emoji.robot_face
        } Извини чувак, у тебя недостаточно денег на балансе (нехватает ${primaryBalance.map(
          () => diff
        )}) чтобы открыть этот кейс. Пожалуйста пополни баланс`,
        { keyboard: autoKeyboard({ keyboard, inline: supportsInlineKeyboard }) }
      );

      return;
    }

    await context.send(`${emoji.slot_machine} Рулетка крутится!`);
    await context.setActivity();

    try {
      const points = Math.min(price / 10, 2);

      const rankPointAmount = await this.rankService.addPointsAndNotify(
        user,
        points,
        points + 3
      );
      primaryBalance.subtract(price);

      let winString = "";

      const win = currentCase.open();
      const data = win.raw;

      switch (data.type) {
        case "account": {
          const { email, password } = await this.ags.generateOne();

          winString = `${win.toString()}:
${emoji.email} Email: ${email}
${emoji.lock} Пароль: ${password}`;
          break;
        }

        case "money": {
          const amount = random(data.min, data.max, 2);
          const balanceName = data.balance ?? "game";

          const balance = createTMatcher({
            game: game_balance,
            real: deposit_balance,
            special: diamond_balance
          })(balanceName);

          balance.add(amount);

          winString = `${emoji.money_with_wings} Деньги: ${balance.map(
            () => amount
          )}`;

          break;
        }

        case "text": {
          winString = `${data.description}:\n${data.text}`;
          break;
        }
      }

      await context.reply(
        `${emoji.money_mouth_face} Из кейса "${currentCase.fullName}" тебе выпало:

${winString}

${emoji.star} Получено опыта: ${rankPointAmount}
${emoji.moneybag} Баланс: ${primaryBalance}`,
        {
          keyboard: autoKeyboard({
            keyboard: Keyboard.keyboard([
              [
                CaseOpenButton({
                  id,
                  price: primaryBalance.map(() => price).toString(),
                  label: "Открыть ещё раз"
                })
              ],
              [CasesListButton()]
            ]),

            inline: false
          })
        }
      );

      await this.ans.conditionallyUnlockAndNotify(user, {
        cases_100: primaryBalance.value >= 100
      });
    } catch (error) {
      await context.reply(
        `${emoji.octagonal_sign} Не удалось открыть кейс. Пожалуйста, попробуй позже.
        
Для администраторов: ${error.stack}`,
        { inline: supportsInlineKeyboard }
      );
    }
  }
}
