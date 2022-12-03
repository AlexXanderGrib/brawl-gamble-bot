import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { Keyboard } from "vk-io";

export const SubscriptionsRoutes = {
  Menu: new Route({
    name: `${emoji.mailbox_with_mail} Подписки и Рассылки`,
    command: "subscriptions:menu",
    digits: "20",
    textAliases: ["подписки"]
  }),
  SubAds: new Route({
    command: "subscriptions:subscribe-to-ads",
    name: `${emoji.check_mark_button} Подписаться на Рекламную рассылку`,
    textAliases: ["подписаться на рекламную рассылку"]
  }),
  UnSubAds: new Route({
    command: "subscriptions:unsubscribe-to-ads",
    name: `${emoji.cross_mark_button} Отписаться от Рекламной рассылки`,
    textAliases: ["отписаться от рекламной рассылки"]
  })
};

export function SubscriptionsMenuButton() {
  return SubscriptionsRoutes.Menu.toButton();
}

export function SubscriptionsSubscribeAdsButton() {
  return SubscriptionsRoutes.SubAds.toButton(Keyboard.POSITIVE_COLOR);
}

export function SubscriptionsUnsubscribeAdsButton() {
  return SubscriptionsRoutes.UnSubAds.toButton(Keyboard.NEGATIVE_COLOR);
}
