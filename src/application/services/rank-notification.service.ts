import { DiamondCurrency } from "@domains/currency";
import { Notification } from "@domains/notifications";
import type { UserEntity } from "@domains/users";
import type { IBalanceWithCurrency } from "@xxhax/bablo";
import { emoji } from "@xxhax/emoji";
import { container } from "src/config";
import { NotificationService } from "./notifications.service";
import { RankService } from "./rank.service";

@container.ProvideClass()
export class RankNotificationService {
  @container.InjectGetter(RankService)
  private readonly rankService!: RankService;

  @container.InjectGetter(NotificationService)
  private readonly ns!: NotificationService;

  public async addPointsAndNotify(user: UserEntity, min: number, max: number) {
    const before = this.rankService.getCurrentRankRange(user.rank_points);
    const amount = this.rankService.addPoints(user, min, max);
    const after = this.rankService.getCurrentRankRange(user.rank_points);

    if (
      before.next.rank <= after.current.rank ||
      user.last_recorded_rank !== after.current.rank
    ) {
      user.last_recorded_rank = after.current.rank;

      await this._notifyAboutNewRank(amount, after, user);
    }

    return amount;
  }

  private async _notifyAboutNewRank(
    amount: IBalanceWithCurrency,
    after: ReturnType<RankService["getCurrentRankRange"]>,
    user: UserEntity,
    diamondsGet = 0
  ) {
    let gotcha = amount.toString();
    if (diamondsGet) gotcha += " и " + new DiamondCurrency(diamondsGet);

    await this.ns.deliver(
      new Notification(
        `${emoji.up} Вам начислено ${gotcha}. Ваш новый уровень - ${emoji.eagle} ${after.current.rank}`,
        user.user_id
      )
    );
  }
}
