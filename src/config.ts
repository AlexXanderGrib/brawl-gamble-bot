import { readdirSync } from "fs";
import path from "path";
import { P2P, Personal } from "qiwi-sdk";
import { AdvancedDIContainer, EmojiLogger, Logger } from "sweet-decorators";
import { applyMixins, MessageContext, VK } from "vk-io";
import { ExtendedMessageContext } from "./context";

const configsPath = path.resolve(__dirname, "..", "misc", "configs");
const { qiwi, vk } = readdirSync(configsPath)
  .map(fileName => require(path.resolve(configsPath, fileName)))
  .reduce(
    ({ qiwi: q1 = {}, vk: v1 = [] }, { qiwi: q2 = {}, vk: v2 = [] }) => ({
      qiwi: { ...q1, ...q2 },
      vk: [...v1, ...v2]
    }),
    {}
  );

export const container = new AdvancedDIContainer();
export const VKAdmin = Symbol("VK_ADMIN");
export const VKBot = Symbol("VK_BOT");
export const AdminAPI = Symbol("VK_ADMIN_API");
export const BotAPI = Symbol("VK_BOT_API");
export const GroupID = Symbol("VK_GROUP_ID");
export const AdminDomain = Symbol("VK_ADMIN_DOMAIN");
export const Config = Symbol("CONFIG");
export type Config = typeof vk[number] & Record<string, any>;

export const QiwiP2P = Symbol("QIWI_P2P");
export const QiwiAdmin = Symbol("QIWI_ADMIN");
export const QiwiThemeCode = Symbol("QIWI_THEME_CODE");
export const logger = new Logger(EmojiLogger);
export const __dir = __dirname;
export const BotVersion = Symbol("VERSION");

applyMixins(MessageContext, [ExtendedMessageContext]);

export function configure(groupId: number): AdvancedDIContainer | false {
  const config = vk.find((x: any) => x.group_id === groupId);
  if (!config) return false;

  const cc = new AdvancedDIContainer(container);

  cc.provide(GroupID, config.group_id);

  const bot = new VK({
    token: config.bot_token,
    pollingGroupId: config.group_id,
    webhookConfirmation: config.webhook.confirmation_token,
    webhookSecret: config.webhook.secret,
    apiMode: "parallel_selected",
    apiVersion: "5.139"
  });
  const admin = new VK({ token: config.admin_token, apiVersion: "5.139" });

  cc.provide(VKAdmin, admin);
  cc.provide(VKBot, bot);
  cc.provide(AdminAPI, admin.api);
  cc.provide(BotAPI, bot.api);
  cc.provide(AdminDomain, config.admin_scapegoat);
  cc.provide(Config, config);

  if (config.use_qiwi && config.use_qiwi in qiwi) {
    const q = qiwi[config.use_qiwi as keyof typeof qiwi];

    cc.provide(QiwiP2P, new P2P(q.secret_key, q.public_key));

    if (q.theme_code) {
      cc.provide(QiwiThemeCode, q.theme_code);
    }

    if (q.token) {
      cc.provide(QiwiAdmin, new Personal(q.token));
    }
  }

  return cc;
}
