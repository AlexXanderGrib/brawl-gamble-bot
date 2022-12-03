import type { IWorkService } from "@app/interfaces/work.service.interface";
import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { RankNotificationService } from "@app/services/rank-notification.service";
import { WorkService } from "@app/services/work.service";
import { DiamondCurrency, GameCurrency } from "@domains/currency";
import type { UserEntity } from "@domains/users";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { chunk } from "@xxhax/lists";
import { random, round } from "@xxhax/safe-math";
import { sleep } from "@xxhax/time";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { IKeyboardProxyButton, Keyboard } from "vk-io";
import {
  WorkEndButton,
  WorkHowToButton,
  WorkMineButton,
  WorkRoutes,
  WorkTrapButton
} from "./work.shared";

@container.ProvideClass()
export class WorkController extends BotController {
  @container.InjectGetter(RankNotificationService)
  private readonly rankService!: RankNotificationService;

  @container.InjectGetter(WorkService)
  private readonly workService!: IWorkService;

  @container.InjectGetter(AchievementNotificationService)
  private readonly ans!: AchievementNotificationService;

  @Handle([AutoSkipCondition(), UseRouteCondition(WorkRoutes.Menu)])
  async work(context: ExtendedMessageContext) {
    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    await context.send(
      `${emoji.hammer_and_pick} Добро пожаловать на работу!
      
У тебя есть кирка, пора копать!`,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([
            [WorkMineButton({ label: `Копать` })],
            [WorkHowToButton()]
          ]),
          inline: supportsInlineKeyboard
        })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(WorkRoutes.Work)])
  async mine(context: ExtendedMessageContext) {
    context.currentActivity = "work";
    const size = 16;
    const type: "mine" | "trap" = context.messagePayload?.type ?? "work";
    const userId = context.clientId();

    const buttons: IKeyboardProxyButton[] = new Array(size)
      .fill(null)
      .map(() => WorkTrapButton());

    const time = random(1000, 3000);

    const { amount, total } = await (type === "mine"
      ? this.workService.mine(userId)
      : this.workService.trap(userId));

    buttons[random(0, size - 1)] = WorkMineButton();

    const keyboard = Keyboard.keyboard([
      ...chunk(buttons, 4),
      [WorkEndButton()]
    ]).oneTime();

    await context.send(
      `${emoji.pick} Копание займёт ${round(time / 1000, 1)} сек.`
    );

    await sleep(time);

    await context.send(
      `${emoji.white_check_mark} Вскопано! +${new GameCurrency(
        amount
      )} (Всего заработано ${new GameCurrency(total)})`,
      {
        keyboard
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(WorkRoutes.End)])
  async end(context: ExtendedMessageContext) {
    const user = await context.user(true);

    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    await context.send(`Очищаю клавиатуру!`, {
      keyboard: Keyboard.builder().oneTime()
    });

    const result = await this.workService.saveProgress(user);
    const points = await this.rankService.addPointsAndNotify(
      user,
      Math.abs(result) / 11,
      Math.abs(result) / 6
    );

    await context.reply(
      `${emoji.white_check_mark} Закончено!
    
${emoji.moneybag} По итогам, вы заработали: ${new GameCurrency(result)}
${emoji.star} Получено очков: ${points}

${emoji.bank} Деньги положены на игровой счёт`,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([
            WorkMineButton({ label: "Продолжить" })
          ]),
          inline: supportsInlineKeyboard
        })
      }
    );

    await this._unlockAchievements(result, user);
  }

  private async _unlockAchievements(receivedAmount: number, user: UserEntity) {
    await this.ans.conditionallyUnlockAndNotify(user, {
      hard_work: receivedAmount > 100,
      digger_online: receivedAmount > 1000
    });
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(WorkRoutes.HowTo)])
  async howTo(context: ExtendedMessageContext) {
    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    await context.reply(
      ` Правила игры ${emoji["8ball"]}
    
1) ${emoji.pick} Нажимаешь на кнопку "Копать"
2) ${emoji.keyboard} У тебя под полем ввода сообщения появляется клавиатура
3) ${
        emoji.b
      } Надо нажимать на кнопку "Копать", при этом избегая красных кнопок. Если нажать на красную кнопку, то у тебя спишется ${new GameCurrency(
        20
      )}, потому что это была бомба

4) ${
        emoji.moneybag
      } Когда закончишь, надо нажать серую кнопку "Закончить", и заработанные деньги появятся на игровом счету

*) ${emoji.star} С шансом 1 к 10000 раскопок, выпадает ${DiamondCurrency.sign}`,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([WorkMineButton({ label: "Играть" })]),
          inline: supportsInlineKeyboard
        })
      }
    );
  }
}
