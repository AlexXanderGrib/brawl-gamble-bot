import { MembersService } from "@app/services/members.service";
import { UsersRepository } from "@app/services/repositories/users.repo";
import { AutoSkipCondition } from "@pres/shared/auto-skip.condition";
import { UseRouteCondition } from "@pres/shared/use-route.condition";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { createTMatcher } from "@xxhax/match";
import { BotController, Handle } from "src/bot";
import { BotAPI, container } from "src/config";
import type { ExtendedMessageContext } from "src/context";
import { API, Keyboard } from "vk-io";
import { GamesMenuButton } from "./games.shared";
import { TopRoutes } from "./top.shared";

@container.ProvideClass()
export class TopController extends BotController {
  @container.InjectGetter(UsersRepository)
  private readonly usersRepo!: UsersRepository;

  @container.InjectGetter(BotAPI)
  private readonly api!: API;

  @container.InjectGetter(MembersService)
  private readonly ms!: MembersService;

  @Handle([AutoSkipCondition(), UseRouteCondition(TopRoutes.Top)])
  async top(context: ExtendedMessageContext) {
    const top = await this.usersRepo.getTop();
    const users = await this.api.users.get({
      user_ids: top.map(record => record.user_id.toString())
    });

    const dons: number[] = [];

    for await (const [batch] of this.ms.getAll({ filter: "donut" })) {
      dons.push(...batch);
    }

    let text = "";

    top.forEach(({ user_id, rank, game_balance }, idx) => {
      const user = users.find(u => u.id === user_id);
      const mention = user
        ? `@id${user.id} (${user.first_name} ${user.last_name})`
        : `@id${user_id}`;
      const isDon = dons.includes(user_id);
      const sign = isDon ? " " + emoji.doughnut : "";

      const placeIndex = idx + 1;

      const place =
        (createTMatcher({
          1: emoji["1st_place_medal"],
          2: emoji["2nd_place_medal"],
          3: emoji["3rd_place_medal"]
        })(placeIndex) as string | undefined) || String(placeIndex);

      text += `${place} место - ${mention}${sign} c ${game_balance} и ${emoji.eagle} ${rank} ур.\n`;
    });

    await context.send(
      `${emoji.trophy} Топ игроков:
  
${text.trim()}

${
  emoji.abacus
} Формула: <очки опыта> * <игровой баланс> + <время с момента регистрации> / <часы неактива в боте>

${
  emoji.doughnut
} - Значит что человек оформил подписку VK Donut группе. Это никак не влияет на позицию в топе`,
      {
        keyboard: autoKeyboard({
          inline: context.supportsInlineKeyboard(),
          keyboard: Keyboard.keyboard([[GamesMenuButton()]])
        })
      }
    );
  }
}
