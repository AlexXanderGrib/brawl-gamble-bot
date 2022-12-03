import { Inventory } from "@domains/inventory";
import type { UserEntity } from "@domains/users";
import { CountedItem } from "./counted-item.class";
import type { Item } from "./item.class";

export class UserEditor {
  private readonly _inventory: Inventory;

  constructor(private readonly _businessPrefix: string, user: UserEntity) {
    this._inventory = new Inventory((user.data.inventory ??= {}));
  }

  public inventory() {
    return this._inventory
      .subsetWithFn(key => key.startsWith(this._businessPrefix + ":"))
      .renameWithFn(key => key.substring(this._businessPrefix.length + 1));
  }

  private _update(update: Inventory) {
    this._inventory.setMultiple(
      update.renameWithFn(key => `${this._businessPrefix}:${key}`).raw
    );
  }

  public count(item: Item): CountedItem {
    return new CountedItem(item, this.inventory().getCount(item.name));
  }

  public add(item: CountedItem) {
    this._update(this.inventory().add(item.id, item.count));
    return this;
  }

  public remove(item: CountedItem) {
    this._update(this.inventory().remove(item.id, item.count));
    return this;
  }
}
