import { AchievementsService } from "@app/services/achievements.service";
import { CacheService } from "@app/services/cache.service";
import { CashoutService } from "@app/services/cashout.service";
import { ReferralService } from "@app/services/referral.service";
import { ReplenishmentsService } from "@app/services/replenishments.service";
import { UsersRepository } from "@app/services/repositories/users.repo";
import { DiamondCurrency, RealCurrency } from "@domains/currency";
import { ReplenishmentsController } from "@pres/controllers/balance/replenishments.controller";
import { BasicCondition } from "@pres/shared/basic.condition";
import { FromAdminCondition } from "@pres/shared/from-admin.condition";
import type { IBalanceWithCurrency } from "@xxhax/bablo";
import { emoji } from "@xxhax/emoji";
import { createTMatcher } from "@xxhax/match";
import { sum } from "@xxhax/safe-math";
import { BotController, Handle } from "src/bot";
import { AdminAPI, container, GroupID } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import type { API } from "vk-io";

const REPLENISH_COMMAND_REGEX = /^\/пополн (\d+)?( клава)?$/;
const GIVE_COMMAND_REGEX = /^\/начислить (-?\d+)( ([a-zа-я]+))?$/;
const ACH_CONTROL_REGEX = /^([+-]?)ач ([a-z_0-9]+)$/;

const names = [
  "Александр",
  "Алексей",
  "Анатолий",
  "Андрей",
  "Антон",
  "Арсений",
  "Артём",
  "Артур",
  "Богдан",
  "Борис",
  "Вадим",
  "Валентин",
  "Валерий",
  "Василий",
  "Виктор",
  "Виталий",
  "Влад",
  "Владимир",
  "Владислав",
  "Владлен",
  "Герман",
  "Глеб",
  "Давид",
  "Даниил",
  "Денис",
  "Дмитрий",
  "Евгений",
  "Егор",
  "Захар",
  "Игорь",
  "Илья",
  "Кирилл",
  "Максим",
  "Марат",
  "Марк",
  "Матвей",
  "Мирон",
  "Мухаммед",
  "Никита",
  "Олег",
  "Павел",
  "Петр",
  "Ренат",
  "Роберт",
  "Родион",
  "Роман",
  "Рустам",
  "Рэн",
  "Савва",
  "Савелий",
  "Самсон",
  "Самуил",
  "Святослав",
  "Себастьян",
  "Сергей",
  "Степан",
  "Тарас",
  "Тимур",
  "Федор",
  "Филипп",
  "Юрий",
  "Ян",
  "Ярослав"
];

function _getFakeName(id: number) {
  const name = names[id % names.length];
  const dict = "АБВГДЕЖЗИКЛМОПРСТУФХЦЧШЩЭЮЯ";
  const letter = dict[id % dict.length];

  return `${name} ${letter}.`;
}

@container.ProvideClass()
export class EditorController extends BotController {
  @container.InjectGetter(AdminAPI)
  private readonly admin!: API;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(ReplenishmentsController)
  private readonly replenishmentsController!: ReplenishmentsController;

  @container.InjectGetter(AchievementsService)
  private readonly achService!: AchievementsService;

  @container.InjectGetter(ReferralService)
  private readonly refService!: ReferralService;

  @container.InjectGetter(UsersRepository)
  private readonly userRepo!: UsersRepository;

  @container.InjectGetter(ReplenishmentsService)
  private readonly replenishmentsService!: ReplenishmentsService;

  @container.InjectGetter(CacheService)
  private readonly cacheService!: CacheService;

  @container.InjectGetter(CashoutService)
  private readonly cashoutService!: CashoutService;

  @Handle([FromAdminCondition()])
  async autoEdit(context: ExtendedMessageContext, next: CallableFunction) {
    const text = context.text ?? "";

    const name = _getFakeName(context.senderId);

    await context.editMessage({
      message: `${emoji.bust_in_silhouette} (${name}): ${text}`,
      attachment: context.attachments.map(attachment => {
        const a = attachment.toJSON() as any;

        return `${attachment.type}${a.ownerId}_${a.id}`;
      })
    });

    return next();
  }

