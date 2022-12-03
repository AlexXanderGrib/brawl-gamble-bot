import { Schedule, TimeOffset } from "@domains/time";
import { AdminAPI, BotAPI, container, GroupID } from "src/config";
import type { API } from "vk-io";
import type { WallWallpostFull } from "vk-io/lib/api/schemas/objects";
import type { WallPostParams } from "vk-io/lib/api/schemas/params";
import type {
  IPublishingService,
  PostID
} from "../interfaces/publishing.service.interface";
import { CacheService } from "./cache.service";

function toPostId(ownerId: number, postId: number): PostID {
  return `${ownerId}_${postId}` as PostID;
}

function postDefaultEditor(post: WallWallpostFull): WallPostParams {
  return {
    message: post.text,
    attachments: post.attachments?.map(
      a => `${a.type}${a[a.type].owner_id}_${a[a.type].id}`
    ),
    copyright: `https://vk.com/wall${post.owner_id}_${post.post_id}`
  };
}

@container.ProvideClass()
export class PublishingService implements IPublishingService {
  private static readonly Key = "last_post_date";
  private static readonly User = 1;

  @container.InjectGetter(BotAPI)
  private readonly api!: API;

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(AdminAPI)
  private readonly admin!: API;

  @container.InjectGetter(CacheService)
  private readonly cache!: CacheService;

  private _getVKT() {
    return this.api.utils.getServerTime({});
  }
  async _setLastPostDate(sch: Schedule) {
    const storage = this.cache.forUser(PublishingService.User);

    const lastSaved = await storage
      .get(PublishingService.Key)
      .then(value => parseInt(value) || 0);

    if (sch.time > lastSaved) {
      await storage.set(PublishingService.Key, sch.time.toString());
    }
  }

  async publish(options: WallPostParams): Promise<PostID> {
    await this._setLastPostDate(
      options.publish_date
        ? Schedule.epoch(options.publish_date)
        : Schedule.epoch(await this._getVKT())
    );

    const { post_id } = await this.admin.wall.post(options);

    return toPostId(-this.groupId, post_id);
  }
  async copy(
    postId: PostID,
    editor: (post: WallWallpostFull) => WallPostParams = postDefaultEditor
  ): Promise<PostID> {
    const posts = await this.admin.wall.getById({ posts: postId });
    const post = (posts as any).items[0] as WallWallpostFull;

    if (!post) {
      throw new Error(
        `Post "${postId}" not found: ${JSON.stringify(posts).slice(0, 100)}`
      );
    }

    const options = editor(post);

    return this.publish(options);
  }

  async scheduleAfterLastPublished(offset: TimeOffset): Promise<Schedule> {
    const vkt = await this._getVKT();
    const saved = await this.cache
      .forUser(PublishingService.User)
      .get(PublishingService.Key)
      .then(value => parseInt(value) || 0);

    const max = Math.max(Schedule.epoch(vkt).valueOf(), saved);

    return new Schedule(max).add(Schedule.offset(offset));
  }
}
