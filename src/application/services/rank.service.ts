import type { UserEntity } from "@domains/users";
import type { IBalance } from "@xxhax/bablo";
import { random } from "@xxhax/safe-math";
import { container } from "src/config";

// Работа капание - 15 очк
// Кейс бомжа - 5 очк
// VIP кейс - 100 очк
// 1lvl

// y = (x^2/100 + (log2 x)  + (sin x) / 2) + sqrt(x - 1) + 10
// =

@container.ProvideClass()
export class RankService {
  private readonly _map: ReadonlyMap<number, number> = new Map([
    [0, 0],
    [1, 11],
    [2, 25],
    [3, 43],
    [4, 64],
    [5, 91],
    [6, 123],
    [7, 163],
    [8, 212],
    [9, 268],
    [10, 334],
    [11, 411],
    [12, 500],
    [13, 601],
    [14, 717],
    [15, 848],
    [16, 994],
    [17, 1156],
    [18, 1336],
    [19, 1535],
    [20, 1754],
    [21, 1994],
    [22, 2255],
    [23, 2538],
    [24, 2845],
    [25, 3177],
    [26, 3535],
    [27, 3920],
    [28, 4332],
    [29, 4772],
    [30, 5242],
    [31, 5743],
    [32, 6276],
    [33, 6841],
    [34, 7440],
    [35, 8074],
    [36, 8742],
    [37, 9448],
    [38, 10191],
    [39, 10973],
    [40, 11795],
    [41, 12658],
    [42, 13561],
    [43, 14507],
    [44, 15497],
    [45, 16532],
    [46, 17613],
    [47, 18739],
    [48, 19914],
    [49, 21136],
    [50, 22409],
    [51, 23732],
    [52, 25108],
    [53, 26535],
    [54, 28016],
    [55, 29551],
    [56, 31142],
    [57, 32790],
    [58, 34496],
    [59, 36260],
    [60, 38084],
    [61, 39967],
    [62, 41913],
    [63, 43921],
    [64, 45994],
    [65, 48131],
    [66, 50333],
    [67, 52601],
    [68, 54937],
    [69, 57342],
    [70, 59816],
    [71, 62362],
    [72, 64979],
    [73, 67667],
    [74, 70430],
    [75, 73267],
    [76, 76180],
    [77, 79170],
    [78, 82237],
    [79, 85383],
    [80, 88607],
    [81, 91913],
    [82, 95300],
    [83, 98771],
    [84, 102325],
    [85, 105963],
    [86, 109686],
    [87, 113496],
    [88, 117393],
    [89, 121380],
    [90, 125457],
    [91, 129623],
    [92, 133881],
    [93, 138231],
    [94, 142675],
    [95, 147214],
    [96, 151849],
    [97, 156580],
    [98, 161408],
    [99, 166335],
    [100, 171361]
  ]);

  public addPoints(user: UserEntity, min: number, max: number) {
    const amount = random(min, max, 0);
    user.rank_points.add(amount);

    return user.rank_points.map(() => amount);
  }

  public getCurrentRankRange(userPoints: number | IBalance) {
    userPoints = Number(userPoints);

    for (const [rank, points] of this._map) {
      const next = {
        rank: rank + 1,
        points: this._map.get(rank + 1) ?? 0
      };

      const current = { rank, points };

      if (current.points <= userPoints && next.points > userPoints) {
        return { current, next };
      }
    }

    return {
      current: { rank: 0, points: userPoints },
      next: { rank: 1, points: this._map.get(1) ?? 0 }
    };
  }
}
