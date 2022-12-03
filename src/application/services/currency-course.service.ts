import { CurrencyCourse } from "@domains/currency";
import fetch from "node-fetch";
import { parse as parseHtml } from "node-html-parser";
import { container } from "src/config";

@container.ProvideClass()
export class CurrencyCourseService {
  private _list = new Array<CurrencyCourse>();
  private _lastUpdate = 0;

  async convert(amount: number, id: string) {
    await this._update();

    const currency = this._list.find(cur => cur.id === id || cur.code === id);

    return currency?.convertToRub(amount);
  }

  private async _update() {
    if (Date.now() - this._lastUpdate > 3600) {
      const response = await fetch("https://www.cbr.ru/scripts/XML_daily.asp");
      const text = await response.text();
      const dom = parseHtml(text);

      this._list = dom
        .querySelectorAll("valute")
        .map(
          node =>
            new CurrencyCourse(
              node.querySelector("charcode").textContent,
              node.querySelector("numcode").textContent,
              parseInt(node.querySelector("value").textContent),
              parseInt(node.querySelector("nominal").textContent) || 1
            )
        );
      this._lastUpdate = Date.now();
    }
  }
}
