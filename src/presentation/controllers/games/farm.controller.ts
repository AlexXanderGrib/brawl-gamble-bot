import {
  Asset,
  Business,
  CountedItem,
  Item,
  ItemsConvertor,
  Seller
} from "@domains/business";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { chunk, ListFormat } from "@xxhax/lists";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import { FarmRoutes } from "./farm.shared";

const chicken = new Item("chicken", `${emoji.chicken} Курица`);
const egg = new Item("egg", `${emoji.egg} Яйцо`);
const omelet = new Item("omelet", `${emoji.cooking} Омлет`);

const sheep = new Item("sheep", `${emoji.sheep} Овца`);
const wool = new Item("wool", `${emoji.white_circle} Шерсть`);
const clothes = new Item("clothes", `${emoji.shirt} Рубашка`);

const cow = new Item("cow", `${emoji.cow} Корова`);
const milk = new Item("milk", `${emoji.milk_glass} Молоко`);
const cheese = new Item("cheese", `${emoji.cheese} Сыр`);

const c = (i: Item, c: number) => new CountedItem(i, c);

const business = new Business(
  new Item("farm", `${emoji.farmer} Ферма`),
  [
    new Asset(sheep, 5000, [c(wool, 10)]),
    new Asset(cow, 10000, [c(milk, 10)]),
    new Asset(chicken, 1500, [c(egg, 10)])
  ],

  new ItemsConvertor([
    [c(wool, 100), c(clothes, 1)],
    [c(milk, 20), c(cheese, 2)],
    [c(egg, 1), c(omelet, 1)]
  ]),
  new Seller([
    [c(cheese, 1), 80],
    [c(milk, 1), 34],
    [c(clothes, 1), 800],
    [c(omelet, 1), 60],
    [c(egg, 1), 12]
  ])
);

const formatter = new ListFormat("ru", {
  style: "long",
  type: "conjunction"
});

// TODO: Add this file to `@pres/index.ts`
@container.ProvideClass()
export class FarmController extends BotController {
  @Handle([AutoSkipCondition(), UseRouteCondition(FarmRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    const user = await context.user(false);
    context.currentActivity = "investing";
    const { profit, minsRemaining } = business.getProfitSummary(user);
    const d = minsRemaining === 0 ? "Сейчас" : `Через ${minsRemaining} мин.`;

    const message = `${emoji.farmer} Ферма:

${emoji.moneybag} Ваши владения:
${
  business.assets.join("\n") ||
  `${emoji.bank} ${emoji.sad_but_relieved_face} Нету`
}

${emoji.clock1} За время вашего отсутствия ферма произвела: ${formatter.format(
      profit.map(i => i.toString())
    )}
${emoji.timer_clock} Принесённые фермой ресурсы можно будет собрать: ${d}`;

    await context.reply(message, {
      keyboard: autoKeyboard({
        inline: context.supportsInlineKeyboard()
      })
    });
  }

  @Handle([AutoSkipCondition()])
  async invest(context: ExtendedMessageContext) {
    const data = business.assets;

    const keyboard = Keyboard.keyboard([
      // ...chunk(
      //   data.map(a =>
      //     InvestingChooseAmountButton({
      //       label: a.name,
      //       id: a.id,
      //       chooses: [1, 2, 3, 5, 8, 10, 20, 50, 100]
      //     })
      //   ),
      //   3
      // ),
      // [InvestingMenuButton()]
    ]);

    const message = `${emoji.lock} Владения:
  
${
  data
    .map(
      a =>
        `${a} ${formatter.format(a.output.map(o => o.toString()))} / час} / час`
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

  @Handle([AutoSkipCondition()])
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

  @Handle([AutoSkipCondition()])
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

  @Handle([AutoSkipCondition()])
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
