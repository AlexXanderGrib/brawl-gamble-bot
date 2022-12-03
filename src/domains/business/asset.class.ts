import { GameCurrency } from "@domains/currency";
import { ListFormat } from "@xxhax/lists";
import type { CountedItem } from "./counted-item.class";
import { Item } from "./item.class";

export class Asset extends Item {
  public readonly category = "asset";

  constructor(
    tag: Item,
    public readonly price: number,
    public readonly output: CountedItem[]
  ) {
    super(tag.id, tag.name);
  }

  toString() {
    const formatter = new ListFormat("ru", {
      style: "long",
      type: "conjunction"
    });
    const output = this.output.map(o => o.toString());

    return `${this.name} (${new GameCurrency(this.price)}) - ${formatter.format(
      output
    )}`;
  }
}
