export interface INotification {
  readonly content: string;
  readonly receiver: number | string | number[];
  readonly meta: Record<string, string>;
}
