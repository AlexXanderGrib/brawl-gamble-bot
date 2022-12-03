import { parseTimeOffset } from "./parser.util";
import type { TimeOffset } from "./time-offset.type";

export class Schedule {
  /**
   *
   * @param {number} time in MS
   */
  constructor(public readonly time: number) {}

  toEpoch() {
    return Math.ceil(this.time / 1000);
  }

  toDate() {
    return new Date(this.time);
  }

  valueOf() {
    return this.time;
  }

  add(s: Schedule) {
    return new Schedule(this.time + s.time);
  }

  static now(offset: TimeOffset = "0ms") {
    return new this(Date.now()).add(this.offset(offset));
  }

  static epoch(epoch: number) {
    return new this(epoch * 1000);
  }

  static offset(offset: TimeOffset) {
    let _offset = 0;

    try {
      _offset = parseTimeOffset(offset);
    } catch {
      _offset = 0;
    }

    return new this(_offset);
  }
}
