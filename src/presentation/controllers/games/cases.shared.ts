import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const CasesRoutes = {
  List: new Route({
    command: "cases:list",
    digits: "02",
    textAliases: ["кейсы"],
    name: `${emoji.package} Кейсы`,
    requiredModules: ["game"]
  }),
  View: new Route({
    command: "cases:view",
    name: ``,
    requiredModules: ["game"]
  }),
  Open: new Route({
    command: "cases:open",
    name: `${emoji.key} Открыть`,
    requiredModules: ["game"]
  })
};

export function CasesListButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return CasesRoutes.List.toButton(color);
}

export function CaseViewButton({ label, id }: { label: string; id: string }) {
  return CasesRoutes.View.toButton(Keyboard.SECONDARY_COLOR, {
    label,
    payload: { id }
  });
}

export function CaseOpenButton({
  id,
  price,
  label = "Открыть"
}: {
  id: string;
  price: string;
  label?: string;
}) {
  return CasesRoutes.Open.toButton(Keyboard.POSITIVE_COLOR, {
    label: `${emoji.key} ${label} (${price})`,
    payload: { id }
  });
}
