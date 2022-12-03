import type { IStorage } from "@xxhax/vk-storage-wrapper";
import type { Redis } from "ioredis";
import { container, GroupID } from "src/config";
import { RedisService } from "./db/redis.service";

class RedisStorage implements IStorage {
  private _makeKey(key: string) {
    return `${this._groupId}_${this._userId}_${key};`;
  }

  constructor(
    private readonly _groupId: number,
    private readonly _userId: number,
    private readonly _redis: Redis
  ) {}

  getKeys(): Promise<string[]> {
    return this._redis.keys(this._makeKey("*"));
  }

  async get(key: string): Promise<string> {
    key = this._makeKey(key);

    const value = await this._redis.get(key);

    return value ?? "";
  }
  async getFields<K extends string[]>(
    ...keys: K
  ): Promise<{ [key in K[number]]: string }> {
    const values = await this._redis.mget(
      ...keys.map(key => this._makeKey(key))
    );
    const result: any = {};

    keys.forEach((key, idx) => {
      result[key] = values[idx] ?? "";
    });

    return result;
  }
  async set(key: string, value: string): Promise<void> {
    await this._redis.set(this._makeKey(key), value);
  }

  async delete(key: string): Promise<void> {
    await this._redis.del(this._makeKey(key));
  }

  async sync(
    data: Record<string, string>,
    diffWith?: Record<string, string>
  ): Promise<void> {
    const keys = Object.keys(data);
    const remote = diffWith ?? (await this.getFields(...keys));

    const diffKeys = Object.keys(remote).filter(
      key => data[key] !== remote[key]
    );

    await this._redis.mset(
      diffKeys
        .map(key => ({ [this._makeKey(key)]: remote[key] ?? "" }))
        .reduce((a, b) => ({ ...a, ...b }))
    );
  }
}

@container.ProvideClass()
export class CacheService {
  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(RedisService)
  private readonly redisService!: RedisService;

  private readonly _map = new Map<number, RedisStorage>();

  forUser(id: number) {
    const existing = this._map.get(id);
    if (existing) return existing;

    const storage = new RedisStorage(
      this.groupId,
      id,
      this.redisService.client
    );

    this._map.set(id, storage);
    return storage;
  }
}
