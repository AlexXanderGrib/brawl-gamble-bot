import { DiamondCurrency, GameCurrency, RealCurrency } from "@domains/currency";
import { AbstractDrop } from "../abstract-drop.class";

export class MoneyDrop extends AbstractDrop<"money"> {
  private readonly map = {
    game: GameCurrency.sign,
    real: RealCurrency.sign,
    special: DiamondCurrency.sign
  };

  toString() {
    const { min, max, balance = "game" } = this.raw;

    return `${min}-${max} ${this.map[balance]}`;
  }
}
