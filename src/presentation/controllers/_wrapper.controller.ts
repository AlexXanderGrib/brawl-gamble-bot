import type { IBillsService } from "@app/interfaces/bills.service.interface";
import { AchievementNotificationService } from "@app/services/achievement-notification.service";
import { CacheService } from "@app/services/cache.service";
import { CashoutService } from "@app/services/cashout.service";
import { ConfigService } from "@app/services/config.service";
import { NotificationService } from "@app/services/notifications.service";
import { DonatePayBillsService } from "@app/services/payments/donatepay-bills.service";
import { ReplenishmentsService } from "@app/services/replenishments.service";
import { UsersRepository } from "@app/services/repositories/users.repo";
import { DiamondCurrency, GameCurrency, RealCurrency } from "@domains/currency";
import { Notification } from "@domains/notifications";
import type { ReplenishmentEntity } from "@domains/replenishments";
import type { UserEntity } from "@domains/users";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { container, logger } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import type { IMessageContextSendOptions } from "vk-io";

function _wrapperGetNext(_next: CallableFunction) {
  let next: CallableFunction;

  {
    const tn = "Wrapper: Impact time";

    console.time(tn);
    next = () => {
      console.timeEnd(tn);
      return _next();
    };
  }
  return next;
}

@container.ProvideClass()
export class _WrapperController extends BotController {
  @container.InjectGetter(UsersRepository)
  private readonly usersRepo!: UsersRepository;

  @container.InjectGetter(NotificationService)
  private readonly notification!: NotificationService;

  @container.InjectGetter(AchievementNotificationService)
  private readonly ans!: AchievementNotificationService;

  @container.InjectGetter(CacheService)
  private readonly cacheService!: CacheService;

  @container.InjectGetter(ReplenishmentsService)
  private readonly replenishmentsService!: ReplenishmentsService;

  @container.InjectGetter(CashoutService)
  private readonly cashoutService!: CashoutService;

  @container.InjectGetter(ConfigService)
  private readonly configService!: ConfigService;

  @container.InjectGetter(DonatePayBillsService)
  private readonly dp!: IBillsService;

  private async _registerUser(id: number) {
    const key = "is_registered";
    const cash = this.cacheService.forUser(id);

    const hasRecord = await cash.get(key);
    if (hasRecord) return false as const;

    const user = await this.usersRepo.getUser(id);
    await cash.set(key, "true");

    return user;
  }

  private _sendGreetingMessage(
    context: ExtendedMessageContext,
    user: UserEntity
  ) {
    const greetingAmount = 10;

    user.game_balance.add(greetingAmount);

    return context.reply(
      `Привет, я бот, который работает в этой группе.
    Все мои сообщения начинаются с ${
      emoji.robot_face
    }. Если этого смайла нет, значит пишет
    администратор. Продолжая диалог с группой, ты принимаешь наше пользовательское соглашение (ссылка в группе).
    \\n\\n
    ${emoji.star} Кстати, я тебе начислил ${new GameCurrency(
        greetingAmount
      )} игрового баланса, чтобы ты мог(-ла) пооткрывать кейсы.
    А ещё, если ты на нас подпишешься, то получишь ${DiamondCurrency.sign}
  `
        .replace(/\n/g, "")
        .replace(/\\n/g, "\n"),
      {
        keyboard: autoKeyboard({ inline: context.supportsInlineKeyboard() })
      }
    );
  }

  private async _checkAndShowReplenishment(user: UserEntity) {
    console.log(`Checking replenishments for user: #${user.user_id}`);
    const replenishment = await this.replenishmentsService.redeemOneForUser(
      user,
      (referrer, amount, share) =>
        this._notifyReferrerAboutReplenishment(user, amount, share, referrer)
    );

    if (replenishment) {
      console.log(
        `FOUND REPLENISHMENT (${replenishment.amount} RUB): #${user.user_id}`
      );

      await Promise.all([
        this.notification.deliver(
          new Notification(
            `Ваш баланс пополнен на ${new RealCurrency(
              replenishment.amount
            )} через ${replenishment.type.toUpperCase()} (ID: ${
              replenishment.id
            })`,
            user.user_id
          )
        ),
        this.notification.deliverToAdmins(
          new Notification(
            `@all Баланс @id${user.user_id} пополнен на ${new RealCurrency(
              replenishment.amount
            )} через ${replenishment.type.toUpperCase()} (ID: ${
              replenishment.id
            })`,
            []
          )
        )
      ]);
    }

    return replenishment;
  }

