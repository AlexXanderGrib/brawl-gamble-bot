import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";

export const TopRoutes = {
  Top: new Route({
    command: "top",
    name: `${emoji.trophy} Топ`,
    digits: "34",
    textAliases: ["топ"],
    requiredModules: ["game"]
  })
};

export function TopTopButton() {
  return TopRoutes.Top.toButton();
}
