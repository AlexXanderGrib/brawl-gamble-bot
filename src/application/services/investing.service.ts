import { DiamondCurrency, GameCurrency } from "@domains/currency";
import { Inventory } from "@domains/inventory";
import { Investment } from "@domains/investments";
import type { UserEntity } from "@domains/users";
import type { Currency } from "@xxhax/bablo";
import { Config, container } from "src/config";
import { InventoryService } from "./inventory.service";

type InvestmentOwnView = {
  count: number;
  hourProfit: number;
  fullName: string;
};

type InvestmentPurchaseView = {
  hourProfit: number;
  fullName: string;
  price: Currency;
  id: string;
};

type ActivesStore = Record<string, number>;

type InvestingRecord = {
  actives: ActivesStore;
  last_collection_ts: number;
};

interface UserEntityTD extends UserEntity {
  data: {
    investing?: Partial<InvestingRecord>;
  } & Record<string, any>;
}

@container.ProvideClass()
export class InvestingService {
  private static readonly InventoryKey = "investment";

  @container.InjectGetter(Config)
  private readonly config!: Config;

  @container.InjectGetter(InventoryService)
  private readonly inventoryService!: InventoryService;

  private _assignInvestingProps({ data }: UserEntityTD): InvestingRecord {
    if (!data.investing) {
      data.investing = {};
    }

    if (!data.investing.last_collection_ts) {
      data.investing.last_collection_ts = Date.now();
    }

    if (!data.investing.actives) {
      data.investing.actives = {};
    }

    return data.investing as InvestingRecord;
  }

  private _getInvestments(user: UserEntity): InvestingRecord {
    const ref = this._assignInvestingProps(user);
    const inventory = this.inventoryService.of(user);
    let actives: ActivesStore;

    if (Object.keys(ref.actives).length > 0) {
      actives = ref.actives;
      ref.actives = {};
      this._updateActives(user, actives);
    } else {
      actives = inventory
        .subsetWithFn(key =>
          key.startsWith(InvestingService.InventoryKey + ":")
        )
        .renameWithFn(key =>
          key.substring(InvestingService.InventoryKey.length + 1)
        ).raw;
    }

    return { ...ref, actives };
  }
  private _updateActives(user: UserEntity, value: ActivesStore) {
    const ui = this.inventoryService.of(user);
    const ii = new Inventory(value).renameWithFn(
      key => `${InvestingService.InventoryKey}:${key}`
    );

    ui.setMultiple(ii.raw);
    const ref = this._assignInvestingProps(user);
    ref.actives = {};
  }
  private _updateCollectionDate(user: UserEntity) {
    const ref = this._assignInvestingProps(user);

    ref.last_collection_ts = Date.now();
  }

  getSummary(user: UserEntityTD, { fixUser = false } = {}) {
    const { actives, last_collection_ts } = this._getInvestments(user);

    const map = new Map<string, number>(Object.entries(actives));
    const available = this.getAll();
    const owned: InvestmentOwnView[] = [];
    let totalHourProfit = 0;
    let collectableProfit = 0;

    for (const [id, count] of map) {
      const current = available.find(x => x.id === id);

      if (!current || count < 1) {
        map.delete(id);
        continue;
      }

      collectableProfit +=
        current.calculateProfit(new Date(last_collection_ts)) * count;
      totalHourProfit += current.raw.profitPerHour * count;
      owned.push({
        count,

        fullName: `${current.raw.emoji} ${current.raw.name}`,
        hourProfit: current.raw.profitPerHour
      });
    }

    if (owned.length > 0 && fixUser) {
      this._updateActives(user, Object.fromEntries(map));
    }

    return {
      owned,
      totalHourProfit,
      collectableProfit,
      nextCollectionThreshold: Math.max(
        last_collection_ts + 3600 * 1000 - Date.now(),
        0
      )
    };
  }

  invest(user: UserEntityTD, investmentId: string, count = 1) {
    const current = this.getAll().find(x => x.id === investmentId);

    if (!current) {
      throw new Error("Данный актив недоступен для покупки (INVALID_ID)");
    }

    const totalPrice = current.raw.price * count;

    const primaryBalance = current.raw.isPriceGems
      ? user.diamond_balance
      : user.game_balance;

    if (!primaryBalance.isAffordable(totalPrice)) {
      const diff = primaryBalance
        .afterTransaction(-totalPrice)
        .map(value => Math.abs(value));

      throw new Error(
        `Недостаточно средств для покупки ${current.raw.name} x${count}. Нехватает: ${diff}`
      );
    }

    primaryBalance.subtract(totalPrice);

    const investing = this._getInvestments(user);

    this._updateActives(
      user,
      new Inventory(investing.actives).add(investmentId, count).raw
    );
  }

  collectProfit(user: UserEntityTD) {
    const { collectableProfit } = this.getSummary(user, { fixUser: true });

    if (collectableProfit > 0) {
      this._updateCollectionDate(user);
    }
    user.game_balance.add(collectableProfit);

    return collectableProfit;
  }

  getAll() {
    const investments: Investment[] = [];
    const ref = this.config.aspects?.investing ?? {};

    Object.keys(ref).forEach(id => {
      const value = new Investment({ id, ...ref[id as keyof typeof ref] });

      investments.push(value);
    });

    return investments;
  }

  getForPurchase(): InvestmentPurchaseView[] {
    return this.getAll().map(({ raw }) => ({
      id: raw.id,
      fullName: `${raw.emoji} ${raw.name}`,
      hourProfit: raw.profitPerHour,
      price: raw.isPriceGems
        ? new DiamondCurrency(raw.price)
        : new GameCurrency(raw.price)
    }));
  }
}
