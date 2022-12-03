import { InvestingService } from "@app/services/investing.service";
import { GameCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { chunk } from "@xxhax/lists";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import {
  InvestingBuyButton,
  InvestingChooseAmountButton,
  InvestingCollectProfitButton,
  InvestingInvestButton,
  InvestingMenuButton,
  InvestingRoutes
} from "./investing.shared";

@container.ProvideClass()
export class InvestingController extends BotController {
  @container.InjectGetter(InvestingService)
  private readonly investingService!: InvestingService;

  @Handle([AutoSkipCondition(), UseRouteCondition(InvestingRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    const user = await context.user(false);
    context.currentActivity = "investing";
    const {
      collectableProfit,
      owned,
      totalHourProfit,
      nextCollectionThreshold
    } = this.investingService.getSummary(user);
    let d: string;

    if (nextCollectionThreshold === 0) d = "Сейчас";
    else {
      const date = new Date(nextCollectionThreshold);

      d = `Через ${date.getMinutes()} мин.`;
    }

    const message = `${emoji.chart_increasing} Инвестиции:
    
В этом разделе вы можете вложится в различные бизнесы чтобы пассивно получать с них ${
      GameCurrency.sign
    }

${emoji.moneybag} Ваши активы:
${
  owned
    .map(
      a => `${a.fullName} x${a.count} - ${new GameCurrency(a.hourProfit)} / час`
    )
    .join("\n") || `${emoji.bank} ${emoji.sad_but_relieved_face} Отсутствуют`
}

${emoji.money_with_wings} Общий доход в час: ${new GameCurrency(
      totalHourProfit
    )}
${emoji.money_mouth_face} Доступный для сбора доход: ${new GameCurrency(
      collectableProfit
    )}

${emoji.timer_clock} Доходы с инвестиций можно будет собрать: ${d}

${InvestingRoutes.Invest}
${InvestingRoutes.CollectProfit}`;

    await context.reply(message, {
      keyboard: autoKeyboard({
        inline: context.supportsInlineKeyboard(),
        keyboard: Keyboard.keyboard([
          [InvestingInvestButton()],
          [InvestingCollectProfitButton()]
        ])
      })
    });
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(InvestingRoutes.Invest)])
  async invest(context: ExtendedMessageContext) {
    const data = this.investingService.getForPurchase();

    const keyboard = Keyboard.keyboard([
      ...chunk(
        data.map(a =>
          InvestingChooseAmountButton({
            label: a.fullName,
            id: a.id,
            chooses: [1, 2, 3, 5, 8, 10, 20, 50, 100]
          })
        ),
        3
      ),
      [InvestingMenuButton()]
    ]);

    const message = `${emoji.chart_increasing} Активы:
  
${
  data
    .map(
      a =>
        `${a.fullName} (${a.price}) - ${new GameCurrency(a.hourProfit)} / час`
    )
    .join("\n") ||
  `${emoji.sad_but_relieved_face} Нет доступных для покупки активов`
}

${emoji["woman-tipping-hand"]} Чтобы купить актив используй клавиатуру снизу ${
      emoji.point_down
    }`;

    await context.send(message, {
      keyboard: autoKeyboard({ keyboard, inline: false })
    });
  }

  @Handle([
    AutoSkipCondition(),
    UseRouteCondition(InvestingRoutes.ChooseAmount)
  ])
  async chooseAmount(context: ExtendedMessageContext) {
    const chooses: number[] = context.messagePayload?.chooses ?? [
      1,
      2,
      3,
      5,
      8,
      10
    ];
    const id = context.messagePayload?.id;

    await context.send(`${emoji.input_numbers} Выберите кол-во:`, {
      keyboard: autoKeyboard({
        inline: false,
        keyboard: Keyboard.keyboard([
          ...chunk(
            chooses.map(count =>
              InvestingBuyButton({ id, label: count.toString(), count })
            ),
            3
          ),
          InvestingMenuButton()
        ])
      })
    });
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(InvestingRoutes.Buy)])
  async buy(context: ExtendedMessageContext) {
    const user = await context.user(true);
    const keyboard = autoKeyboard({
      inline: context.supportsInlineKeyboard(),
      keyboard: Keyboard.keyboard([[InvestingMenuButton()]])
    });

    try {
      this.investingService.invest(
        user,
        context.messagePayload?.id,
        context.messagePayload?.count
      );
    } catch (error) {
      await context.send(`${emoji.octagonal_sign} ${error}`, { keyboard });
      return;
    }

    await context.send(`${emoji.check_mark_button} Актив куплен`, {
      keyboard
    });
  }

  @Handle([
    AutoSkipCondition(),
    UseRouteCondition(InvestingRoutes.CollectProfit)
  ])
  async collectProfit(context: ExtendedMessageContext) {
    const user = await context.user(true);
    const amount = this.investingService.collectProfit(user);

    await context.reply(
      `${emoji.check_mark_button} Собрано ${new GameCurrency(amount)}`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([[InvestingMenuButton()]])
        })
      }
    );
  }
}
