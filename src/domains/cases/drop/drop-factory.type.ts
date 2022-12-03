import type { Constructor } from "@domains/shared/constructor.type";
import type { Facade } from "@domains/shared/facade.interface";
import type { DropType } from "./drop.dto";
import type { DropMapDTO } from "./drop.map.dto";

export type DropFactory<Type extends DropType = DropType> = Constructor<
  Facade<DropMapDTO[Type]>,
  [raw: DropMapDTO[Type]]
>;
