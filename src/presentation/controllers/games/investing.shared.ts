import { GameCurrency } from "@domains/currency";
import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export const InvestingRoutes = {
  Menu: new Route({
    command: "investing:menu",
    name: `${emoji.chart_increasing} Инвестиции`,
    digits: "40",
    textAliases: ["инвестиции"],
    requiredModules: ["game"]
  }),
  Invest: new Route({
    command: "investing:invest",
    textAliases: ["инвестировать"],
    digits: "41",
    name: `${GameCurrency.sign} ${emoji.arrow_up} Инвестировать`,
    requiredModules: ["game"]
  }),
  Buy: new Route({
    command: "investing:buy",
    name: ``,
    requiredModules: ["game"]
  }),
  ChooseAmount: new Route({
    command: "investing:choose-amount",
    name: ``,
    requiredModules: ["game"]
  }),
  CollectProfit: new Route({
    command: "investing:collect-profit",
    name: `${emoji.money_mouth_face} Собрать Доход`,
    digits: "42",
    requiredModules: ["game"]
  })
};

export function InvestingMenuButton({
  color = Keyboard.SECONDARY_COLOR as ButtonColor | ButtonColorUnion
} = {}) {
  return InvestingRoutes.Menu.toButton(color);
}

export function InvestingInvestButton() {
  return InvestingRoutes.Invest.toButton(Keyboard.PRIMARY_COLOR);
}

export function InvestingChooseAmountButton({
  label,
  id,
  chooses = [1, 2, 3, 5, 8, 10]
}: {
  label: string;
  id: string;
  chooses?: number[];
}) {
  return InvestingRoutes.ChooseAmount.toButton(Keyboard.PRIMARY_COLOR, {
    label,
    payload: { chooses, id }
  });
}

export function InvestingBuyButton({
  label,
  id,
  count = 1
}: {
  label: string;
  id: string;
  count?: number;
}) {
  return InvestingRoutes.Buy.toButton(Keyboard.PRIMARY_COLOR, {
    label,
    payload: { id, count }
  });
}

export function InvestingCollectProfitButton() {
  return InvestingRoutes.CollectProfit.toButton(Keyboard.NEGATIVE_COLOR);
}
