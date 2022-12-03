import type { Investment } from "@domains/investments";
import { calculate } from "@xxhax/safe-math";
import { configure } from "src/config";
import { InvestingService } from "../investing.service";

describe(InvestingService.name, () => {
  const container = configure(202005841);
  if (!container) fail("Invalid group id");
  const is = container.inject(InvestingService) as InvestingService;

  test("All investments has adequate rates", () => {
    const backTime = (i: Investment) =>
      calculate(
        i.price,
        i.profitPerHour,
        (pr, pf) => (pr * (i.isPriceGems ? 10000 : 1)) / pf
      ) * 100;

    const investments = is.getAll().sort((a, b) => backTime(a) - backTime(b));

    for (const investment of investments) {
      console.log(investment.fullName, backTime(investment));
    }
  });
});
