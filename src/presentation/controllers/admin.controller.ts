import type {
  IPublishingService,
  PostID
} from "@app/interfaces/publishing.service.interface";
import { ConfigService } from "@app/services/config.service";
import { PublishingService } from "@app/services/publishing.service";
import { UsersRepository } from "@app/services/repositories/users.repo";
import { RealCurrency } from "@domains/currency";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji, random as randomEmoji } from "@xxhax/emoji";
import { random } from "@xxhax/safe-math";
import { id } from "@xxhax/strings";
import { BotController, Handle } from "src/bot";
import { AdminAPI, container, GroupID } from "src/config";
import type { ExtendedMessageContext as EMC } from "src/context";
import { API, Keyboard } from "vk-io";
import type {
  MarketMarketItem,
  WallWallpostFull
} from "vk-io/lib/api/schemas/objects";
import {
  AdminPostStolenMemeButton,
  AdminRoutes,
  AdminStealMemeButton
} from "./admin.shared";

@container.ProvideClass()
export class AdminController extends BotController {
  @container.InjectGetter(AdminAPI)
  private readonly admin!: API;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(ConfigService)
  private readonly config!: ConfigService;

  @container.InjectGetter(PublishingService)
  private readonly pub!: IPublishingService;

  @container.InjectGetter(UsersRepository)
  private readonly usersRepo!: UsersRepository;

  @Handle([AutoSkipCondition(), UseRouteCondition(AdminRoutes.StealMeme)])
  async stealNewMeme(context: EMC) {
    if (
      !this.config.isPermitted(context.clientId()) ||
      !context.enabledModules.includes("admin:meme-stealing")
    )
      return;

    await context.send("Ща подыщю чё нибудь");

    const supportsInlineKeyboard = context.supportsInlineKeyboard();
    const groups = this.config.memesDonors;
    const donorGroupId = groups[random(0, groups.length - 1, 0)];

    const keyboard = autoKeyboard({
      keyboard: Keyboard.keyboard([[AdminStealMemeButton({ type: "retry" })]]),
      inline: supportsInlineKeyboard
    });

    if (!donorGroupId) {
      await context.reply("Чё-то неоткуда пиздить", {
        keyboard
      });
      return;
    }

    let candidate: WallWallpostFull | undefined;

    try {
      candidate = await this._getPostCandidate(donorGroupId);
    } catch {
      await context.reply(
        `Попытался спиздить, оказалось что группы не существует - vk.com/public${donorGroupId}`,
        { keyboard }
      );
      return;
    }

    if (!candidate) {
      await context.reply("Хуйню постят, я чё-то ничё не нашёл", { keyboard });
      return;
    }

    const postId = `${candidate.owner_id}_${candidate.id}` as PostID;

    await context.reply(
      `Перед копированием надо проверить пост:
      
vk.com/wall${postId}`,
      {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([
            AdminPostStolenMemeButton({ postId }),
            AdminPostStolenMemeButton({
              postId,
              schedule: "30m",
              type: "schedule"
            }),
            AdminStealMemeButton({ type: "other" })
          ]),
          inline: supportsInlineKeyboard
        })
      }
    );
  }
  private async _getPostCandidate(group: number) {
    const { items: posts } = await this.admin.wall.get({
      owner_id: -group,
      count: 100,
      filter: "owner"
    });

    const candidates = posts.filter(
      p => !p.copy_history && !p.copyright && !p.marked_as_ads && !p.text
    );

    return candidates[random(0, candidates.length - 1, 0)];
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(AdminRoutes.PostStolenMeme)])
  async postStolenMeme(context: EMC) {
    if (!this.config.isPermitted(context.clientId())) return;

    const supportsInlineKeyboard = context.supportsInlineKeyboard();

    const product = await this._getProductForPost();
    const offset = context.messagePayload?.schedule ?? "0ms";
    const schedule = await this.pub.scheduleAfterLastPublished(offset);

    const postId = context.messagePayload?.id;

    try {
      const copyId = await this.pub.copy(postId, post => ({
        ...this._preparePost(post, product),
        publish_date: offset.startsWith("0") ? undefined : schedule.toEpoch()
      }));

      await context.reply(`Пост опубликован vk.com/wall${copyId}`, {
        keyboard: autoKeyboard({
          inline: supportsInlineKeyboard,
          keyboard: Keyboard.keyboard([
            [AdminStealMemeButton({ type: "again" })]
          ])
        })
      });
    } catch (error) {
      await context.reply(`Не удалось скопировать пост: ${error.stack}`, {
        keyboard: autoKeyboard({
          keyboard: Keyboard.keyboard([
            [
              AdminPostStolenMemeButton({
                postId,
                schedule: offset,
                type: "retry"
              })
            ],
            [AdminStealMemeButton({ type: "other" })]
          ]),
          inline: supportsInlineKeyboard
        })
      });
    }
  }

  private _preparePost(post: WallWallpostFull, product?: MarketMarketItem) {
    const attachments = (post.attachments || [])
      .filter(a => a.type === "photo")
      .map(
        a => `photo${a.photo?.owner_id}_${a.photo?.id}_${a.photo?.access_key}`
      );

    if (product) attachments.push(`market${product.owner_id}_${product.id}`);

    return {
      owner_id: -this.groupId,
      attachments,
      message: randomEmoji(3).join(""),
      guid: id()
    };
  }

  private async _getProductForPost() {
    const marketGetResponse = await this.admin.market.get({
      owner_id: -this.groupId
    });

    const product = marketGetResponse.items
      ? marketGetResponse.items[random(0, marketGetResponse.items.length)]
      : undefined;
    return product;
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(AdminRoutes.PublishFreeAcc)])
  async postFreeAccount(context: EMC) {
    if (!this.config.isPermitted(context.clientId())) return;

    const supportsInlineKeyboard = context.supportsInlineKeyboard();
    const ts = await this.admin.utils.getServerTime({});

    const { post_id } = await this.admin.wall.post({
      owner_id: -this.groupId,
      message: `#free_acc`,
      publish_date: ts + 3600,
      signed: 1
    });

    await context.reply(
      `${emoji.timer_clock} Будет выложен через час: vk.com/wall-${this.groupId}_${post_id}`,
      {
        keyboard: autoKeyboard({ inline: supportsInlineKeyboard })
      }
    );
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(AdminRoutes.ShowDonated)])
  async showDonated(context: EMC) {
    const donated = await this.usersRepo.getDonatedUsers();

    const users = await context.getApi().users.get({
      user_ids: donated.map(d => d.user_id.toString())
    });

    let text = "";

    donated.forEach(({ user_id, total, referrer = 0 }, index) => {
      const user = users.find(u => u.id === user_id);
      const mention = user
        ? `@id${user.id} (${user.first_name} ${user.last_name})`
        : `@id${user_id}`;

      text += `${index + 1}) ${mention} - ${new RealCurrency(total)}\n`;

      if (referrer) {
        text += `└ ${emoji.bust_in_silhouette} Реферер: @id${referrer}\n`;
      }
    });

    await context.reply(`${emoji.dollar} Донатеры:\n\n${text}`, {
      keyboard: autoKeyboard({ inline: context.supportsInlineKeyboard() })
    });
  }
}
