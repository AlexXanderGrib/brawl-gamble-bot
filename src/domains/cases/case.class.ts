import type { Facade } from "@domains/shared/facade.interface";
import type { Identifiable } from "@domains/shared/identifiable.interface";
import type { Jsonable } from "@domains/shared/jsonable.type";
import { random } from "@xxhax/safe-math";
import type { CaseDTO } from "./case.dto";
import type { DropFactory } from "./drop/drop-factory.type";
import type { DropDTO, DropType } from "./drop/drop.dto";
import type { Drop } from "./drop/drop.interface";
import { DropMap } from "./drop/drop.map";

function makeDrop<Type extends DropType>(drop: DropDTO<Type>) {
  const Factory = (DropMap[drop.type] as any) as DropFactory<Type>;

  return new Factory(drop);
}

export class Case
  implements Facade<CaseDTO>, Jsonable<CaseDTO>, Identifiable<string>, CaseDTO {
  constructor(public readonly raw: CaseDTO) {
    Object.assign(this, raw);
  }

  readonly id!: string;
  readonly name!: string;
  readonly emoji!: string;
  readonly isPriceGems?: boolean | undefined;
  readonly drop!: DropDTO[];
  readonly price!: number;
  readonly hidden?: boolean | undefined;

  public get mappedDrop(): Drop[] {
    return this.raw.drop.map(drop => makeDrop(drop));
  }

  get fullName() {
    return `${this.raw.emoji} ${this.raw.name}`;
  }

  open() {
    const ns = this.mappedDrop.flatMap<Drop<"text" | "account" | "money">>(
      drop => {
        const multiplier = drop.raw.multiplier ?? 1;
        drop.raw.multiplier = 1;

        return new Array(multiplier).fill(drop);
      }
    );

    let item = ns[random(0, ns.length - 1)];

    while (!item) item = ns[random(0, ns.length - 1)];

    return item;
  }

  toJSON(): CaseDTO {
    return this.raw;
  }
}
