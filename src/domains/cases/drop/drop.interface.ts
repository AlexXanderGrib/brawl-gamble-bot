import type { Facade } from "@domains/shared/facade.interface";
import type { Stringifiable } from "@domains/shared/stringifiable";
import type { DropDTO, DropType } from "./drop.dto";

export type Drop<T extends DropType = DropType> = Facade<DropDTO<T>> &
  Stringifiable;
