import { CacheService } from "@app/services/cache.service";
import { ConfigService } from "@app/services/config.service";
import { MembersService } from "@app/services/members.service";
import { NotificationService } from "@app/services/notifications.service";
import { Notification } from "@domains/notifications";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { AdminAPI, AdminDomain, container, GroupID } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { API, Keyboard } from "vk-io";
import type { UsersUserXtrCounters } from "vk-io/lib/api/schemas/objects";
import {
  SupportCallAdminsButton,
  SupportCallButton,
  SupportRoutes,
  SupportWriteButton
} from "./support.shared";

@container.ProvideClass()
export class SupportController extends BotController {
  @container.InjectGetter(AdminAPI)
  private readonly admin!: API;

  @container.InjectGetter(NotificationService)
  private readonly notificationService!: NotificationService;

  @container.InjectGetter(AdminDomain)
  private readonly adminDomain!: string;

  @container.InjectGetter(ConfigService)
  private readonly config!: ConfigService;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(MembersService)
  private readonly ms!: MembersService;

  @container.InjectGetter(CacheService)
  private readonly cache!: CacheService;

  @Handle([AutoSkipCondition(), UseRouteCondition(SupportRoutes.Menu)])
  async support(context: ExtendedMessageContext) {
    const [admin] = (await this.admin.users.get({})) as [UsersUserXtrCounters];
    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    await context.reply(
      ` Админ группы - @id${admin.id} (${admin.first_name} ${admin.last_name})`,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([
            [
              SupportWriteButton({ to: this.adminDomain }),
              SupportCallButton({ id: admin.id })
            ],
            [SupportCallAdminsButton()]
          ]),
          inline: supportsInlineKeyboard
        })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(SupportRoutes.CallAdmins)])
  async callAdmins(context: ExtendedMessageContext) {
    const supportsInlineKeyboard = context.supportsInlineKeyboard();
    const link = `https://vk.com/gim${this.groupId}?sel=${context.clientId()}`;
    const mobileLink = `https://m.vk.com/mail?act=show&peer=${context.clientId()}&community=${
      this.groupId
    }`;
    const { first_name, last_name, id } = await context.getUser();
    const mention = `@id${id} (${first_name} ${last_name})`;
    const peer_ids = this.config.notificationPeers;
    const key = "call_admins_ts";
    const cache = this.cache.forUser(context.clientId());
    const timeDiff = await cache
      .get(key)
      .then(str => parseInt(str) || Date.now())
      .then(ts => Date.now() - ts);

    const dons: number[] = [];

    for await (const [batch] of this.ms.getAll({ filter: "donut" })) {
      dons.push(...batch);
    }

    const isDon = dons.includes(id);

    if (timeDiff > 3 * 60 * 1000 && !isDon) {
      await context.reply(
        `${emoji.stop_sign} Администрация уже осведомлена о вашем запросе и постарается ответить как-можно быстрее`,
        { keyboard: autoKeyboard({ inline: supportsInlineKeyboard }) }
      );

      return;
    }

    console.log(
      `ADMIN ATTENTION REQUEST: Made by https://vk.com/id${id} (${first_name} ${last_name}). Send to ${JSON.stringify(
        peer_ids
      )}`
    );

    await cache.set(key, Date.now().toString());

    await Promise.all([
      context.reply(`${emoji.bell} Уведомления админам отправлены`, {
        keyboard: autoKeyboard({ inline: supportsInlineKeyboard })
      }),
      this.notificationService.deliverToAdmins(
        new Notification(
          `${
            isDon ? `${emoji.doughnut} Дон @all` : "Дрочила"
          } ${mention} захотел побазарить с админом
        
${emoji.speech_balloon} Ссылка на диалог: ${link}
${emoji.mobile_phone} Ссылка для мобилки: ${mobileLink}`,
          []
        )
      )
    ]);
  }
}