  private async _notifyReferrerAboutReplenishment(
    user: UserEntity,
    amount: number,
    share: number,
    referrer: UserEntity
  ) {
    const text = `Ваш друг @id${
      user.user_id
    } пополнил баланс на ${new RealCurrency(
      amount
    )}. Вы получаете ${new DiamondCurrency(share)}`;

    const notification = new Notification(text, referrer.user_id);
    await this.notification.deliver(notification);
  }

  private _patchContextMethods(context: ExtendedMessageContext) {
    const send = context.send.bind(context);
    const reply = context.reply.bind(context);

    const prefix = `${emoji.robot_face} `;
    type Params = [
      text: string | IMessageContextSendOptions,
      params?: IMessageContextSendOptions | undefined
    ];

    const normalize = (
      ...[message, params = {}]: Params
    ): IMessageContextSendOptions =>
      typeof message === "string"
        ? { ...params, message }
        : { ...params, ...message };

    const patch = (...[message, params = {}]: Params) => {
      const base = normalize(message, params);
      if (base.message && !base.message.startsWith(prefix))
        base.message = `${prefix}${base.message}`;
      return base;
    };

    context.reply = (...[message, params]: Params) =>
      reply(patch(message, params));

    context.send = (...[message, params]: Params) =>
      send(patch(message, params));
  }

  @Handle([() => true])
  @logger.PerfAsync()
  async wrapper(context: ExtendedMessageContext, _next: CallableFunction) {
    if (context.isOutbox && context.text?.startsWith(emoji.robot_face)) return;

    const next: CallableFunction = _wrapperGetNext(_next);
    this._patchContextMethods(context);

    const ref = await this._initUser(context);

    try {
      await next();

      const updateUser = await this._wrapperAftermath(ref.user);
      ref.updateUser = ref.updateUser || updateUser;

      await ref.doUpdate();
    } catch (error) {
      await this._notifyAdminsAboutError(error, context);
    }
  }

  private async _initUser(context: ExtendedMessageContext) {
    const id = context.clientId();
    const cache = this.cacheService.forUser(id);
    const repo = this.usersRepo;
    const currentActivityKey = "current_activity";
    const [user, currentActivity] = await Promise.all([
      this._registerUser(id),
      cache.get(currentActivityKey)
    ]);

    const ref = {
      user,
      updateUser: false,

      async doUpdate() {
        if (this.user && this.updateUser) {
          await repo.updateUser(this.user);
        }

        if (context.currentActivity !== currentActivity) {
          await cache.set(currentActivityKey, context.currentActivity);
        }
      }
    };

    context.currentActivity = currentActivity;
    context.enabledModules = this.configService.enabledModules;

    if (
      user &&
      user.registered_now &&
      context.enabledModules.includes("game")
    ) {
      await this._sendGreetingMessage(context, user);
      ref.updateUser = true;
    }

    context.user = async forUpdate => {
      if (!ref.updateUser && forUpdate) ref.updateUser = true;
      if (user) return user;

      return (ref.user = await this.usersRepo.getUser(id));
    };

    return ref;
  }

  private async _notifyAdminsAboutError(
    error: any,
    context: ExtendedMessageContext
  ) {
    await this.notification.deliverToAdmins(
      new Notification(
        `У @id${context.clientId()} вылезла ошибка: 
${error instanceof Error ? error.stack : String(error)}

${error}
        
${emoji.scroll} Текст сообщения: "${context.text}"`,
        []
      )
    );
  }

  private async _wrapperAftermath(user: UserEntity | false) {
    if (this.dp.isAvailable) {
      await this.fetchDPTransactions();
    }

    if (user) {
      const replenishment = await this._checkAndShowReplenishment(user);
      if (replenishment) {
        this.cashoutService.unlockAccount(user);
        await this._checkAndUnlockRichBitch(replenishment, user);
        return true;
      }
    }

    return false;
  }

  private async fetchDPTransactions() {
    const dpTransactions = await this.dp.getRecentTransactions();

    for (const tr of dpTransactions) {
      await this.replenishmentsService.add({
        amount: tr.amount,
        type: "other",
        user_id: tr.user_id,
        id: tr.id
      });
    }
  }

  private async _checkAndUnlockRichBitch(
    replenishment: ReplenishmentEntity,
    user: UserEntity
  ) {
    await this.ans.conditionallyUnlockAndNotify(user, {
      rich_bitch: replenishment.amount > 20
    });
  }
}
