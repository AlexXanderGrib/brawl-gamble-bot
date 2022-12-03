import { container } from "src/config";
import { CacheService } from "./cache.service";
import { UsersRepository } from "./repositories/users.repo";

type Timeout = {
  reset(): Promise<void>;
  get(): Promise<number>;
};

type TimeoutOptions = {
  user: number;
  storage: "cache" | "persistent";
  name: string;
};

@container.ProvideClass()
export class TimeoutsService {
  @container.InjectGetter(CacheService)
  private readonly cacheService!: CacheService;

  @container.InjectGetter(UsersRepository)
  private readonly usersRepo!: UsersRepository;

  async _persistentStorage(name: string, userId: number): Promise<Timeout> {
    const repo = this.usersRepo;
    const user = await repo.getUser(userId);
    const timeouts = (user.data.timeouts ??= {});

    return {
      get() {
        const ts = timeouts[name] ?? 0;

        return Promise.resolve(Date.now() - ts);
      },
      async reset() {
        timeouts[name] = Date.now();

        await repo.updateUser(user);
      }
    };
  }

  _cacheStorage(name: string, userId: number): Promise<Timeout> {
    const cache = this.cacheService.forUser(userId);
    const key = `timeout_${name}`;
    let ts = 0;

    return Promise.resolve({
      async get() {
        const str = await cache.get(key);

        return (ts = parseInt(str) || 0);
      },
      async reset() {
        ts = Date.now();

        await cache.set(key, ts.toString());
      }
    });
  }

  public create(options: TimeoutOptions): Promise<Timeout> {
    let factory: (name: string, userId: number) => Promise<Timeout> = () =>
      Promise.reject(new Error(`Invalid storage name: ${options.storage}`));

    switch (options.storage) {
      case "cache":
        factory = this._cacheStorage.bind(this);
        break;
      case "persistent":
        factory = this._persistentStorage.bind(this);
        break;
    }

    return factory(options.name, options.user);
  }
}
