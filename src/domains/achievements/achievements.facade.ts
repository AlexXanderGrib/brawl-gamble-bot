import type { Cloneable } from "@domains/shared/cloneable.interface";
import type { Facade } from "@domains/shared/facade.interface";
import type { Identifiable } from "@domains/shared/identifiable.interface";
import type { AchievementDTO } from "./achievement.dto";

export class Achievement
  implements
    Facade<AchievementDTO>,
    Cloneable<Achievement>,
    Identifiable<string>,
    AchievementDTO {
  public isUnlocked = false;

  readonly id!: string;
  readonly name!: string;
  readonly emoji!: string;
  readonly reward!: number;
  readonly description!: string;

  constructor(public readonly raw: AchievementDTO) {
    Object.assign(this, raw);
  }

  public get fullName() {
    return this.raw.emoji + " " + this.raw.name;
  }

  public unlock() {
    this.isUnlocked = true;
  }

  public lock() {
    this.isUnlocked = false;
  }

  public clone() {
    const achievement = new Achievement({ ...this.raw });

    achievement.isUnlocked = this.isUnlocked;

    return achievement;
  }
}
