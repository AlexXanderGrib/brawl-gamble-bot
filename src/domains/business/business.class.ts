import type { UserEntity } from "@domains/users";
import type { Asset } from "./asset.class";
import type { ItemsConvertor } from "./convertor.class";
import { CountedItem } from "./counted-item.class";
import { Item } from "./item.class";
import type { Seller } from "./seller.class";
import { UserEditor } from "./user-editor.class";

export class Business {
  constructor(
    public readonly prefix: Item,
    public readonly assets: Asset[],
    public readonly converter: ItemsConvertor,
    public readonly seller: Seller
  ) {}

  private _getEditor(user: UserEntity) {
    return new UserEditor(this.prefix.id, user);
  }

  private _makeCollectionDate(user: UserEntity) {
    const key = `${this.prefix}_collection_date`;
    user.data[key] ??= Date.now();

    return {
      get(): number {
        return user.data[key];
      },
      set(value: Date | number = new Date()) {
        return (user.data[key] = new Date(value).getTime());
      }
    };
  }

  private get _registeredItems(): Item[] {
    return [
      ...this.assets,
      ...this.assets.flatMap(a => a.output),
      ...this.converter.courses.flatMap(c => c),
      ...this.seller.deals.flatMap(d => d[0])
    ];
  }

  public getInventory(user: UserEntity) {
    const registered = this._registeredItems;

    return this._getEditor(user)
      .inventory()
      .map(
        (id, count) =>
          new CountedItem(
            registered.find(x => x.id === id) ?? new Item(id, id),
            count
          )
      );
  }

  public getProfitSummary(user: UserEntity) {
    const editor = this._getEditor(user);
    const owned = this.assets.map(a => [a, editor.count(a).count] as const);
    const ts = this._makeCollectionDate(user);
    const diff = Date.now() - ts.get();

    const hoursPassed = Math.trunc(diff / (3600 * 1000));
    const minsRemaining =
      hoursPassed > 0 ? 0 : 60 - new Date(diff).getMinutes();

    const profit = owned.flatMap(([a, x]) =>
      a.output.map(o => new CountedItem(o, o.count * hoursPassed * x))
    );

    return { profit, hoursPassed, minsRemaining };
  }

  public buyAssets(user: UserEntity, item: CountedItem) {
    const asset = this.assets.find(x => x.id === item.id);
    if (!asset) throw new Error(`"${item.name}" не является активом`);
    const total = asset.price * item.count;
    const gb = user.game_balance;

    if (!user.game_balance.isAffordable(total)) {
      const diff = gb.diffWith(total).map(value => -value);

      throw new Error(
        `Для покупки "${item.name}" x ${item.count} за ${gb.map(
          () => total
        )} нехватает ${diff}`
      );
    }

    this._makeCollectionDate(user);
    gb.subtract(total);
    this._getEditor(user).add(item);
  }

  public collectProfit(user: UserEntity) {
    const { profit, hoursPassed } = this.getProfitSummary(user);
    const editor = this._getEditor(user);
    const ts = this._makeCollectionDate(user);

    profit.forEach(item => editor.add(item));
    if (hoursPassed > 0) ts.set();

    return profit;
  }

  public convertOwned(user: UserEntity) {
    const editor = this._getEditor(user);

    return this.converter.convertAll(editor);
  }

  public sellAll(user: UserEntity) {
    const editor = this._getEditor(user);

    return this.seller.sellAll(editor, user.game_balance);
  }
}
