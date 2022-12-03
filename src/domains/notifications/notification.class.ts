import type { INotification } from "./notification.interface";

export class Notification implements INotification {
  constructor(
    public content: string,
    public receiver: string | number | number[],
    public meta: Record<string, string> = {}
  ) {}
}
