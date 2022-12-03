import { NotificationService } from "@app/services/notifications.service";
import { Notification } from "@domains/notifications";
import { emoji } from "@xxhax/emoji";
import { BotController, Handle } from "src/bot";
import { AdminAPI, container, GroupID } from "src/config";
import { API, CommentContext, VKError } from "vk-io";

function containLinks(text: string) {
  const triggers = ["vk.com", "https://", "vk.cc", "vk.me", "http://"];

  return triggers.some(part => text.includes(part));
}

@container.ProvideClass()
export class CommentsController extends BotController<CommentContext> {
  @container.InjectGetter(AdminAPI)
  private readonly admin!: API;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(NotificationService)
  private readonly ns!: NotificationService;

  @Handle<CommentContext>([ctx => ctx.isDelete])
  async onDelete(context: CommentContext) {
    await this.ns.deliverToAdmins(
      new Notification(
        `${emoji.recycle} @id${
          context.deleterUserId
        } Удалили комментарий под https://vk.com/${
          context.subTypes[0]?.split("_")[0]
        }${context.ownerId}_${context.objectId}?reply=${context.id}`,
        []
      )
    );
  }

  @Handle<CommentContext>([ctx => ctx.isNew])
  async onComment(context: CommentContext) {
    const hasLinks = containLinks(context.text?.toLocaleLowerCase() || "");

    if (hasLinks) {
      await this.ns.deliverToAdmins(
        new Notification(
          `${emoji.megaphone} @id${
            context.fromId
          } вкинул спам под https://vk.com/${
            context.subTypes[0]?.split("_")[0]
          }${context.ownerId}_${context.objectId}?reply=${context.id}
          
${context.text}`,
          []
        )
      );

      await this._replyComment(context, {
        message: `${emoji.robot} ${emoji.hand} Привет, твой текст содержал ссылку, поэтому я его удалил. Ссылки зачастую ведут на спам ресурсы, вот почему им не место в комментариях. Место ссылок - в личных сообщениях`
      });

      await this._deleteComment(context);
    }
  }

  private _replyComment(
    context: CommentContext,
    { message = "", attachments = [] }
  ) {
    if (context.isBoardComment) {
      return this.admin.board.createComment({
        comment_id: context.id,
        topic_id: context.objectId,
        group_id: context.$groupId ?? this.groupId,
        from_group: 1
      });
    }
    const params = {
      owner_id: context.ownerId,
      from_group: this.groupId,
      reply_to_comment: context.id,
      message,
      attachments
    };
    if (context.isPhotoComment) {
      return this.admin.photos.createComment({
        ...params,
        photo_id: context.objectId
      });
    }
    if (context.isVideoComment) {
      return this.admin.video.createComment({
        ...params,
        video_id: context.objectId
      });
    }
    if (context.isWallComment) {
      return this.admin.wall.createComment({
        ...params,
        post_id: context.objectId
      });
    }
    if (context.isMarketComment) {
      return this.admin.market.createComment({
        ...params,
        item_id: context.objectId
      });
    }
    return Promise.reject(
      new VKError({
        message: "Unsupported event for deleting comment",
        code: "UNSUPPORTED_EVENT"
      })
    );
  }

  private _deleteComment(context: CommentContext) {
    if (context.isDelete) {
      return Promise.reject(
        new VKError({
          message: "Comment is deleted",
          code: "ALREADY_DELETED"
        })
      );
    }
    if (context.isBoardComment) {
      return this.admin.board.deleteComment({
        comment_id: context.id,
        topic_id: context.objectId,
        group_id: context.$groupId ?? this.groupId
      });
    }
    const params = {
      comment_id: context.id,
      owner_id: context.ownerId
    };
    if (context.isPhotoComment) {
      return this.admin.photos.deleteComment(params);
    }
    if (context.isVideoComment) {
      return this.admin.video.deleteComment(params);
    }
    if (context.isWallComment) {
      return this.admin.wall.deleteComment(params);
    }
    if (context.isMarketComment) {
      return this.admin.market.deleteComment(params);
    }
    return Promise.reject(
      new VKError({
        message: "Unsupported event for deleting comment",
        code: "UNSUPPORTED_EVENT"
      })
    );
  }
}
