import { emoji, map, random } from "@xxhax/emoji";
import { container } from "src/config";

type EmojiTable = typeof emoji;

@container.ProvideClass()
export class EmojiService {
  public readonly emoji = emoji;
  public get<T extends string>(
    emojiName: T
  ): T extends keyof EmojiTable ? EmojiTable[T] : string | undefined {
    return map.get(emojiName as any) as any;
  }

  public random(): string {
    return random()[0] ?? this.emoji["poop"];
  }

  public multiRandom(count = 1) {
    return random(count);
  }
}
