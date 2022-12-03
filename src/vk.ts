import type { AdvancedDIContainer } from "sweet-decorators";
import type { VK } from "vk-io";
import { BotController, useControllers } from "./bot";
import { Config, VKBot } from "./config";
import {
  AchievementsController,
  AdminController,
  BalanceController,
  BonusController,
  CasesController,
  CashoutController,
  CommentsController,
  DataMiningController,
  DonutController,
  EditorController,
  GamesController,
  GuessController,
  HelpController,
  InfoController,
  InvestingController,
  MarketController,
  MembersController,
  MenuController,
  MessagesStateController,
  MiscController,
  OrdersController,
  PostsController,
  ReferralController,
  ReplenishmentsController,
  SubscriptionsController,
  SuggestsController,
  SupportController,
  TopController,
  VKPayController,
  WorkController,
  _WrapperController
} from "./presentation";
import type { FunctionResponse } from "./types";

export async function handleVK(
  json: any,
  container: AdvancedDIContainer
): Promise<FunctionResponse> {
  const invalidGroupResponse = {
    body: "u got wrong there",
    statusCode: 301,
    headers: { Location: "https://youtu.be/dQw4w9WgXcQ" }
  };

  if (!container) return invalidGroupResponse;

  const { group_id, webhook } = await container.injectAsync<Config>(Config);
  if (json.group_id !== group_id) return invalidGroupResponse;

  if (webhook.secret && json.secret !== webhook.secret)
    return {
      body: "300 IQ Security",
      statusCode: 403
    };

  if (json.type === "confirmation")
    return {
      body: webhook.confirmation_token,
      statusCode: 200
    };

  const bot = await container.injectAsync<VK>(VKBot);

  function _apply(
    events: string[],
    ...controllers: (BotController | undefined)[]
  ) {
    for (const event of events) {
      useControllers(bot, event, controllers as BotController[]);
    }
  }

  _apply(["message_reply"], container.inject(EditorController));

  _apply(
    ["message_new", "message_reply"],
    container.inject(_WrapperController),
    container.inject(AdminController),
    container.inject(MenuController),
    container.inject(MarketController),

    container.inject(CashoutController),
    container.inject(ReplenishmentsController),
    container.inject(BonusController),
    container.inject(BalanceController),

    container.inject(CasesController),
    container.inject(WorkController),
    container.inject(InvestingController),
    container.inject(GuessController),
    container.inject(TopController),
    container.inject(AchievementsController),
    container.inject(GamesController),

    container.inject(MiscController),
    container.inject(SubscriptionsController),
    container.inject(ReferralController),
    container.inject(DataMiningController),

    container.inject(HelpController),
    container.inject(SupportController),
    container.inject(InfoController),

    container.inject(SuggestsController)
  );

  _apply(["wall_post_new"], container.inject(PostsController));

  _apply(["message_allow"], container.inject(MessagesStateController));

  _apply(["market_order_new"], container.inject(OrdersController));
  _apply(["vkpay_transaction"], container.inject(VKPayController));
  _apply(["group_join"], container.inject(MembersController));

  _apply(
    ["donut_subscription_create", "donut_subscription_prolonged"],
    container.inject(DonutController)
  );

  _apply(
    [
      "wall_reply_new",
      "wall_reply_delete",
      "video_comment_new",
      "video_comment_delete",
      "photo_comment_new",
      "photo_comment_delete",
      "market_comment_new",
      "market_comment_delete",
      "board_post_new",
      "board_post_delete"
    ],
    container.inject(CommentsController)
  );

  await bot.updates.handleWebhookUpdate(json);
  return { body: "ok", statusCode: 200 };
}
