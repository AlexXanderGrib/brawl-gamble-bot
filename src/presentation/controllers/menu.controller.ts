import { ConfigService } from "@app/services/config.service";
import { NotificationService } from "@app/services/notifications.service";
import { UsersRepository } from "@app/services/repositories/users.repo";
import { DiamondCurrency, GameCurrency } from "@domains/currency";
import { Notification } from "@domains/notifications";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { ca } from "@pres/shared/conditional-add";
import { ModulesCondition } from "@pres/shared/modules.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { measure } from "@xxhax/time";
import { BotController, Handle } from "src/bot";
import { container, logger } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { IKeyboardProxyButton, Keyboard } from "vk-io";
import { UseRouteCondition } from "../shared/use-route.condition";
import {
  AdminDonsButton,
  AdminPublishFreeAccButton,
  AdminRoutes,
  AdminStealMemeButton
} from "./admin.shared";
import { BalanceBalanceButton, BalanceRoutes } from "./balance/balance.shared";
import {
  AchievementsMenuButton,
  AchievementsRoutes
} from "./games/achievements.shared";
import { GamesMenuButton, GamesRoutes } from "./games/games.shared";
import { TopRoutes, TopTopButton } from "./games/top.shared";
import { MarketListButton, MarketRoutes } from "./market.shared";
import { MenuRoutes } from "./menu.shared";
import { MiscMenuButton, MiscRoutes } from "./misc/misc.shared";
import { ReferralMenuButton, ReferralRoutes } from "./misc/referral.shared";

@container.ProvideClass()
export class MenuController extends BotController {
  @container.InjectGetter(ConfigService)
  private readonly config!: ConfigService;

  @container.InjectGetter(UsersRepository)
  private readonly usersRepo!: UsersRepository;

  @container.InjectGetter(NotificationService)
  private readonly notification!: NotificationService;

  @logger.PerfAsync()
  private async _trackRef(context: ExtendedMessageContext) {
    const referrer = parseInt(context.referralValue || "");

    if (!referrer) return;

    const [userData, userEntity] = await Promise.all([
      context.getUser(),
      context.user(true)
    ]);

    const mention = `@id${userData.id} (${userData.first_name} ${userData.last_name})`;

    const isReferrerUpdated = await this.usersRepo.setReferrer(
      userEntity,
      referrer
    );

    if (!isReferrerUpdated) {
      await this.notification.deliver(
        new Notification(
          `${mention} перешёл по вашей пригласительной ссылке!\n${emoji.sad_but_relieved_face} Но к сожалению, его изначально пригласили не вы, поэтому вы не получите с него никаких бонусов`,
          referrer
        )
      );

      return;
    }

    const referrerEntity = await this.usersRepo.getUser(referrer);

    if (referrerEntity.user_id === userEntity.user_id) {
      userEntity.diamond_balance.add(2);

      await this.notification.deliver(
        new Notification(
          `${
            emoji.cat_face
          } Ах ты маленький хитрец. Думал ты получишь с приглашения самого себя ${new DiamondCurrency(
            3
          )}!?
        
В общем, держи ${new DiamondCurrency(2)}, и больше не жульничай!`,
          userEntity.user_id
        )
      );

      return;
    }

    userEntity.diamond_balance.add(5);
    referrerEntity.diamond_balance.add(3);

    await this.notification.deliver(
      new Notification(
        `${
          emoji.ghost
        } ${mention} перешёл по вашей реферальной ссылке! Вы получаете ${new DiamondCurrency(
          3
        )} и будете получать % с его пополнений баланса!`,
        referrer
      )
    );

    await this.usersRepo.updateUser(referrerEntity);
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(MenuRoutes.Menu)])
  @logger.PerfAsync()
  async menu(context: ExtendedMessageContext) {
    context.currentActivity = "menu";
    await measure("Menu: Response Plain Text", () =>
      context.reply(
        ` Привет ${emoji.hand}!
      
Вот моё меню:

${MenuRoutes.Menu}
${BalanceRoutes.Balance} - Посмотреть баланс${
          context.enabledModules.includes("game") ? `, пополнить / вывести` : ""
        }

${
  context.enabledModules.includes("market")
    ? `${MarketRoutes.Menu} - Купить / продать
└ ${MarketRoutes.List}`
    : ""
}

${
  context.enabledModules.includes("game")
    ? `${GamesRoutes.Menu} - Заработать ${GameCurrency.sign}
└ ${TopRoutes.Top} 
└ ${AchievementsRoutes.Menu}

${ReferralRoutes.Menu} - Пригласить друзей и получить ${DiamondCurrency.sign}`
    : ""
}

${MiscRoutes.Menu}`,
        {
          keyboard: Keyboard.keyboard([
            [BalanceBalanceButton()],
            ...ca(
              [
                context.enabledModules.includes("game"),
                [GamesMenuButton({ color: Keyboard.POSITIVE_COLOR })]
              ],
              [
                context.enabledModules.includes("game"),
                [AchievementsMenuButton(), TopTopButton()]
              ],
              [
                context.enabledModules.includes("market"),
                [MarketListButton({ label: "Товары" })]
              ],
              [
                context.enabledModules.includes("game"),
                [ReferralMenuButton(), MiscMenuButton()]
              ],
              [!context.enabledModules.includes("game"), [MiscMenuButton()]]
            )
          ])
        }
      )
    );

    await this._trackRef(context);

    if (this.config.isPermitted(context.clientId())) {
      const buttons: (IKeyboardProxyButton | IKeyboardProxyButton[])[] = [];

      if (ModulesCondition(AdminRoutes.StealMeme.requiredModules)(context)) {
        buttons.push(AdminStealMemeButton());
      }

      if (
        ModulesCondition(AdminRoutes.PublishFreeAcc.requiredModules)(context)
      ) {
        buttons.push(AdminPublishFreeAccButton());
      }
      await context.send(`Меню админа:`, {
        keyboard: Keyboard.keyboard([...buttons, AdminDonsButton()]).inline()
      });
    }
  }

  @Handle([AutoSkipCondition(), UseRouteCondition(MenuRoutes.Menu)])
  async migrate(context: ExtendedMessageContext) {
    const storage = context.storage();

    const keys = await storage.getKeys();
    const keyboard = autoKeyboard({ inline: context.supportsInlineKeyboard() });

    if (!keys.includes("game_balance")) {
      await context.reply(`${emoji.stop_sign} Перенос данных невозможен`, {
        keyboard
      });
      return;
    }

    await context.reply(`${emoji.recycle} Переношу ваш старый баланс`);

    const user = await context.user(true);
    const { balance, game_balance, special_balance } = await storage.getFields(
      "balance",
      "game_balance",
      "special_balance"
    );

    if (balance) {
      let value = 0;

      try {
        const b = JSON.parse(balance);
        value = b.value;
      } catch {
        value = 0;
      }

      user.deposit_balance.push(value);
    }

    if (game_balance) {
      let value = 0;

      try {
        const b = JSON.parse(game_balance);
        value = b.value;
      } catch {
        value = 0;
      }

      user.game_balance.push(value);
    }

    if (special_balance) {
      let value = 0;

      try {
        const b = JSON.parse(special_balance);
        value = b.value;
      } catch {
        value = 0;
      }

      user.diamond_balance.push(value);
    }

    await storage.sync({
      special_balance: "",
      balance: "",
      game_balance: ""
    });

    await context.send(
      `${emoji.check_mark_button} Данные вашего баланса синхронизированы. Перенос остальных аспектов невозможен из-за изменения их ценности ввиду последних обновлений`,
      { keyboard }
    );
  }
}
