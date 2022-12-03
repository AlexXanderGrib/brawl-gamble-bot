import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { RankService } from "@app/services/rank.service";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import {
  AchievementsMenuButton,
  AchievementsRoutes
} from "./achievements.shared";
import { CasesListButton, CasesRoutes } from "./cases.shared";
import { GamesRoutes } from "./games.shared";
import { GuessMenuButton, GuessRoutes } from "./guess.shared";
import { InvestingMenuButton, InvestingRoutes } from "./investing.shared";
import { TopRoutes, TopTopButton } from "./top.shared";
import { WorkMenuButton, WorkRoutes } from "./work.shared";

@container.ProvideClass()
export class GamesController extends BotController {
  @container.InjectGetter(RankService)
  private readonly rankService!: RankService;

  @container.InjectGetter(AchievementNotificationService)
  private readonly ans!: AchievementNotificationService;

  @Handle([AutoSkipCondition(), UseRouteCondition(GamesRoutes.Menu)])
  async menu(context: ExtendedMessageContext) {
    const user = await context.user(false);

    const {
      next: nextRank,
      current: currentRank
    } = this.rankService.getCurrentRankRange(user.rank_points);

    await context.reply(
      `${emoji.video_game} Игровое Меню:
      
${emoji.star} Ваш Уровень: ${emoji.eagle} ${currentRank.rank} (${
        user.rank_points
      })
${emoji.up} До следующего уровня (${
        nextRank.rank
      }) осталось ${user.rank_points.map(v => nextRank.points - v)}
    
${AchievementsRoutes.Menu}
${TopRoutes.Top}

${CasesRoutes.List}
${WorkRoutes.Menu}
${InvestingRoutes.Menu}
${GuessRoutes.Menu}`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([
            [CasesListButton({ color: Keyboard.POSITIVE_COLOR })],
            [WorkMenuButton({ color: Keyboard.POSITIVE_COLOR })],
            [InvestingMenuButton({ color: Keyboard.POSITIVE_COLOR })],
            [GuessMenuButton({ color: Keyboard.POSITIVE_COLOR })],
            [TopTopButton(), AchievementsMenuButton()]
          ])
        })
      }
    );

    if (currentRank.rank >= 100) {
      const user = await context.user(true);
      await this.ans.unlockAndNotify(user, "dungeon_master");
    }
  }
}
