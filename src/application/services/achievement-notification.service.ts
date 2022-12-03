import { Notification } from "@domains/notifications";
import type { UserEntity } from "@domains/users";
import { emoji } from "@xxhax/emoji";
import { container } from "src/config";
import { AchievementsService } from "./achievements.service";
import { NotificationService } from "./notifications.service";
import { RankService } from "./rank.service";
import { UsersRepository } from "./repositories/users.repo";

@container.ProvideClass()
export class AchievementNotificationService {
  @container.InjectGetter(AchievementsService)
  private readonly as!: AchievementsService;

  @container.InjectGetter(NotificationService)
  private readonly ns!: NotificationService;

  @container.InjectGetter(UsersRepository)
  private readonly userRepo!: UsersRepository;

  @container.InjectGetter(RankService)
  private readonly rankService!: RankService;

  async conditionallyUnlockAndNotify(
    user: UserEntity,
    achievementsMap: Record<string, boolean>
  ) {
    const achievements = Object.keys(achievementsMap).filter(
      key => achievementsMap[key]
    );

    if (achievements.length > 0) {
      await this.unlockAndNotify(user, ...achievements);
    }
  }

  async unlockAndNotify(user: UserEntity, ...achievementIds: string[]) {
    for (const achievementId of achievementIds) {
      const achievement = this.as.unlock(user, achievementId);

      if (!achievement) return;

      user.diamond_balance.add(achievement.reward);

      const points = this.rankService.addPoints(
        user,
        Math.max(achievement.reward - 1, 3),
        achievement.reward * 2
      );

      await this.ns.deliver(
        new Notification(
          `${emoji.white_check_mark} Достижение "${achievement.fullName}" разблокировано!
          
Вам начислено ${points} очк.`,
          [user.user_id]
        )
      );
    }
  }

  async fetchUnlockAndNotify(userId: number, ...achievementIds: string[]) {
    const user = await this.userRepo.getUser(userId);

    await this.unlockAndNotify(user, ...achievementIds);

    await this.userRepo.updateUser(user);
  }
}
