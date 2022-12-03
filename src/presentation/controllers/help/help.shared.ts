import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";

export const HelpRoutes = {
  Help: new Route({
    command: "help",
    name: `${emoji.hand} Помощь`,
    textAliases: ["помощь"],
    digits: "31"
  })
};

export function HelpHelpButton() {
  return HelpRoutes.Help.toButton();
}
