import {
  Composition,
  TimelineViewport,
  UserInteractionLog,
} from "../../../../../common/model";
import { useAppDispatch } from "../../../store/hooks";
import { splitClip } from "../../../store/project";

export interface InteractionLogProps {
  userInteractionLog: UserInteractionLog;
  offsetSeconds: number;
  viewport: TimelineViewport;
  compositionId: string;
}

export function InteractionLog(props: InteractionLogProps) {
  const { userInteractionLog, offsetSeconds, viewport, compositionId } = props;
  const dispatch = useAppDispatch();
  const log = userInteractionLog.log;
  const startTime = log[0].date.getTime() / 1000;
  const userInteractionDom = log.map((interaction, index) => {
    const interactionTime =
      interaction.date.getTime() / 1000 - startTime + offsetSeconds;
    const interactionStyle = {
      transform: `translate(${
        (interactionTime /
          (viewport.endTimeSeconds - viewport.startTimeSeconds)) *
        100
      }vw, 0)`,
      cursor: "grab",
    };
    return (
      <div
        key={index}
        style={interactionStyle}
        className="h-full w-3 bg-green-300 absolute"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(
            splitClip({ compositionId, splitOffsetSeconds: interactionTime })
          );
        }}
      >
        <div className="timeline-interaction-text">{interaction.type}</div>
      </div>
    );
  });
  return (
    <div className="h-full w-full flex relative">{userInteractionDom}</div>
  );
}
