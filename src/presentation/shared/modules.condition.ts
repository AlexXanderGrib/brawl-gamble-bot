type RequiredContextProps = {
  readonly enabledModules: readonly string[];
};

export function ModulesCondition(required: readonly string[]) {
  return ({ enabledModules }: RequiredContextProps) =>
    required.every(name => enabledModules.includes(name));
}
