import { ListFormat } from "@xxhax/lists";
import { AbstractDrop } from "../abstract-drop.class";

export class AccountDrop extends AbstractDrop<"account"> {
  private readonly _formatter = new ListFormat("ru", {
    style: "long",
    type: "conjunction"
  });

  toString() {
    const text = this._formatter.format(this.raw.personages);

    return `Аккаунт: ${text}`;
  }
}
