import { BotAPI, container, GroupID } from "src/config";
import type { API } from "vk-io";

type Slice = { count: number; offset: number };
type SliceInfo = { count: number; offset: number; size: number };
type RepeatableFunction<T> = (
  params: Slice
) => Promise<{ count: number; items: T[] }>;

@container.ProvideClass()
export class MembersService {
  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  @container.InjectGetter(BotAPI)
  private readonly api!: API;

  private async *_repeat<T>(
    fn: RepeatableFunction<T>,
    { batchSize = 100, offset = 0 } = {}
  ): AsyncGenerator<[items: T[], meta: SliceInfo]> {
    let count = Infinity;

    for (let i = 0, o = offset + i * batchSize; o < count; ) {
      const response = await fn({ count: batchSize, offset: o });

      count = response.count;
      yield [response.items, { count, offset: o, size: batchSize }];
      i += 1;
      o = offset + i * batchSize;
    }
  }

  getAll({
    batchSize = 1000,
    offset = 0,
    sort = "id_asc" as "id_asc" | "id_desc",
    filter = undefined as
      | "friends"
      | "unsure"
      | "managers"
      | "donut"
      | undefined
  } = {}) {
    return this._repeat(
      ({ count, offset }) =>
        this.api.groups.getMembers({
          group_id: this.groupId.toString(),
          count,
          offset,
          sort,
          filter
        }),
      { batchSize, offset }
    );
  }

  getConversations({
    offset = 0,
    batchSize = 200,
    filter = "all" as "all" | "important" | "unanswered" | "unread"
  } = {}) {
    return this._repeat(
      ({ count, offset }) =>
        this.api.messages.getConversations({ count, offset, filter }),
      { batchSize, offset }
    );
  }
}
