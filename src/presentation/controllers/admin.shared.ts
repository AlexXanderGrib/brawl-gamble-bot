import type { PostID } from "@app/interfaces/publishing.service.interface";
import type { TimeOffset } from "@domains/time";
import { Route } from "@pres/shared/route";
import { emoji } from "@xxhax/emoji";
import { createTMatcher } from "@xxhax/match";
import { Keyboard } from "vk-io";

export const AdminRoutes = {
  StealMeme: new Route({
    command: "admin:steal-meme",
    name: `${emoji["male-detective"]} Украсть Мем`,
    requiredModules: ["admin:meme-stealing"],
    textAliases: ["спиздить мем", "украсть мем"]
  }),
  PostStolenMeme: new Route({
    command: "admin:post-stolen-meme",
    name: `${emoji.thumbs_up} Опубликовать`,
    requiredModules: ["admin:meme-stealing"]
  }),
  PublishFreeAcc: new Route({
    command: "admin:post-free-acc",
    name: `${emoji.gift} Выложить Бесплатный Акк`,
    requiredModules: ["admin:bs-post-acc"]
  }),
  ShowDonated: new Route({
    command: "admin:show-donated",
    name: `${emoji.dollar} Доны`,
    textAliases: ["донатеры"],
    requiredModules: ["game"]
  })
};

export function AdminStealMemeButton({
  type = "default" as "default" | "again" | "retry" | "other"
} = {}) {
  return AdminRoutes.StealMeme.toButton(
    createTMatcher({
      default: Keyboard.POSITIVE_COLOR,
      other: Keyboard.NEGATIVE_COLOR
    })(type) ?? Keyboard.SECONDARY_COLOR,
    {
      label:
        createTMatcher({
          default: undefined,
          again: `${emoji["male-detective"]} Украсть Ещё`,
          retry: `${emoji.recycle} Повторить`,
          other: `${emoji.thumbs_down} Другой`
        })(type) || undefined
    }
  );
}

export function AdminPostStolenMemeButton({
  type = "default",
  schedule = "0ms",
  postId
}: {
  type?: "default" | "retry" | "schedule";
  schedule?: TimeOffset;
  postId: PostID;
}) {
  return AdminRoutes.PostStolenMeme.toButton(Keyboard.POSITIVE_COLOR, {
    label:
      createTMatcher({
        default: undefined,
        retry: `${emoji.recycle} Повторить`,
        schedule: `${emoji.clock9} Отложка (${schedule})`
      })(type) || undefined,
    payload: { schedule, id: postId }
  });
}

export function AdminPublishFreeAccButton({
  schedule = "30m" as TimeOffset
} = {}) {
  return AdminRoutes.PublishFreeAcc.toButton(Keyboard.POSITIVE_COLOR, {
    payload: { schedule }
  });
}

export function AdminDonsButton() {
  return AdminRoutes.ShowDonated.toButton();
}
