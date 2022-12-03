import type { Identifiable } from "@domains/shared/identifiable.interface";

export interface InvestmentDTO extends Identifiable<string> {
  price: number;
  isPriceGems?: boolean;
  name: string;
  emoji: string;
  profitPerHour: number;
}
