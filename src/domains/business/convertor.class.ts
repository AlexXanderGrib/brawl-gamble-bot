import { CountedItem } from "./counted-item.class";
import type { UserEditor } from "./user-editor.class";

export class ItemsConvertor {
  constructor(public readonly courses: [CountedItem, CountedItem][]) {}

  convertAll(editor: UserEditor) {
    const results: [from: CountedItem, to: CountedItem][] = [];

    for (const [from, to] of this.courses) {
      const stock = editor.count(from);

      if (stock.count > from.count) {
        const x = Math.trunc(stock.count / from.count);
        const removed = new CountedItem(from, from.count * x);
        const added = new CountedItem(to, to.count * x);

        editor.remove(removed).add(added);

        results.push([removed, added]);
      }
    }

    return results;
  }
}
