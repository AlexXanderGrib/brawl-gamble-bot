import { MenuRoutes } from "@pres/controllers/menu.shared";
import { Keyboard } from "vk-io";

export function autoKeyboard({
  keyboard = Keyboard.builder(),
  inline = true
} = {}) {
  return keyboard
    .row()
    .textButton({
      label: MenuRoutes.Menu.name,
      color: Keyboard.SECONDARY_COLOR,
      payload: { command: MenuRoutes.Menu.command }
    })
    .inline(inline)
    .oneTime(!inline);
}
