import { isCallable } from "@xxhax/validators";

export function ca<T>(
  ...items: [condition: boolean | (() => boolean), positive: T][]
): T[] {
  return items.filter(i => (isCallable(i[0]) ? i[0]() : i[0])).map(i => i[1]);
}
