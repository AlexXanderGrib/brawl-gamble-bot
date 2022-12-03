type RequiredContextProps = {
  readonly isChat: boolean;
  readonly isFromGroup: boolean;
  readonly isOutbox: boolean;
};

export function AutoSkipCondition({
  chats = true,
  fromGroups = true,
  outgoing = false
} = {}) {
  return (ctx: RequiredContextProps) => {
    if (chats && ctx.isChat) return false;
    if (fromGroups && ctx.isFromGroup) return false;
    if (outgoing && ctx.isOutbox) return false;

    return true;
  };
}
