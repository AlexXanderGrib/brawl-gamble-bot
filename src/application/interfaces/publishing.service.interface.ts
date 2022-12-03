import type { TimeOffset } from "src/domains/time";
import type { Schedule } from "src/domains/time/schedule.class";
import type { WallWallpostFull } from "vk-io/lib/api/schemas/objects";
import type { WallPostParams } from "vk-io/lib/api/schemas/params";

/**
 * Format: `<owner_id>_<post_id>`
 */
export type PostID = `${number}_${number}`;
export type PostScheduleBaseline = "now" | "last_planned";
export type PostOptions = WallPostParams;

export interface IPublishingService {
  publish(options: WallPostParams): Promise<PostID>;

  copy(
    postId: PostID,
    editor?: (post: WallWallpostFull) => WallPostParams
  ): Promise<PostID>;

  /**
   *
   * @param {TimeOffset} offset
   *
   * @example
   * const schedule = await ps.scheduleAfterLastPublished('1h');
   *
   * await ps.publish({...options, publish_date: schedule.toEpoch()})
   */
  scheduleAfterLastPublished(offset: TimeOffset): Promise<Schedule>;
}

export const IPublishingService = Symbol("IPublishingService");
