import { Item } from "./item.class";

export class CountedItem extends Item {
  constructor(item: Item, public count: number) {
    super(item.id, item.name);
  }

  toString() {
    return `${this.name} x ${this.count}`;
  }
}
