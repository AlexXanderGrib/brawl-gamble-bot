import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { AchievementsService } from "@app/services/achievements.service";
import { DiamondCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { templateReplace } from "@xxhax/strings";
import { BotController, Handle } from "src/bot";
import { container, GroupID } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { Keyboard } from "vk-io";
import { AchievementsRoutes } from "./achievements.shared";
import { GamesMenuButton } from "./games.shared";

@container.ProvideClass()
export class AchievementsController extends BotController {
  @container.InjectGetter(AchievementsService)
  private readonly achievementsService!: AchievementsService;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(AchievementNotificationService)
  private readonly ans!: AchievementNotificationService;

  @Handle([AutoSkipCondition(), UseRouteCondition(AchievementsRoutes.Menu)])
  async showAchievements(context: ExtendedMessageContext) {
    const user = await context.user(false);
    const achievements = this.achievementsService.get(user);

    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    const locked: string[] = [];
    const unlocked: string[] = [];

    achievements.forEach(achievement => {
      const description = templateReplace(achievement.description, {
        group_id: this.groupId
      });

      const { fullName, isUnlocked } = achievement;

      if (isUnlocked) {
        unlocked.push(`${fullName} - ${emoji.white_check_mark}`);
        return;
      }

      const reward = new DiamondCurrency(achievement.reward);

      locked.push(`${fullName} (${reward}) - ${description}`);
    });

    const index = (item: string, idx: number) => `${idx + 1}) ${item}`;

    const unlockedText =
      unlocked.map(index).join("\n") ||
      `${emoji.disappointed_relieved} Пока таких нету`;

    const lockedText =
      locked.map(index).join("\n") ||
      `${emoji.tada}  Вы разблокировали все достижения!`;

    const message = `${emoji.video_game} Вот ваши достижения: 
    
${emoji.white_check_mark} Разблокированы:
${unlockedText}

${emoji.lock} Заблокированы: 
${lockedText}`;

    await context.reply(message, {
      keyboard: autoKeyboard({
        inline: supportsInlineKeyboard,
        keyboard: Keyboard.keyboard([[GamesMenuButton()]])
      })
    });

    // Check only locked is prestige
    if (
      achievements.filter(a => !a.isUnlocked).map(a => a.id)[0] === "prestige"
    ) {
      const user = await context.user(true);
      await this.ans.unlockAndNotify(user, "prestige");
    }
  }
}
