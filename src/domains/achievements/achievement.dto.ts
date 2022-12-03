import type { Identifiable } from "@domains/shared/identifiable.interface";

export type AchievementDTO = Identifiable<string> &
  Readonly<{
    name: string;
    emoji: string;
    reward: number;
    description: string;
  }>;
