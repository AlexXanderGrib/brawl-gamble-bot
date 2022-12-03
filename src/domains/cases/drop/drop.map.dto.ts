type _DropMap = {
  text: {
    text: string;
    description: string;
  };
  account: {
    personages: string[];
  };
  money: {
    min: number;
    max: number;
    /** @default "game" */
    balance?: "game" | "real" | "special";
  };
};

export type DropExtra<T extends keyof _DropMap> = {
  type: T;
  multiplier?: number;
} & _DropMap[T];

export type DropMapDTO = {
  [key in keyof _DropMap]: DropExtra<key>;
};
