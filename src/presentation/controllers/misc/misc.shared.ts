import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const MiscRoutes = {
  Menu: new Route({
    command: "misc:menu",
    name: `${emoji.gear} Дополнительно`,
    digits: "30",
    textAliases: ["ещё", "еще", "настройки", "дополнительно"]
  })
};

export function MiscMenuButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return MiscRoutes.Menu.toButton(color);
}