  ban(userId: number, comment: string, reason = 0) {
    return this.admin.groups.ban({
      group_id: this.groupId,
      comment,
      reason,
      comment_visible: 1,
      owner_id: userId
    });
  }

  @Handle([FromAdminCondition(), BasicCondition([/^\/cбан /])])
  async silentBan(context: ExtendedMessageContext) {
    await context.deleteMessage({ delete_for_all: 1 });
    await this.ban(context.clientId(), context.normalizedText().slice(6));
  }

  @Handle([FromAdminCondition(), BasicCondition([/^\/бан /])])
  async verboseBan(context: ExtendedMessageContext) {
    await context.deleteMessage({
      delete_for_all: 1,
      message_ids: context.id
    });

    await context.send(
      `${emoji.octagonal_sign} Вам бан! ${emoji.middle_finger}`
    );
    await this.ban(context.clientId(), context.normalizedText().slice(5));
  }

  @Handle([FromAdminCondition(), BasicCondition(["/рефы"])])
  async refInfo(context: ExtendedMessageContext) {
    const referrals = await this.refService.getReferrals(context.clientId());

    const message = [...referrals]
      .map((id, idx) => `${idx + 1}) @id${id}`)
      .join("\n");

    await context.send(`Рефералы @id${context.clientId()}:

  ${message}`);
  }

  @Handle([FromAdminCondition(), BasicCondition([REPLENISH_COMMAND_REGEX])])
  async showReplenish2User(context: ExtendedMessageContext) {
    await context.deleteMessage({ delete_for_all: 1 });
    const text = context.normalizedText();
    const match = REPLENISH_COMMAND_REGEX.exec(text);

    await this.replenishmentsController.showReplenish(
      context,
      parseInt(match?.[1] ?? "99"),
      !text.includes("клава")
    );
  }

  @Handle([FromAdminCondition(), BasicCondition([GIVE_COMMAND_REGEX])])
  async give(context: ExtendedMessageContext) {
    await context.deleteMessage();
    const text = context.normalizedText();

    const match = GIVE_COMMAND_REGEX.exec(text);
    const amount = parseInt(match?.[1] ?? "0");

    const user = await this.userRepo.getUser(context.clientId());

    if (match?.[3]) {
      const balance = createTMatcher({
        алм: user.diamond_balance,
        реал: user.deposit_balance,
        игр: user.game_balance
      })(match[3]) as IBalanceWithCurrency | undefined;

      if (!balance) {
        await context.send(`${emoji.warning} Неверное название баланса. Чтобы изменить баланс, используйте его краткое название:

  Игровой => игр
  Реальный (он же Товарный) => реал
  Специальный (он же Алмазный) => алм`);
        return;
      }

      balance.push(amount);

      const value = balance.map(() => amount);

      try {
        await Promise.all([
          this.userRepo.updateUser(user),
          context.editMessage({
            message: `${emoji.moneybag} Администратор начислил вам ${value}`
          })
        ]);
      } catch (error) {
        await context.send(
          `${emoji.octagonal_sign} Не удалось обновить баланс: ${error}`
        );
      }

      return;
    }

    await this.replenishmentsService.add({
      amount,
      type: "admin",
      user_id: context.clientId()
    });

    await context.editMessage({
      message: `${
        emoji.moneybag
      } Администратор пополнил ваш баланс на ${new RealCurrency(amount)}`
    });
  }

