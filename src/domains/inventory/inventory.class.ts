import type { Facade } from "@domains/shared/facade.interface";
import type { Jsonable } from "@domains/shared/jsonable.type";
import type { Stringifiable } from "@domains/shared/stringifiable";
import type { InventoryDTO } from "./inventory.dto";

export class Inventory
  implements Facade<InventoryDTO>, Stringifiable, Jsonable<InventoryDTO> {
  constructor(public readonly raw: InventoryDTO, public readonly domain = "") {}

  get asMap() {
    return new Map(Object.entries(this.raw));
  }

  getCount(itemName: string) {
    return this.raw[itemName] ?? 0;
  }

  add(itemName: string, amount = 1) {
    this.raw[itemName] = this.getCount(itemName) + amount;
    return this;
  }

  addMultiple(changes: InventoryDTO) {
    Object.keys(changes).forEach(key => this.add(key, changes[key] ?? 0));
    return this;
  }

  /**
   * @warning Method is not checking the values u put in it
   * @param {string} itemName
   * @param {number} count
   */
  set(itemName: string, count: number) {
    this.raw[itemName] = count;
  }

  /**
   * @warning Method is not checking the values u put in it
   * @param {InventoryDTO} map
   */
  setMultiple(map: InventoryDTO) {
    Object.assign(this.raw, map);
  }

  update(itemName: string, mapper: (value: number) => number) {
    this.raw[itemName] = mapper(this.getCount(itemName));
  }

  map<T>(mapper: (itemName: string, count: number) => T): T[] {
    return Object.keys(this.raw).map(key => mapper(key, this.getCount(key)));
  }

  /**
   *
   * @param {string} itemName
   * @param {number} amount
   * @param {boolean} eatError
   *
   * @throws {RangeError}
   * @return {this}
   */
  remove(itemName: string, amount = 1, eatError = false) {
    let count = this.getCount(itemName);

    if (count < amount) {
      if (eatError) {
        count = amount;
      } else {
        throw new RangeError(
          `Cannot remove inexistent item "${itemName}". Tried to remove ${amount} but has only ${count} `
        );
      }
    }

    const newValue = count - amount;

    if (newValue > 0) this.raw[itemName] = newValue;
    else delete this.raw[itemName];

    return this;
  }

  /**
   *
   * @param {InventoryDTO} changes
   * @param {boolean} eatError
   *
   * @throws {RangeError}
   * @return {this}
   */
  removeMultiple(changes: InventoryDTO, eatError = false) {
    Object.keys(changes).forEach(key =>
      this.remove(key, changes[key] ?? 0, eatError)
    );
    return this;
  }

  subsetRaw<K extends string[]>(
    ...keys: K
  ): {
    [key in K[number]]: number;
  } {
    const obj: any = {};

    for (const key of keys) {
      obj[key] = this.getCount(key);
    }

    return obj;
  }

  subset(keys: string[]) {
    const obj: any = {};

    for (const key of keys) {
      obj[key] = this.getCount(key);
    }

    return new Inventory(obj);
  }

  subsetWithFn(fn: (key: string) => boolean) {
    const obj: any = {};

    Object.keys(this.raw).map(key => {
      if (fn(key)) obj[key] = this.getCount(key);
    });

    return new Inventory(obj);
  }

  renameMany(nameMapping: Record<string, string>) {
    const obj: any = {};

    Object.keys(this.raw).map(key => {
      obj[nameMapping[key] ?? key] = this.raw[key];
    });

    return new Inventory(obj);
  }

  renameWithFn(fn: (oldKey: string) => string | undefined) {
    const obj: any = {};

    Object.keys(this.raw).map(key => {
      obj[fn(key) ?? key] = this.raw[key];
    });

    return new Inventory(obj);
  }

  rename(oldKey: string, newKey: string) {
    const obj = { ...this.raw };

    obj[newKey] = this.getCount(oldKey);
    delete obj[oldKey];

    return new Inventory(obj);
  }

  toString() {
    return Object.keys(this.raw)
      .filter(key => this.getCount(key) > 0)
      .map(key => `${key}: ${this.getCount(key)}`)
      .join("\n");
  }

  toJSON() {
    return this.raw;
  }
}
