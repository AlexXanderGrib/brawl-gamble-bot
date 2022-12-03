import type {
  INotification,
  INotificationDeliverer
} from "@domains/notifications";

export interface INotificationService extends INotificationDeliverer {
  deliverToAdmins(notification: INotification): Promise<void>;
}
