import { PercentCurrency } from "@domains/currency";
import type { PaymentSystemNames } from "@domains/payments";
import type { UserEntity } from "@domains/users";
import { Balance } from "@xxhax/bablo";
import { container } from "src/config";
import { CashoutsRepository } from "./repositories/cashouts.repo";
import { UsersRepository } from "./repositories/users.repo";

type ScoreableUser = {
  id: number;
  hoursSinceReg: number;
  cashouts: {
    total: number;
    count: number;
    accounts: [PaymentSystemNames, string][];
  };
  donated: number;
  refsCount: number;
  placeInTop?: number;
  rankPoints: number;
  referrer?: number;

  knowledge: {
    phone?: string;
    location?: {
      latitude: number;
      longitude: number;
      title?: string;
    };
  };
};

function score(u: ScoreableUser) {
  const score = new Balance().withCurrency(PercentCurrency);

  if (u.refsCount > 0) {
    score.add(Math.min(u.refsCount, 15), "HAS-REFERRALS");
  }

  if (u.referrer) {
    score.push(u.referrer === u.id ? -10 : +5, "HAS-REFERRER");
  }

  if (u.placeInTop) {
    score.add(10, "IN-TOP");
  }

  if (u.donated) {
    score.add(10, "DONATED");
    score.add(Math.min(Math.floor(u.donated / 10), 30), "DONATED:AMOUNT");
  }

  if (u.hoursSinceReg > 24 * 7) {
    score.add(5, "OLD-PLAYER");
    score.add(
      Math.min(Math.floor(u.hoursSinceReg / 10), 5),
      "OLD-PLAYER:HOURS"
    );
  }

  if (u.cashouts.count > 0) {
    score.subtract(Math.min(u.cashouts.count, 5), "CASHOUTS");
    score.subtract(
      Math.min(Math.ceil(u.cashouts.total / 10), 20),
      "CASHOUTS:AMOUNT"
    );
  }

  if (u.rankPoints > 30000) {
    score.add(Math.min(Math.ceil(u.rankPoints / 1000), 10), "HAS-MED-RANK");
  }

  if (u.knowledge.location) {
    score.add(3, "KNOWN:LOCATION");
  }

  if (u.knowledge.phone) {
    score.add(2, "KNOWN:PHONE");
  }

  return score;
}

@container.ProvideClass()
export class ScoringService {
  @container.InjectGetter(UsersRepository)
  private readonly usersRepo!: UsersRepository;
  @container.InjectGetter(CashoutsRepository)
  private readonly cashoutsRepo!: CashoutsRepository;
  public async scoreUser({
    registration_date,
    data,
    user_id,
    referrer,
    rank_points
  }: UserEntity) {
    const [dons, top, referrals, stats] = await Promise.all([
      this.usersRepo.getDonatedUsers(),
      this.usersRepo.getTop(),
      this.usersRepo.getReferrals(user_id),
      this.cashoutsRepo.getPreviousCashoutsStats(user_id)
    ]);

    const placeInTop = (uid: number) => {
      const p = top.indexOf(top.find(u => u.user_id === uid) as any);

      return p === -1 ? undefined : p + 1;
    };

    const donatedAmount = (uid: number) =>
      dons.find(d => d.user_id === uid)?.total;

    const u: ScoreableUser = {
      cashouts: stats,
      donated: donatedAmount(user_id) ?? 0,
      placeInTop: placeInTop(user_id),
      refsCount: referrals.length,
      hoursSinceReg: Math.round(
        (Date.now() - registration_date.getTime()) / (3600 * 1000)
      ),
      rankPoints: rank_points.value,
      knowledge: {},
      referrer: referrer ?? undefined,
      id: user_id
    };

    if (data.location) {
      u.knowledge.location = {
        ...data.location.coordinates,
        title: data.location?.place?.title
      };
    }

    const phone = stats.accounts?.find(
      x => x[0] === "phone" || x[0] === "qiwi"
    )?.[1];

    if (phone) {
      u.knowledge.phone = phone;
    }

    return { ...u, score: score(u) };
  }
}
