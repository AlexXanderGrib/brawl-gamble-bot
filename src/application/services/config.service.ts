import { Config, container } from "src/config";

@container.ProvideClass()
export class ConfigService {
  @container.InjectGetter(Config)
  public readonly config!: Config;

  get notificationPeers(): number[] {
    return (
      (this.config as any).notification_peers ?? this.config.permitted_users
    );
  }

  isPermitted(userId: number) {
    return this.config.permitted_users?.includes(userId) ?? false;
  }

  get memesDonors(): number[] {
    return this.config.aspects?.memes_donors ?? [];
  }

  get enabledModules(): string[] {
    return this.config.aspects?.modules ?? [];
  }
}
