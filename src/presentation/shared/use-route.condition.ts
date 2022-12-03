import type { ExtendedMessageContext } from "src/context";
import { ActivityCondition } from "./activity.condition";
import { BasicCondition } from "./basic.condition";
import { ModulesCondition } from "./modules.condition";
import type { TRoute } from "./route";

export function UseRouteCondition(route: TRoute) {
  const commands = [...(route.commandsAliases ?? [])];
  if (route.command) commands.unshift(route.command);

  const texts = [...(route.textAliases ?? [])];
  if (route.digits) texts.unshift(route.digits);

  return (context: ExtendedMessageContext) => {
    if (!BasicCondition(texts, commands)(context)) return false;

    if (
      route.requiredModules?.[0] &&
      !ModulesCondition(route.requiredModules)(context)
    ) {
      return false;
    }

    if (!route.activities?.[0]) return true;

    return route.activities.some(a => ActivityCondition(a)(context));
  };
}
