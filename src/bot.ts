import { Assign, readMeta } from "sweet-decorators";
import type { Context, VK } from "vk-io";
import type { ExtendedMessageContext } from "./context";

const kHearCondition = Symbol("vk_hear_condition");
const kControllerHandlers = Symbol("vk_controller_handler");

type Handler<T extends Context> = (context: T, next: Handler<T>) => unknown;
type DefaultContext = ExtendedMessageContext;
type HearCondition<Ctx extends Context> = (context: Ctx) => boolean;
type HearConditions<Ctx extends Context> = HearCondition<Ctx>[];

const i2a = <T>(a: T | T[]): T[] => (Array.isArray(a) ? a : [a]);

export abstract class BotController<T extends Context = DefaultContext> {
  public readonly methods = new Map<Handler<T>, HearConditions<T>>();

  constructor() {
    this._exposeHandlers();
  }

  protected _exposeHandlers() {
    for (const key of readMeta(this, kControllerHandlers)) {
      const value = this[key as keyof this];

      if (typeof value === "function") {
        const condition = readMeta(value, kHearCondition);

        condition &&
          this.methods.set(
            value.bind(this) as any,
            i2a(condition).map(fn => fn.bind(this))
          );
      }
    }
  }
}

export function Handle<
  C extends Context = DefaultContext,
  T = Record<string, unknown>
>(conditions: HearConditions<T & C>): MethodDecorator {
  return function (target, prop, desc) {
    const assigned = Assign(kHearCondition, conditions)(target, prop, desc);

    const exposed = readMeta(target, kControllerHandlers) ?? [];
    Assign(kControllerHandlers, [...exposed, prop])(target.constructor);

    return assigned;
  };
}

export function useControllers<T extends Context = DefaultContext>(
  vk: VK,
  event: string,
  controllers: BotController<T>[]
) {
  for (const controller of controllers) {
    for (const [method, conditions] of controller.methods) {
      vk.updates.on(event as any, (ctx: any, next) => {
        const activate = conditions.every(fn => fn(ctx));

        if (activate) {
          return method(ctx, next);
        }

        return next();
      });
    }
  }
}
