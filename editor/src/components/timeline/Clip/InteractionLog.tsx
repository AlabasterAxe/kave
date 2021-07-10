import {
  TimelineViewport,
  UserInteractionLog,
} from "../../../../../common/model";
import { useAppDispatch } from "../../../store/hooks";
import { splitClip } from "../../../store/project";
import { scaleToScreen } from "../../../util/timeline-transformer";

export interface InteractionLogProps {
  // TODO: this is kind of gross, potentially we should be passing it the whole clip or getting more
  // stuff from state
  userInteractionLog: UserInteractionLog;
  offsetSeconds: number;
  viewport: TimelineViewport;
  compositionId: string;
  clipStartTimeSeconds: number;
  clipDurationSeconds: number;
}

export function InteractionLog(props: InteractionLogProps) {
  const {
    userInteractionLog,
    offsetSeconds,
    viewport,
    compositionId,
    clipStartTimeSeconds,
    clipDurationSeconds,
  } = props;
  const dispatch = useAppDispatch();
  const log = userInteractionLog.log;
  const startTime = log[0].timestampMillis / 1000;
  const userInteractionDom = log
    .filter((interaction) => {
      const interactionTime =
        interaction.timestampMillis / 1000 - startTime + offsetSeconds;
      return (
        interactionTime >= clipStartTimeSeconds &&
        interactionTime < clipStartTimeSeconds + clipDurationSeconds
      );
    })
    .map((interaction, index) => {
      const interactionTime =
        interaction.timestampMillis / 1000 - startTime + offsetSeconds;
      const interactionStyle = {
        transform: `translate(${scaleToScreen(
          viewport,
          interactionTime
        )}vw, 0)`,
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
