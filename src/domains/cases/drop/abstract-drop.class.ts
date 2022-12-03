import type { DropDTO, DropType } from "./drop.dto";
import type { Drop } from "./drop.interface";

export abstract class AbstractDrop<T extends DropType> implements Drop<T> {
  constructor(public readonly raw: DropDTO<T>) {}

  abstract toString(): string;
}
