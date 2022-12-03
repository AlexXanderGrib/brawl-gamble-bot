import type { Entity } from "@domains/shared/entity.interface";
import type { IBalanceWithCurrency } from "@xxhax/bablo";
import type { SubscriptionsDTO } from "../subscriptions";

export interface UserEntity extends Entity {
  deposit_balance: IBalanceWithCurrency;
  game_balance: IBalanceWithCurrency;
  diamond_balance: IBalanceWithCurrency;

  data: Record<string, any>;
  referrer: number | null;
  subscriptions: SubscriptionsDTO;
  achievements: string[];

  rank_points: IBalanceWithCurrency;
  last_recorded_rank: number;
  registration_date: Date;
  last_active: Date;
}
