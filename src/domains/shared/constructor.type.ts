export type Constructor<T, Params extends any[] = []> = {
  new (...params: Params): T;
  prototype: T;
};
