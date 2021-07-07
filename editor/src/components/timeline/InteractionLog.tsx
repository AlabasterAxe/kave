import { Timeline } from "../../../../common/model";
import { useAppDispatch } from "../../store/hooks";
import { splitClip } from "../../store/timeline";

export interface InteractionLogProps {
  timeline: Timeline;
}

export function InteractionLog(props: InteractionLogProps) {
  const dispatch = useAppDispatch();
  const startTime =
    props.timeline.userInteractions.log[0].date.getTime() / 1000;
  const userInteractionDom = props.timeline.userInteractions.log.map(
    (interaction, index) => {
      const interactionTime =
        interaction.date.getTime() / 1000 -
        startTime +
        props.timeline.userInteractions.alignment;
      const interactionStyle = {
        transform: `translate(${
          (interactionTime / props.timeline.durationSeconds) * 100
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
            dispatch(splitClip({ splitOffsetSeconds: interactionTime }));
          }}
        >
          <div className="timeline-interaction-text">{interaction.type}</div>
        </div>
      );
    }
  );
  return (
    <div className="h-full w-full flex relative">{userInteractionDom}</div>
  );
}
