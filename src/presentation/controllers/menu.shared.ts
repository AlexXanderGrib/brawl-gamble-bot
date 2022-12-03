import { emoji } from "@xxhax/emoji";
import { Route } from "../shared/route";

export const MenuRoutes = {
  Menu: new Route({
    name: `${emoji.arrow_left} Меню`,
    command: "menu",
    commandsAliases: ["start"],
    digits: "00",
    textAliases: ["меню", "начать", "команды", "+", '"+"']
  }),

  Migrate: new Route({
    name: `${emoji.recycle} Перенос`,
    command: "migrate",
    textAliases: ["перенос"],
    requiredModules: ["game"]
  })
};

export function MenuButton() {
  return MenuRoutes.Menu.toButton();
}
