import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { Keyboard } from "vk-io";

export const SupportRoutes = {
  Menu: new Route({
    command: "support",
    name: `${emoji.speech_balloon} Поддержка`,
    textAliases: ["поддержка"],
    digits: "09"
  }),
  CallAdmins: new Route({
    command: "support:call-admins",
    name: `${emoji.bell} Запросить Администратора`
  })
};

export function SupportMenuButton() {
  return SupportRoutes.Menu.toButton();
}

export function SupportWriteButton({
  to,
  label = "Написать"
}: {
  to: string | number;
  label?: string;
}) {
  return Keyboard.urlButton({
    label: `${emoji.speech_balloon} ${label}`,
    url:
      typeof to === "string"
        ? `https://vk.me/${to}`
        : `https://vk.com/write${to}`
  });
}

export function SupportCallButton({ id }: { id: number }) {
  return Keyboard.urlButton({
    label: `${emoji.telephone_receiver} Позвонить`,
    url: `https://vk.com/call?id=${id}`
  });
}

export function SupportCallAdminsButton() {
  return SupportRoutes.CallAdmins.toButton(Keyboard.NEGATIVE_COLOR);
}
