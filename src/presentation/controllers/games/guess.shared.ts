import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const GuessRoutes = {
  Menu: new Route({
    command: "guess:menu",
    name: `${emoji.crystal_ball} Угадайка`,
    digits: "50",
    textAliases: ["угадайка"],
    requiredModules: ["game"]
  }),
  Play: new Route({
    command: "guess:play",
    name: `${emoji.crystal_ball} Играть`,
    requiredModules: ["game"],
    digits: "50 1",
    textAliases: ["угадать"]
  }),
  Setup: new Route({
    command: "guess:setup",
    name: `${emoji.gear} Настройки`,
    textAliases: [/.*/],
    requiredModules: ["game"],
    activities: ["guess:setup"]
  }),
  Guess: new Route({
    command: "guess:guess",
    name: `${emoji.joker}`,
    requiredModules: ["game"]
  })
};

export function GuessMenuButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return GuessRoutes.Menu.toButton(color);
}

export function GuessPlayButton() {
  return GuessRoutes.Play.toButton(Keyboard.POSITIVE_COLOR);
}

export function GuessGuessButton() {
  return GuessRoutes.Guess.toButton();
}
