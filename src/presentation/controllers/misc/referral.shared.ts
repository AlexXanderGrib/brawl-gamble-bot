import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";

export const ReferralRoutes = {
  Menu: new Route({
    command: "referral",
    name: `${emoji.busts_in_silhouette} Друзья`,
    digits: "08",
    textAliases: ["рефералка", "привести друзей", "друзья"],
    requiredModules: ["game"]
  })
};

export function ReferralMenuButton() {
  return ReferralRoutes.Menu.toButton();
}
