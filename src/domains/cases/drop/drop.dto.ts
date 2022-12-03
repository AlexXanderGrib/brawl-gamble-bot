import type { DropMapDTO } from "./drop.map.dto";

export type DropType = keyof DropMapDTO;

export type DropDTO<Type extends DropType = DropType> = DropMapDTO[Type];
