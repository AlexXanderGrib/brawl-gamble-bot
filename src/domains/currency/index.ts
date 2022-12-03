import { Currency } from "@xxhax/bablo";
import { emoji } from "@xxhax/emoji";

class RussianCurrency extends Currency {
  public static readonly locales = ["ru"];
}

export class GameCurrency extends RussianCurrency {
  public static readonly sign = emoji.dollar;
}

export class RealCurrency extends RussianCurrency {
  public static readonly sign = "₽";
  // eslint-disable-next-line class-methods-use-this
  get sign() {
    return "RUB";
  }
}

export class DiamondCurrency extends RussianCurrency {
  public static readonly sign = emoji.gem;
}

export class XPCurrency extends RussianCurrency {
  public static readonly sign = emoji.nazar_amulet;
}

export class PercentCurrency extends RussianCurrency {
  public static readonly sign = "%";
}

export class CurrencyCourse {
  constructor(
    public readonly code: string,
    public readonly id: string,
    public readonly course: number,
    public readonly amount: number = 1
  ) {}

  /**
   *
   * @param {number} amount In foreign currency
   * @return {number} Needs to be rounded
   */
  convertToRub(amount: number) {
    return (amount * this.course) / this.amount;
  }
}
