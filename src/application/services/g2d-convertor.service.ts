import { DiamondCurrency, GameCurrency } from "@domains/currency";
import type { UserEntity } from "@domains/users";
import { container } from "src/config";
import { CommissionService } from "./commission.service";

@container.ProvideClass()
export class G2DConvertorService {
  public readonly course = {
    game: 10000,
    diamonds: 1
  } as const;

  @container.InjectGetter(CommissionService)
  private readonly commissionService!: CommissionService;

  private _getTax(amount: number) {
    return Math.floor(this.commissionService.getCurrencyConversionTax(amount));
  }

  public getPossibleConversionsCount(gameBalance: number) {
    const multiplier = Math.floor(gameBalance / this.course.game);
    const input = multiplier * this.course.game;
    const output = multiplier * this.course.diamonds;
    const tax = this._getTax(output);
    const toReceive = output - tax;

    return { multiplier, input, output, toReceive, tax };
  }

  public convert(user: UserEntity, count = 1) {
    const gameBalance = user.game_balance.value;

    const possible = this.getPossibleConversionsCount(gameBalance);

    if (possible.multiplier > count) {
      throw new Error(
        `Для обмена ${new GameCurrency(
          possible.input
        )} на ${new DiamondCurrency(
          possible.toReceive
        )} (${count}x) нехватает ${new GameCurrency(
          gameBalance - possible.input
        )}`
      );
    }

    user.game_balance.subtract(possible.input);
    user.diamond_balance.add(possible.toReceive);

    return possible;
  }
}
