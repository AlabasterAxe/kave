import { UserInteractionLog } from "../../../../common/model";

export interface InteractionLogProps {
  log: UserInteractionLog;
}

export function InteractionLog(props: InteractionLogProps) {
  return <div className="h-full w-full" />;
}
