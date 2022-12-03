import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { container, GroupID, __dir } from "src/config";
import { parse } from "yaml";

@container.ProvideClass()
export class I18nService {
  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  private _config: any = null;
  private _locales = new Map<string, any>();

  private get _dir() {
    return resolve(__dir, `../misc/translations/${this.groupId}`);
  }

  private _loadConfig() {
    return (
      this._config ??
      (this._config = require(resolve(this._dir, "config.json")))
    );
  }

  private get _defaultLocale() {
    return this._config?.defaultLocale || "ru";
  }

  private async _loadLocale(locale: string = this._defaultLocale) {
    if (this._locales.has(locale)) return this._locales.get(locale);

    let localePath = resolve(this._dir, `${locale}.yml`);

    if (!existsSync(localePath)) {
      localePath = resolve(this._dir, `${this._defaultLocale}.yml`);
    }

    const content = await readFile(resolve(this._dir, `${locale}.yml`), "utf8");
    const data = parse(content);

    this._locales.set(locale, data);
    return data;
  }

  public get config() {
    return { ...this._loadConfig() };
  }

  public getLocale(locale?: string) {
    return this._loadLocale(locale);
  }
}
