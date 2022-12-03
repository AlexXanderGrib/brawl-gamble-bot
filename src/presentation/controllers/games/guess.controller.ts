import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { chunk } from "@xxhax/lists";
import { createMatcher } from "@xxhax/match";
import { round, sum } from "@xxhax/safe-math";
import { createHash } from "crypto";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import { GamesMenuButton } from "./games.shared";
import { GuessGuessButton, GuessPlayButton, GuessRoutes } from "./guess.shared";

const [min, max] = [2, 30];
const maxCoefficient = 10;

@container.ProvideClass()
export class GuessController extends BotController {
  @Handle([AutoSkipCondition(), UseRouteCondition(GuessRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    await context.reply(
      ` Угадайка
  
${emoji.one} Нажимаете "Играть"
${emoji.two} Пишете шанс и ставку, бот отвечает коэффициентом и клавиатурой где кол-во кнопок = шансу. 
${emoji.three} Если вы угадаете кнопку, то получите свои деньги назад умноженные на коэфф, иначе проиграете ставку`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([
            [GuessPlayButton()],
            [GamesMenuButton()]
          ])
        })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(GuessRoutes.Play)])
  async play(context: ExtendedMessageContext) {
    context.currentActivity = "guess:setup";
    await context.reply(`Введите коэффициент (от ${min} до ${max}) и сумму ставки в формате:

<коэфф> <ставка>`);
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(GuessRoutes.Setup)])
  async setup(context: ExtendedMessageContext) {
    context.currentActivity = "";
    const [coefficientText, amountText] = context.normalizedText().split(" ");
    const user = await context.user(true);

    const coefficient = parseInt(coefficientText ?? "", 10);
    const amount = parseInt(amountText ?? "", 10);

    const keyboard = autoKeyboard({
      inline: context.supportsInlineKeyboard(),
      keyboard: Keyboard.keyboard([[GuessPlayButton()], [GamesMenuButton()]])
    });

    if (!coefficient || coefficient < min || coefficient > max) {
      await context.reply(
        `${emoji.stop_sign} Коэффициент должен быть целым числом от ${min} до ${max}`,
        { keyboard }
      );

      return;
    }

    if (!amount || amount < 1 || amount > user.game_balance.value) {
      await context.reply(
        `${emoji.stop_sign} Ставка должен быть целым числом от 1 до ${user.game_balance} (вашего баланса)`,
        { keyboard }
      );

      return;
    }

    const mx = ((coefficient - min + 1) * maxCoefficient) / (max - min) + 1;

    const win = round(amount * mx, 2);

    user.game_balance.subtract(amount);
    user.data.guessGame = { amount, coefficient, win };

    const buttons = chunk(
      new Array(coefficient).fill(0).map(() => GuessGuessButton()),
      5
    );

    await context.reply(
      ` Если отгадаете вы получите: ${user.game_balance.map(() => win)}`,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([...buttons, [GamesMenuButton()]]),
          inline: false
        })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(GuessRoutes.Guess)])
  async guess(context: ExtendedMessageContext) {
    const user = await context.user(true);
    const { amount, coefficient, win } = user.data.guessGame;

    const damage =
      createMatcher<number, number>([
        [x => x > 100, -0.1],
        [x => x > 50, -0.05],
        [x => x > 40, 0],
        [x => x > 25, 0.05],
        [x => x > 0, 0.1]
      ])(amount) || 0;

    const chance = sum(1, damage) / coefficient;
    const isWin = Math.random() < chance;

    const keyboard = autoKeyboard({
      inline: context.supportsInlineKeyboard(),
      keyboard: Keyboard.keyboard([[GuessPlayButton()], [GamesMenuButton()]])
    });

    const hash = createHash("md5")
      .update(JSON.stringify({ amount, coefficient, win }))
      .digest("hex")
      .slice(0, 6);

    if (isWin) {
      user.game_balance.add(win);
      await context.reply(
        `${emoji.check_mark_button} Угадал! Получай: ${user.game_balance.map(
          () => win
        )}. Хеш игры: ${hash}`,
        { keyboard }
      );
      return;
    }

    await context.reply(
      `${emoji.cross_mark_button} Не фортануло! Хеш игры: ${hash}`,
      { keyboard }
    );
  }
}