  @Handle([
    FromAdminCondition(),
    BasicCondition(["ач лист", "ач сброс", "ач злой сброс", ACH_CONTROL_REGEX])
  ])
  /**
   *  Функция отвечает за работу с достижениями
   */
  async achievements(context: ExtendedMessageContext) {
    const text = context.normalizedText();

    const user = await this.userRepo.getUser(context.clientId());

    if (text === "ач сброс") {
      try {
        await context.deleteMessage({ delete_for_all: 1 });
        this.achService.reset(user);
        await this.userRepo.updateUser(user);

        await context.send(`${emoji.boom} Достижения сброшены!`);
      } catch (error) {
        await context.send(
          `${emoji.octagonal_sign} Не удалось сбросить достижения: ${error}`
        );
      }
      return;
    }

    if (text === "ач злой сброс") {
      try {
        await context.deleteMessage({ delete_for_all: 1 });
        const achievements = this.achService.get(user);

        const totalReward = achievements.reduce(
          (total, a) => sum(total, a.reward),
          0
        );

        user.diamond_balance.subtract(totalReward);
        this.achService.reset(user);

        await Promise.all([
          this.userRepo.updateUser(user),
          context.send(`${emoji.imp} Достижения сброшены!`)
        ]);
      } catch (error) {
        await context.send(
          `${emoji.octagonal_sign} Не удалось сбросить достижения: ${error}`
        );
      }

      return;
    }

    if (text === "ач лист") {
      const achievements = this.achService.get(user);

      const message = achievements
        .map(achievement => {
          const state = achievement.isUnlocked
            ? emoji.check_mark_button
            : emoji.lock;

          const { fullName, id } = achievement;
          const formattedReward = new DiamondCurrency(achievement.reward);

          return `${fullName} (${id} = ${formattedReward}) - ${state}`;
        })
        .join("\n");

      await context.send(`${emoji.video_game} Список достижений:

  ${message}`);
      return;
    }

    const match = ACH_CONTROL_REGEX.exec(text);

    if (!match) return;

    const [, /* full */ sign, achievementName] = match;

    if (!achievementName) {
      await context.send(
        `${emoji.negative_squared_cross_mark} Не удалось получить имя достижения`
      );
      return;
    }

    const ach = this.achService.localAchievements.find(
      a => a.id === achievementName
    );

    if (!ach) {
      await context.send(
        `${emoji.negative_squared_cross_mark} Такого достижения не существует`
      );
      return;
    }

    const { fn, reward, verb } =
      sign === "+"
        ? {
            fn: this.achService.unlock.bind(this.achService),
            reward: ach.reward,
            verb: "разблокировано"
          }
        : {
            fn: this.achService.lock.bind(this.achService),
            reward: -ach.reward,
            verb: "снято"
          };

    fn(user, achievementName);

    user.diamond_balance.push(reward);

    try {
      await this.userRepo.updateUser(user);
    } catch {
      await context.send(
        `${emoji.negative_squared_cross_mark} Обновить баланс пользователя не удалось`
      );
      return;
    }

    await context.send(
      `${emoji.video_game} Достижение "${ach.fullName}" ${verb}!`
    );
  }

  @Handle([FromAdminCondition(), BasicCondition(["+диалог"])])
  async startDialog(context: ExtendedMessageContext) {
    const name = _getFakeName(context.senderId);

    await Promise.all([
      context.editMessage({
        message: `${emoji.bell} Администратор ${name} начал с вами диалог`
      }),
      this.cacheService.forUser(context.clientId()).set("is_dialog", "true")
    ]);
  }

  @Handle([FromAdminCondition(), BasicCondition(["-диалог"])])
  async stopDialog(context: ExtendedMessageContext) {
    const name = _getFakeName(context.senderId);

    await Promise.all([
      context.editMessage({
        message: `${emoji.bell} Администратор ${name} закончил диалог с вами`
      }),
      this.cacheService.forUser(context.clientId()).delete("is_dialog")
    ]);
  }

  @Handle([FromAdminCondition(), BasicCondition(["/разблокировать баланс"])])
  async unlockBalance(context: ExtendedMessageContext) {
    const name = _getFakeName(context.senderId);
    const user = await this.userRepo.getUser(context.clientId());

    this.cashoutService.unlockAccount(user);

    await Promise.all([
      context.editMessage({
        message: `${emoji.white_check_mark} Администратор ${name} разблокировал ваш баланс`
      }),
      this.userRepo.updateUser(user)
    ]);
  }

  @Handle([FromAdminCondition(), BasicCondition(["/скор"])])
  async score(context: ExtendedMessageContext) {
    const user = await this.userRepo.getUser(context.clientId());

    const data = await this.cashoutService.scoreUser(user);

    await context.reply(`${emoji.crystal_ball} Скоринг: ${data.score}
    
${JSON.stringify(data)}`);
  }
}
