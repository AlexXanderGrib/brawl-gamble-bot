import { configure } from "src/config";
import { RankService } from "../rank.service";

describe(RankService.name, () => {
  const container = configure(202005841);
  if (!container) fail("Invalid group id");
  const rs = container.inject(RankService) as RankService;

  const baseSuit = (
    points: number,
    result: ReturnType<RankService["getCurrentRankRange"]>
  ) => {
    expect(result.current.rank).toBeLessThan(result.next.rank);

    expect(result.current.points).toBeLessThanOrEqual(points);
    expect(result.next.points).toBeGreaterThan(points);

    expect(result.current.points).toBeLessThan(result.next.points);
  };

  test(`${rs.addPoints.name} w/ 0 points`, () => {
    const points = 0;
    const result = rs.getCurrentRankRange(points);

    baseSuit(points, result);

    expect(result.current.rank).toBe(0);
  });

  test(`${rs.addPoints.name} w/ 80 points`, () => {
    const points = 80;
    const result = rs.getCurrentRankRange(points);

    baseSuit(points, result);

    expect(result.current.rank).toBe(4);
  });
});
