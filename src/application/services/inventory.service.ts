import { Inventory } from "@domains/inventory";
import type { UserEntity } from "@domains/users";
import { container } from "src/config";

@container.ProvideClass()
export class InventoryService {
  of(user: UserEntity): Inventory {
    // Smooth hack to conditionally override inventory if it does not exists
    return new Inventory((user.data.inventory ??= {}));
  }
}
