import type { UserEntity } from "@domains/users";
import { container } from "src/config";
import { UsersRepository } from "./repositories/users.repo";

@container.ProvideClass()
export class ReferralService {
  @container.InjectGetter(UsersRepository)
  private readonly userRepo!: UsersRepository;

  getReferrals(userId: number) {
    return this.userRepo.getReferrals(userId);
  }

  getReferrer(user: UserEntity) {
    return user.referrer;
  }

  setReferrerOf(user: UserEntity, id: number) {
    user.referrer = id;
  }
}
