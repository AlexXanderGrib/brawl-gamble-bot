import { random } from "@xxhax/safe-math";
import { randomBytes } from "crypto";
import { readFile } from "fs/promises";
import { EOL } from "os";
import { resolve } from "path";
import { container, __dir } from "src/config";
import { promisify } from "util";
import { gunzip } from "zlib";

type Account = {
  email: string;
  password: string;
};

@container.ProvideClass()
export class AccountsGenService {
  private _emails: string[] = [];

  private async _getEmails() {
    if (this._emails.length > 0) return this._emails;

    const buf = await readFile(resolve(__dir, "../misc/google.gz"));
    const unzipped = (await promisify(gunzip)(buf)) as Buffer;

    const text = Buffer.from(unzipped.toString(), "ascii").toString();

    return (this._emails = text.split(EOL));
  }

  private _makeAccount(emails = this._emails): Account {
    let email = emails[random(0, emails.length - 1)];
    while (!email) email = emails[random(0, emails.length - 1)];

    const password = randomBytes(10).toString("base64");

    return { email, password };
  }

  async generateOne(): Promise<Account> {
    const emails = await this._getEmails();

    return this._makeAccount(emails);
  }

  async generate(amount = 1): Promise<Account[]> {
    const emails = await this._getEmails();

    return new Array(amount).fill(null).map(() => this._makeAccount(emails));
  }
}
