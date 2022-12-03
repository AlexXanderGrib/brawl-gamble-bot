import { AccountsGenService } from "@app/services/accounts-gen.service";
import { MembersService } from "@app/services/members.service";
import { NotificationService } from "@app/services/notifications.service";
import { UsersRepository } from "@app/services/repositories/users.repo";
import { DiamondCurrency } from "@domains/currency";
import { Notification } from "@domains/notifications";
import { emoji } from "@xxhax/emoji";
import { ListFormat } from "@xxhax/lists";
import { random } from "@xxhax/safe-math";
import { id } from "@xxhax/strings";
import { BotController, Handle } from "src/bot";
import { AdminAPI, BotAPI, container, GroupID } from "src/config";
import type { API, WallAttachment, WallPostContext } from "vk-io";

function matchBirthDay(birthday: string) {
  const date = new Date();

  const [day, month] = birthday.split(".");
  return (
    parseInt(day ?? "", 10) === date.getDate() &&
    parseInt(month ?? "", 10) === date.getMonth()
  );
}

function formatBirthDays(birthdays: string[]) {
  const formatter = new ListFormat("ru", {
    style: "long",
    type: "conjunction"
  });

  const text = formatter.format(birthdays);

  if (!text) return "";

  return `${emoji.party_popper} Кстати поздравляем с Днём Рождения: ${text}`;
}

@container.ProvideClass()
export class PostsController extends BotController<WallPostContext> {
  public static readonly PostReward = 2;

  @container.InjectGetter(AdminAPI)
  private readonly admin!: API;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(BotAPI)
  private readonly api!: API;

  @container.InjectGetter(AccountsGenService)
  private readonly ags!: AccountsGenService;

  @container.InjectGetter(UsersRepository)
  private readonly userRepo!: UsersRepository;

  @container.InjectGetter(NotificationService)
  private readonly notification!: NotificationService;

  @container.InjectGetter(MembersService)
  private readonly membersService!: MembersService;

  @Handle<WallPostContext>([ctx => ctx.wall?.text === "#free_acc"])
  async interceptFreeAcc(context: WallPostContext) {
    await this.admin.wall.edit({
      post_id: context.wall.id,
      owner_id: context.wall.ownerId,
      message: `${emoji.fire} Ща выложу бесплатный акк`
    });

    const [{ items: products }, { email, password }] = await Promise.all([
      this.admin.market.get({
        owner_id: -this.groupId
      }),
      this.ags.generateOne()
    ]);

    const product = products
      ? products[random(0, products.length, 0)]
      : undefined;

    const mentions: string[] = [];

    for await (const [ids] of this.membersService.getAll()) {
      const users = await this.api.users.get({
        user_ids: ids.join(","),
        name_case: "acc",
        fields: ["bdate"]
      });

      mentions.push(
        ...users
          .filter(user => matchBirthDay(user.bdate || ""))
          .map(user => `@id${user.id} (${user.first_name} ${user.last_name})`)
      );
    }

    const message = `
${emoji.gift} Вот вам бесплатный аккаунт! ${emoji.fire}

${emoji.email} Email: ${email}
${emoji.lock} Пароль: ${password}

Аккаунт действует 24 часа ${emoji.hourglass_flowing_sand}. 
Кто первый зайдёт и сменит пароль, тот и забирает! Вход через Google Play. Пароль от почты и аккаунты одинаковый.

${emoji.fire} Удачи в игре! ${emoji.wink}

${formatBirthDays(mentions)}

#brawl #stars #brawlstars #бравл #старс #бравлстарс #браво #брвл #брав #стас #аккаунт #бесплатно #бесплатный #free`
      .trim()
      .replace(/ +/, " ");

    const { post_id } = await this.admin.wall.post({
      message,
      attachments: product ? [`market${product.owner_id}_${product.id}`] : [],
      owner_id: -this.groupId,
      guid: id(),
      from_group: 1,
      copyright: `https://vk.com/market-${this.groupId}`,
      close_comments: true,
      signed: 1
    });

    await this.admin.wall.edit({
      post_id: context.wall.id,
      owner_id: context.wall.ownerId,
      message: `${emoji.fire} Бесплатный акк ${emoji.point_right} vk.com/wall-${this.groupId}_${post_id}`
    });
  }

  @Handle<WallPostContext>([
    ctx => ctx.is(["wall_post_new"]) && ctx.wall.postType === "post"
  ])
  async onPost(context: WallPostContext) {
    const { wall } = context;
    const { signerId } = wall;

    const isForDons = !!(wall as any).payload?.donut?.is_donut;

    const reward = PostsController.PostReward * (isForDons ? 2 : 1);
    const postLink = isForDons
      ? "[только для донов]"
      : `vk.com/wall${wall.ownerId}_${wall.id}`;

    if (!isForDons) {
      // await this._sharePostInDialogs(wall);
      await this._sendWarningToComments(wall);
    }

    if (!signerId) return;

    await Promise.all([
      this._rewardAuthor(signerId, reward),
      this.notification.deliver(
        new Notification(
          `${
            emoji.white_check_mark
          } Ваш пост нам понравился и был опубликован администратором!

  ${emoji.ghost} Награда: ${new DiamondCurrency(reward)}
  ${emoji.art} Пост: ${postLink}`,
          signerId
        )
      )
    ]);
  }

  private async _sendWarningToComments(wall: WallAttachment) {
    await this.admin.wall.createComment({
      from_group: this.groupId,
      post_id: wall.id,
      owner_id: wall.ownerId,
      guid: id(8),
      message: `${emoji.warning} Пожалуйста. Уважайте друг друга в комментариях. Из-за новых правил вк мы обязаны удалять все комментарии с враждебными высказываниями.
      
Так-же всем спамерам, напоминаем, что мы пожалуемся на ваш коммент, и вашу страничку ВК заблокируют. "Бот" не даёт аккаунты, а разводит вас на актив`
    });
  }

  // private async _sharePostInDialogs(wall: WallAttachment) {
  //   const dialogs = await this.api.messages.getConversations({
  //     count: 100,
  //     filter: "all",
  //     offset: random(0, 500)
  //   });

  //   const randomPostReceivers = dialogs.items
  //     .filter(c => !!c.conversation?.can_write?.allowed && Math.random() > 0.75)
  //     .map(c => c.conversation?.peer.local_id)
  //     .filter(id => id && id > 0) as number[];

  //   await this.notification.deliver(
  //     new Notification(
  //       `${emoji.art} Смори что у нас в группе выложили`,
  //       randomPostReceivers,
  //       {
  //         attachment: `wall${wall.ownerId}_${wall.id}`,
  //         keyboard: autoKeyboard().toString()
  //       }
  //     )
  //   );
  // }

  private async _rewardAuthor(signerId: number, reward: number) {
    const user = await this.userRepo.getUser(signerId);
    user.diamond_balance.add(reward);
    return this.userRepo.updateUser(user);
  }
}
