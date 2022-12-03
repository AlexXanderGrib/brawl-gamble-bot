import type { UserEntity } from "src/domains/users";

type WorkDataUpdateResult = {
  amount: number;
  total: number;
};

export interface IWorkService {
  mine(userId: number): Promise<WorkDataUpdateResult>;
  trap(userId: number): Promise<WorkDataUpdateResult>;
  saveProgress(user: UserEntity): Promise<number>;
}

export const IWorkService = Symbol("IWorkService");
