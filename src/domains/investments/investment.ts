import type { Facade } from "@domains/shared/facade.interface";
import type { InvestmentDTO } from "./investment.dto";

export class Investment implements Facade<InvestmentDTO>, InvestmentDTO {
  readonly price!: number;
  readonly isPriceGems?: boolean | undefined;
  readonly name!: string;
  readonly emoji!: string;
  readonly profitPerHour!: number;
  readonly id!: string;

  constructor(public readonly raw: InvestmentDTO) {
    Object.assign(this, raw);
  }

  get fullName() {
    return `${this.raw.emoji} ${this.raw.name}`;
  }

  calculateProfit(since: Date) {
    const now = new Date();
    const diff = now.getTime() - since.getTime();

    if (diff < 0) return 0;

    const hours = Math.trunc(diff / (3600 * 1000));

    return hours * this.raw.profitPerHour;
  }
}
