import { Case } from "@domains/cases";
import { just, Maybe, none } from "@sweet-monads/maybe";
import { Config, container } from "src/config";

@container.ProvideClass()
export class CasesService {
  @container.InjectGetter(Config)
  private readonly config!: Config;

  private _cache: Case[] = [];

  public get cases() {
    const cs = this.config?.aspects.cases ?? [];

    if (cs.length === this._cache.length) return this._cache;

    this._cache = cs.map((data: any) => new Case(data));

    return this._cache;
  }

  public get(id: string): Maybe<Case> {
    const currentCase = this.cases.find(c => c.id === id);

    return currentCase ? just(currentCase) : none();
  }

  public present(showHidden = false): [id: string, fullName: string][] {
    return this.cases
      .filter(c => !c.raw.hidden || showHidden)
      .map(c => [c.id, c.fullName]);
  }
}
