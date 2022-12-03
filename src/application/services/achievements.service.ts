import { Achievement } from "@domains/achievements";
import type { UserEntity } from "@domains/users";
import { round } from "@xxhax/safe-math";
import { Config, container } from "src/config";

@container.ProvideClass()
export class AchievementsService {
  @container.InjectGetter(Config)
  private readonly config!: Config;

  public readonly multiplier = 1;

  public get(user: UserEntity) {
    const unlocked = new Set(user.achievements);

    return this.localAchievements.map(ach => {
      const instance = ach.clone();
      instance.isUnlocked = unlocked.has(instance.id);

      return instance;
    });
  }

  public set(user: UserEntity, mapped: Achievement[]) {
    user.achievements = mapped.filter(ach => ach.isUnlocked).map(ach => ach.id);
  }

  public reset(user: UserEntity) {
    const mapped = this.get(user);
    this.set(user, []);
    return mapped;
  }

  public unlock(user: UserEntity, achievementId: string) {
    if (user.achievements.includes(achievementId)) return;

    user.achievements.push(achievementId);

    return this.localAchievements.find(
      achievement => achievement.id === achievementId
    );
  }

  public lock(user: UserEntity, achievementId: string) {
    user.achievements = user.achievements.filter(id => id !== achievementId);
  }

  private _localAchievementsCache: Achievement[] = [];

  get localAchievements() {
    const achievementsConfig = this.config.aspects?.achievements;
    if (!achievementsConfig) return [];

    if (
      this._localAchievementsCache.length ===
      Object.keys(achievementsConfig).length
    ) {
      return this._localAchievementsCache;
    }

    const achievements = Object.entries(achievementsConfig).map(
      ([id, data]: [string, any]) =>
        new Achievement({
          id,
          ...data,
          reward: round(data.reward * this.multiplier, 0)
        })
    );

    this._localAchievementsCache = achievements;

    return achievements;
  }
}
