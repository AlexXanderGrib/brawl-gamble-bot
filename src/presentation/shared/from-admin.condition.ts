type RequiredContextProps = {
  readonly isOutbox: boolean;
  readonly senderId: number;
};
export function FromAdminCondition() {
  return (context: RequiredContextProps) =>
    context.isOutbox && context.senderId > 0;
}
