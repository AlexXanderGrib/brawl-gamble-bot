import type { INotificationService } from "@app/interfaces/notification.service.interface";
import { INotification, Notification } from "@domains/notifications";
import { emoji } from "@xxhax/emoji";
import { random } from "@xxhax/safe-math";
import { BotAPI, container } from "src/config";
import type { API } from "vk-io";
import type { MessagesSendParams } from "vk-io/lib/api/schemas/params";
import { ConfigService } from "./config.service";

@container.ProvideClass()
export class NotificationService implements INotificationService {
  deliverToAdmins(notification: INotification): Promise<void> {
    const rerouted = new Notification(
      notification.content,
      this.config.notificationPeers,
      notification.meta
    );

    return this.deliver(rerouted);
  }

  @container.InjectGetter(BotAPI)
  private readonly api!: API;

  @container.InjectGetter(ConfigService)
  private readonly config!: ConfigService;

  async deliver(notification: INotification) {
    const params: MessagesSendParams = {
      message: `${emoji.robot_face} ${emoji.bell} ${notification.content}`,
      random_id: random(0, Date.now()),
      ...notification.meta
    };

    this._parseReceiver(notification, params);

    await this.api.messages.send(params);
  }

  private _parseReceiver(
    notification: INotification,
    params: MessagesSendParams
  ) {
    if (typeof notification.receiver === "number")
      params.peer_id = notification.receiver;
    else if (typeof notification.receiver === "string")
      params.domain = notification.receiver;
    else params.peer_ids = notification.receiver;
  }
}
