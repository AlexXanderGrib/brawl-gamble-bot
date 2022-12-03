import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { Keyboard } from "vk-io";

export const DataMiningRoutes = {
  Menu: new Route({
    command: "data-mining:menu",
    name: `${emoji.computer_disk} Дата-Майнинг`,
    digits: "35",
    requiredModules: ["game"]
  }),
  Location: new Route({
    command: "data-mining:set-location",
    name: ``,
    requiredModules: ["game"]
  })
};

export function DataMiningMenuButton() {
  return DataMiningRoutes.Menu.toButton();
}

export function DataMiningSetLocationButton() {
  return Keyboard.locationRequestButton({
    payload: {
      command: DataMiningRoutes.Location.command
    }
  });
}
