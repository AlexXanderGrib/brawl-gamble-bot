import type { IDisposableService } from "@app/interfaces/disposable.service.interface";
import { Client, types } from "pg";
import { Config, container } from "src/config";

types.setTypeParser(700, "text", parseFloat); // Float4
types.setTypeParser(701, "text", parseFloat); // Float8
types.setTypeParser(1700, "text", parseFloat); // Numeric

@container.ProvideClass()
export class SQLService implements IDisposableService {
  @container.InjectGetter(Config)
  private readonly config!: Config;

  private _client!: Client;

  get client() {
    if (!this._client) {
      this._client = new Client(this.config.pg);
      this._client.connect(error => {
        if (error) throw error;
      });
    }

    return this._client;
  }

  dispose() {
    return this.client.end();
  }
}
