import type { UserEntity } from "@domains/users";
import { random, sub, sum } from "@xxhax/safe-math";
import { container } from "src/config";
import type { IWorkService } from "../interfaces/work.service.interface";
import { CacheService } from "./cache.service";

type WorkDataUpdateResult = {
  amount: number;
  total: number;
};

@container.ProvideClass()
export class WorkService implements IWorkService {
  private static readonly Key = "mined_amount";

  @container.InjectGetter(CacheService)
  private readonly cacheService!: CacheService;

  private async _getCurrentMinedAmount(userId: number) {
    const cache = this.cacheService.forUser(userId);
    const value = await cache.get(WorkService.Key);

    return parseFloat(value) || 0;
  }

  private async _storeNewAmount(userId: number, amount: number) {
    const cache = this.cacheService.forUser(userId);

    await cache.set(WorkService.Key, amount.toFixed(2));
  }

  private async _clearCacheFor(userId: number) {
    const cache = this.cacheService.forUser(userId);

    await cache.delete(WorkService.Key);
  }

  public async mine(userId: number): Promise<WorkDataUpdateResult> {
    const current = await this._getCurrentMinedAmount(userId);
    const addition = random(0.5, 4, 2);

    const total = sum(current, addition);

    await this._storeNewAmount(userId, total);
    return { total, amount: addition };
  }

  public async trap(userId: number): Promise<WorkDataUpdateResult> {
    const current = await this._getCurrentMinedAmount(userId);
    const subtraction = random(20, 25, 2);

    const total = sub(current, subtraction);

    await this._storeNewAmount(userId, total);
    return { total, amount: -subtraction };
  }

  public async saveProgress({ user_id, game_balance }: UserEntity) {
    const saved = await this._getCurrentMinedAmount(user_id);
    game_balance.add(saved);

    await this._clearCacheFor(user_id);
    return saved;
  }
}
