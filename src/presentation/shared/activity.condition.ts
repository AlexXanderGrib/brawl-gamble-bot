type RequiredContextProps = {
  readonly currentActivity: string;
};

export function ActivityCondition(condition: string) {
  return (context: RequiredContextProps) =>
    context.currentActivity === condition;
}
