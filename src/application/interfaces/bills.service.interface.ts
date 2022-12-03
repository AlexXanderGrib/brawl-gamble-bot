import type { Bill } from "@domains/payments";

export type IncomingTransaction = {
  user_id: number;
  amount: number;
  system?: string;
  id: string;
};

export interface IBillsService {
  readonly isAvailable: boolean;

  createBill(amount: number, userId: number, comment?: string): Promise<Bill>;
  getRecentTransactions(): Promise<IncomingTransaction[]>;
}
