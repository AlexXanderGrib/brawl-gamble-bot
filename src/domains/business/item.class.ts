import type { Identifiable } from "@domains/shared/identifiable.interface";

export class Item implements Identifiable<string> {
  constructor(public readonly id: string, public readonly name: string) {}

  toString() {
    return this.name;
  }
}
