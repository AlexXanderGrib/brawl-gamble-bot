import type { Facade } from "@domains/shared/facade.interface";
import type { Jsonable } from "@domains/shared/jsonable.type";
import { isDate, isInvalidDate } from "@xxhax/validators";
import type { SubscriptionsDTO } from "./subscriptions.dto";

export class Subscriptions
  implements Facade<SubscriptionsDTO>, Jsonable<SubscriptionsDTO> {
  constructor(public readonly raw: SubscriptionsDTO = {}) {}

  whenSubscribedTo(topic: string): Date | undefined {
    const timestamp = this.raw[topic];
    const something = timestamp && new Date(timestamp);

    return isDate(something) && !isInvalidDate(something)
      ? something
      : undefined;
  }

  isSubscribedTo(topic: string) {
    return !!this.raw[topic];
  }

  subscribe(topic: string) {
    if (this.isSubscribedTo(topic)) return false;

    this.raw[topic] = Date.now();
    return true;
  }

  unsubscribe(topic: string) {
    if (!this.isSubscribedTo(topic)) return false;

    return delete this.raw[topic];
  }

  toJSON() {
    return this.raw;
  }
}
