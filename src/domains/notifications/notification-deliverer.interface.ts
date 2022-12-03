import type { INotification } from "./notification.interface";

export interface INotificationDeliverer {
  deliver(notification: INotification): Promise<void>;
}
