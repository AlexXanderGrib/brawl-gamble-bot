import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { Keyboard } from "vk-io";

export const InfoRoutes = {
  Info: new Route({
    command: "info",
    textAliases: ["инфо"],
    digits: "10",
    name: `${emoji.information_desk_person} Информация`
  })
};

export function InfoInfoButton({ label = "" } = {}) {
  return InfoRoutes.Info.toButton(Keyboard.SECONDARY_COLOR, {
    label: label && `${emoji.information_desk_person} ${label}`
  });
}
