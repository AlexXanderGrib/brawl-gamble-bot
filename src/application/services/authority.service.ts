/* eslint-disable no-invalid-this */
import type { Entity } from "@domains/shared/entity.interface";
import { AuthorityFacade, HmacAuthority } from "@xxhax/sign";
import { Config, container, GroupID } from "src/config";

type ExtendedEntity<
  T extends Record<string, any> = Record<string, any>
> = Entity & T;

type SignedEntity<
  T extends Record<string, any> = Record<string, any>
> = ExtendedEntity<T> & {
  signature: string;
};

@container.ProvideClass()
export class AuthorityService {
  @container.InjectGetter(Config)
  private readonly config!: Config;

  private readonly authority = new HmacAuthority(this.config.bot_token);
  private readonly facade = new AuthorityFacade<ExtendedEntity>(this.authority);

  @container.InjectGetter(GroupID)
  private readonly groupId!: number;

  sign<T extends Record<string, any> = Record<string, any>>(
    userId: number,
    data: T
  ): SignedEntity<T> {
    const entity: ExtendedEntity<T> = {
      user_id: userId,
      group_id: this.groupId,
      ...data
    };

    const signature = this.facade.sign(entity);

    return { ...entity, signature };
  }

  check(entity: ExtendedEntity, signature: string) {
    return this.facade.check(entity, signature);
  }
}
