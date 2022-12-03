export interface Identifiable<T extends string | number = string | number> {
  readonly id: T;
}
