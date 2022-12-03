import { createTMatcher } from "@xxhax/match";
import type { TimeOffset } from "./time-offset.type";

/**
 *
 * @param {TimeOffset} offset
 * @return {number} Time in ms
 */
export function parseTimeOffset(offset: TimeOffset): number {
  const value = parseInt(offset);
  const unit = offset.slice(value.toString().length);

  const match = createTMatcher({
    ms: 1,
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
    w: 1000 * 60 * 60 * 24 * 7
  });

  const multiplier = match(unit);

  if (!multiplier) {
    throw new Error(`Invalid unit: ${unit}`);
  }

  return value * (multiplier as number);
}
