import type { IDisposableService } from "@app/interfaces/disposable.service.interface";
import Redis, { Redis as RedisType } from "ioredis";
import { Config, container } from "src/config";

@container.ProvideClass()
export class RedisService implements IDisposableService {
  @container.InjectGetter(Config)
  private readonly config!: Config;

  private _client!: RedisType;

  get client() {
    if (!this._client) {
      this._client = new Redis(this.config.redis);
    }

    return this._client;
  }

  dispose() {
    this.client.disconnect();

    return Promise.resolve();
  }
}
