import type { DropFactory } from "./drop-factory.type";
import type { DropMapDTO } from "./drop.map.dto";
import { AccountDrop } from "./types/account.facade";
import { MoneyDrop } from "./types/money.facade";
import { TextDrop } from "./types/text.facade";

export const DropMap: {
  [key in keyof DropMapDTO]: DropFactory<key>;
} = {
  account: AccountDrop,
  money: MoneyDrop,
  text: TextDrop
};
