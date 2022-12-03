import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const WorkRoutes = {
  Menu: new Route({
    command: "work",
    name: `${emoji.hammer_and_pick} Работа`,
    digits: "04",
    textAliases: ["работа"],
    requiredModules: ["game"]
  }),
  Work: new Route({
    command: "work:mine",
    name: ``,
    requiredModules: ["game"]
  }),
  End: new Route({
    command: "work:end",
    name: `${emoji.arrow_left} Закончить`,
    requiredModules: ["game"]
  }),
  HowTo: new Route({
    command: "work:how-to",
    name: `${emoji.question} Как играть?`,
    requiredModules: ["game"]
  })
};

export function WorkMenuButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return WorkRoutes.Menu.toButton(color);
}

export function WorkMineButton({ label = "" } = {}) {
  return WorkRoutes.Work.toButton(Keyboard.PRIMARY_COLOR, {
    label: `${emoji.pick} ${label}`.trim(),
    payload: { type: "mine" }
  });
}

export function WorkTrapButton() {
  return WorkRoutes.Work.toButton(Keyboard.NEGATIVE_COLOR, {
    label: emoji.bomb,
    payload: { type: "trap" }
  });
}

export function WorkHowToButton() {
  return WorkRoutes.HowTo.toButton();
}

export function WorkEndButton() {
  return WorkRoutes.End.toButton();
}
