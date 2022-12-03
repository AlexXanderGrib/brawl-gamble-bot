import { Subscriptions } from "@domains/subscriptions";
import type { UserEntity } from "@domains/users";
import { container } from "src/config";

@container.ProvideClass()
export class SubscriptionsService {
  get(user: UserEntity): Subscriptions {
    return new Subscriptions(user.subscriptions);
  }

  set(user: UserEntity, subscriptions: Subscriptions) {
    user.subscriptions = subscriptions.raw;
  }

  modify<T>(user: UserEntity, fn: (sub: Subscriptions) => T): T {
    const sub = this.get(user);

    const result = fn(sub);

    this.set(user, sub);
    return result;
  }
}
