import type { Identifiable } from "@domains/shared/identifiable.interface";
import type { DropDTO } from "./drop/drop.dto";

export type CaseDTO = Identifiable<string> & {
  readonly name: string;
  readonly emoji: string;
  readonly isPriceGems?: boolean;

  drop: DropDTO[];
  price: number;
  hidden?: boolean;
};
