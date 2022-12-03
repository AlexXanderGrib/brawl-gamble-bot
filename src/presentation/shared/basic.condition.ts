import { normalize } from "@xxhax/strings";

type RequiredContextProps = {
  readonly text?: string | undefined;
  readonly messagePayload: any;
};
export function BasicCondition(
  texts: (string | RegExp)[],
  commands: string[] = []
) {
  return (ctx: RequiredContextProps) => {
    if (commands.includes(ctx.messagePayload?.command)) return true;
    const text = normalize(ctx.text);

    for (const matcher of texts) {
      if (matcher === text) return true;

      if (matcher instanceof RegExp && matcher.test(text)) return true;
    }

    return false;
  };
}
