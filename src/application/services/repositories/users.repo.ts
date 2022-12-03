import {
  DiamondCurrency,
  GameCurrency,
  RealCurrency,
  XPCurrency
} from "@domains/currency";
import type { UserEntity } from "@domains/users";
import { Balance, IBalance, ICurrencyConstructor } from "@xxhax/bablo";
import { container, GroupID, logger } from "src/config";
import { SQLService } from "../db/sql.service";

function parseBalance(data: string, currency: ICurrencyConstructor) {
  const [income = 0, spent = 0] = data
    .slice(1, data.length - 1)
    .split(",")
    .map(str => parseFloat(str) || 0);

  return new Balance(income, spent).withCurrency(currency);
}

type DonatedRecord = {
  total: number;
  user_id: number;
  referrer?: number | null;
};

type UsersTopRecord = {
  user_id: number;
  game_balance: number;
  score: number;
  rank: number;
};

function makeUser(u: UserEntity): UserEntity {
  return {
    ...u,
    game_balance: parseBalance(u.game_balance.toString(), GameCurrency),
    deposit_balance: parseBalance(u.deposit_balance.toString(), RealCurrency),
    diamond_balance: parseBalance(
      u.diamond_balance.toString(),
      DiamondCurrency
    ),
    rank_points: new Balance(parseInt(u.rank_points.toString())).withCurrency(
      XPCurrency
    )
  };
}

@container.ProvideClass()
export class UsersRepository {
  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(SQLService)
  private readonly db!: SQLService;

  async getReferrals(referrerId: number): Promise<number[]> {
    const queryResult = await this.db.client.query<UserEntity>(
      "SELECT user_id FROM users WHERE referrer = $1 AND group_id = $2",
      [referrerId, this.groupId]
    );

    return queryResult.rows.map(entity => entity.user_id);
  }

  @logger.PerfAsync()
  async getUser(
    id: number
  ): Promise<UserEntity & { registered_now?: boolean }> {
    const queryResult = await this.db.client.query<UserEntity>(
      "SELECT * FROM users WHERE user_id = $1 AND group_id = $2",
      [id, this.groupId]
    );
    const [user] = queryResult.rows;

    if (user) return makeUser(user);

    const insertResult = await this.db.client.query<UserEntity>(
      "INSERT INTO users(group_id, user_id) VALUES($1, $2) RETURNING *",
      [this.groupId, id]
    );

    return {
      ...makeUser(insertResult.rows[0] as UserEntity),
      registered_now: true
    };
  }

  @logger.PerfAsync()
  async updateUser(user: UserEntity) {
    const { user_id, group_id } = user;

    const bts = (balance: IBalance) => `(${balance.income}, ${balance.spent})`;

    const {
      rows: [result]
    } = await this.db.client.query<UserEntity>(
      `UPDATE users SET
    
  deposit_balance = $3,
  diamond_balance = $4,
  game_balance = $5,
  data = $6,
  achievements = $7,
  subscriptions = $8,
  rank_points = $9,
  last_recorded_rank = $10,
  last_active = current_timestamp
    
WHERE user_id = $1 AND group_id = $2 RETURNING *`,
      [
        user_id,
        group_id,
        bts(user.deposit_balance.flat()),
        bts(user.diamond_balance.flat()),
        bts(user.game_balance.flat()),
        user.data,
        user.achievements,
        user.subscriptions,
        user.rank_points.value,
        user.last_recorded_rank
      ]
    );

    return {
      ...result,
      user_id,
      group_id
    } as UserEntity;
  }

  async setReferrer(user: UserEntity, referrerId: number) {
    if (user.referrer) return false;

    await this.db.client.query(
      `UPDATE users SET referrer = $1 WHERE user_id = $2 AND group_id = $3`,
      [referrerId, user.user_id, this.groupId]
    );

    return true;
  }

  async getDonatedUsers(limit = 100) {
    const response = await this.db.client.query<DonatedRecord>(
      `
      SELECT
        sum(r.amount) as total,
        u.user_id as user_id,
        u.referrer as referrer
      FROM users u
      RIGHT JOIN replenishments r
      ON u.user_id = r.user_id AND u.group_id = r.group_id
      WHERE u.group_id = $1
      GROUP BY u.user_id, u.referrer
      ORDER BY total DESC
      LIMIT $2;
    `,
      [this.groupId, limit]
    );

    return response.rows;
  }

  async getTop(limit = 10, { minBalance = 0, minRank = 0 } = {}) {
    const response = await this.db.client.query<UsersTopRecord>(
      `      
        SELECT
          user_id,
          balance as game_balance,
          rank,
          ((rank_points * (|/ balance) + existence_hours * 10) / (inactive_hours + 1))::bigint as score
        FROM (
          SELECT
            user_id,
            (game_balance).income - (game_balance).spent as balance,
            last_recorded_rank as rank,
            rank_points,
            (extract(epoch from current_timestamp - last_active) / 3600)::integer as inactive_hours,
            (extract(epoch from current_timestamp - registration_date) / 3600)::integer as existence_hours
          FROM users   
          WHERE last_recorded_rank > $2 AND group_id = $1
        ) as ss
        WHERE balance > $3
        ORDER BY score DESC
        LIMIT $4;
      `,
      [this.groupId, minRank, minBalance, limit]
    );

    return response.rows.map(row => ({
      user_id: row.user_id,
      game_balance: new Balance(row.game_balance).withCurrency(GameCurrency),
      rank: row.rank
    }));
  }
}
