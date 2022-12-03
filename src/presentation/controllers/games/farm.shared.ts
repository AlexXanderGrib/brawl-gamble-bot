import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const FarmRoutes = {
  Menu: new Route({ command: "farm:menu", name: `${emoji.farmer} Ферма` })
};

export function FarmMenuButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return FarmRoutes.Menu.toButton(color);
}
