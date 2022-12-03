import type { IBalance } from "@xxhax/bablo";
import { CountedItem } from "./counted-item.class";
import type { UserEditor } from "./user-editor.class";

export class Seller {
  constructor(public readonly deals: [item: CountedItem, price: number][]) {}

  sellAll<T extends IBalance>(editor: UserEditor, gameBalance: T) {
    const sold: CountedItem[] = [];
    const orig = gameBalance.map(v => v);

    for (const [item, price] of this.deals) {
      const stock = editor.count(item);

      if (stock.count > item.count) {
        const x = Math.trunc(stock.count / item.count);
        const p = price * x;

        const s = new CountedItem(item, item.count * x);
        editor.remove(s);
        gameBalance.add(p);
        sold.push(s);
      }
    }

    return { profit: gameBalance.afterTransaction(-orig.value) as T, sold };
  }
}
