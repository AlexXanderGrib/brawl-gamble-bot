import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";

export const AchievementsRoutes = {
  Menu: new Route({
    command: "achievements",
    name: `${emoji.lock} Достижения`,
    textAliases: ["достижения", "ачивки"],
    digits: "05",
    requiredModules: ["game"]
  })
};

export function AchievementsMenuButton() {
  return AchievementsRoutes.Menu.toButton();
}
