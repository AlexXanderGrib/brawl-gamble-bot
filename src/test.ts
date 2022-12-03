import { CashoutsRepository } from "@app/services/repositories/cashouts.repo";
import { configure } from "./config";

const di = configure(202005841);

if (!di) throw new Error("No di");

const cr = di.inject(CashoutsRepository) as CashoutsRepository;

async function main() {
  const data = await cr.getPreviousCashoutsStats(432828422);

  console.log(data);
}

main();
