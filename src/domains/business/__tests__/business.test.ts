import { GameCurrency } from "@domains/currency";
import type { UserEntity } from "@domains/users";
import { BalanceWithCurrency } from "@xxhax/bablo";
import { emoji } from "@xxhax/emoji";
import { Asset } from "../asset.class";
import { Business } from "../business.class";
import { ItemsConvertor } from "../convertor.class";
import { CountedItem } from "../counted-item.class";
import { Item } from "../item.class";
import { Seller } from "../seller.class";

const chicken = new Item("chicken", `${emoji.chicken} Курица`);
const egg = new Item("egg", `${emoji.egg} Яйцо`);
const omelet = new Item("omelet", `${emoji.cooking} Омлет`);

const sheep = new Item("sheep", `${emoji.sheep} Овца`);
const wool = new Item("wool", `${emoji.white_circle} Шерсть`);
const clothes = new Item("clothes", `${emoji.shirt} Рубашка`);

const cow = new Item("cow", `${emoji.cow} Корова`);
const milk = new Item("milk", `${emoji.milk_glass} Молоко`);
const cheese = new Item("cheese", `${emoji.cheese} Сыр`);

const c = (i: Item, c: number) => new CountedItem(i, c);

const business = new Business(
  new Item("farm", `${emoji.farmer} Ферма`),
  [
    new Asset(sheep, 5000, [c(wool, 10)]),
    new Asset(cow, 10000, [c(milk, 10)]),
    new Asset(chicken, 1500, [c(egg, 10)])
  ],

  new ItemsConvertor([
    [c(wool, 100), c(clothes, 1)],
    [c(milk, 20), c(cheese, 2)],
    [c(egg, 1), c(omelet, 1)]
  ]),
  new Seller([
    [c(cheese, 1), 80],
    [c(milk, 1), 34],
    [c(clothes, 1), 800],
    [c(omelet, 1), 60],
    [c(egg, 1), 12]
  ])
);

const createUser = (balance: number, data: any = {}): UserEntity =>
  ({
    game_balance: new BalanceWithCurrency(GameCurrency, balance),
    data
  } as any);

describe(Business.name, () => {
  test("Buy Assets", () => {
    const user = createUser(10000);

    business.buyAssets(user, new CountedItem(chicken, 3));

    expect(business.getInventory(user)).toEqual([new CountedItem(chicken, 3)]);
  });
});
