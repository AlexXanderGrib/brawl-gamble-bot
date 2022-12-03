import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const GamesRoutes = {
  Menu: new Route({
    command: "games:menu",
    name: `${emoji.video_game} Мини-Игры`,
    digits: "22",
    textAliases: ["играть"],
    requiredModules: ["game"]
  })
};

export function GamesMenuButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return GamesRoutes.Menu.toButton(color);
}
