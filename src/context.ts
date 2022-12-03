import { normalize } from "@xxhax/strings";
import { Storage } from "@xxhax/vk-storage-wrapper";
import type { IExecuteResponse, MessageContext } from "vk-io";
import type {
  UsersFields,
  UsersUserXtrCounters
} from "vk-io/lib/api/schemas/objects";
import type { UserEntity } from "./domains/users";

function getProp<
  T extends Record<string, unknown>,
  K extends keyof T | keyof any,
  D extends T[keyof T]
>(object: T, property: K, defaultValue: D): K extends keyof T ? T[K] : D {
  return object[property as keyof T] ?? (defaultValue as any);
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtendedMessageContext extends MessageContext {}
export class ExtendedMessageContext {
  public enabledModules!: readonly string[];
  public currentActivity!: string;
  public readonly isDon!: boolean;

  private _storages!: Storage[];

  public user!: (forUpdate: boolean) => Promise<UserEntity>;

  public storage(userId = this.clientId()) {
    if (!this._storages) this._storages = [];

    const existing = this._storages.find(x => x.userId === userId);
    if (existing) return existing;

    const storage = new Storage(this.api, userId);

    this._storages.push(storage);

    return storage;
  }

  public async getUser(fields?: UsersFields[]) {
    const [user] = (await this.api.users.get({
      user_ids: this.clientId().toString(),
      fields
    })) as [UsersUserXtrCounters];

    return user;
  }

  public supportsInlineKeyboard() {
    if (this.isOutbox) return true;

    return !!this.clientInfo.inline_keyboard;
  }

  public supportsCallbackButtons() {
    if (this.isOutbox) return false;

    return this.clientInfo.button_actions.includes("callback");
  }

  public supportsCarousel() {
    if (this.isOutbox) return false;

    return !!this.clientInfo.carousel;
  }

  public lang() {
    const langId = this.clientInfo.lang_id ?? 0;
    const map = {
      0: "ru",
      1: "uk",
      2: "be",
      3: "en",
      4: "es",
      5: "fi",
      6: "de",
      7: "it"
    } as const;

    return getProp(map, langId, map[0]);
  }

  public clientId() {
    return this.isInbox ? this.senderId : this.peerId;
  }

  public evaluate<T = any>(code: string): Promise<IExecuteResponse<T>>;
  public evaluate<T = any>(
    template: TemplateStringsArray,
    ...substitutions: any[]
  ): Promise<IExecuteResponse<T>>;
  public evaluate<T = any>(
    ...[arg0, ...rest]:
      | [code: string]
      | [template: TemplateStringsArray, ...substitutions: any[]]
  ): Promise<IExecuteResponse<T>> {
    const code = typeof arg0 === "string" ? arg0 : String.raw(arg0, rest);

    return this.api.execute<T>({ code });
  }

  public getApi() {
    return this.api;
  }

  public command(): string {
    return this.messagePayload?.command ?? "";
  }

  public normalizedText() {
    return normalize(this.text ?? "");
  }

  public isIn(list: number[] = []) {
    return list.includes(this.clientId());
  }
}
