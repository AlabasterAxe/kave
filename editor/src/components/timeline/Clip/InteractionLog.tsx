import { useEffect, useRef } from "react";
import { DraggableCore } from "react-draggable";
import {
  InteractionLogFile,
  KaveFile,
  TimelineViewport,
  UserInteraction,
  UserInteractionLog,
} from "../../../../../common/model";
import { parseLog } from "../../../../../common/parse-log";
import { useAppDispatch } from "../../../store/hooks";
import { loadInteractionFile } from "../../../store/project";
import { scaleToScreen } from "../../../util/timeline-transformer";

interface InteractionHandleProps {
  onInteractionDragStart: (time: number) => void;
  onInteractionDragUpdate: (xLocPx: number) => void;
  onInteractionDragEnd: () => void;
  timelineElement: HTMLElement;
  interactionTime: number;
  userInteraction: UserInteraction;
  viewport: TimelineViewport;
}

function InteractionHandle(props: InteractionHandleProps) {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const {
    onInteractionDragStart,
    onInteractionDragUpdate,
    onInteractionDragEnd,
    timelineElement,
    interactionTime,
    userInteraction,
    viewport,
  } = props;
  const interactionStyle = {
    left: `${scaleToScreen(viewport, interactionTime)}vw`,
    cursor: "grab",
  };
  return (
    <DraggableCore
      nodeRef={dragRef}
      offsetParent={timelineElement}
      onStart={() => onInteractionDragStart(interactionTime)}
      onDrag={(e, data) => onInteractionDragUpdate(data.x)}
      onStop={onInteractionDragEnd}
    >
      <div
        style={interactionStyle}
        className="h-full w-3 bg-green-300 absolute"
        ref={dragRef}
      >
        <div className="timeline-interaction-text">{userInteraction.type}</div>
      </div>
    </DraggableCore>
  );
}

export interface InteractionLogProps {
  // TODO: this is kind of gross, potentially we should be passing it the whole clip or getting more
  // stuff from state
  offsetSeconds: number;
  viewport: TimelineViewport;
  compositionId: string;
  clipStartTimeSeconds: number;
  clipDurationSeconds: number;
  timelineElement: HTMLElement;
  clipId: string;
  file: InteractionLogFile;
  onInteractionDragStart: (time: number) => void;
  onInteractionDragUpdate: (delta: number) => void;
  onInteractionDragEnd: () => void;
}

export function InteractionLog(props: InteractionLogProps) {
  const {
    file,
    offsetSeconds,
    viewport,
    clipDurationSeconds,
    onInteractionDragStart,
    onInteractionDragUpdate,
    onInteractionDragEnd,
    timelineElement,
    clipId,
  } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!file.userInteractionLog) {
      // TODO: handle the situation where the file doesn't have a uri.
      fetch(file.fileUri!)
        .then((response) => response.text())
        .then((text) => {
          const userInteractionLog = parseLog(text);
          dispatch(
            loadInteractionFile({
              fileId: file.id,
              interactionLog: { log: userInteractionLog },
            })
          );
        });
    }
  }, [dispatch]);

  if (!file.userInteractionLog) {
    return <>Loading...</>;
  }
  const log = file.userInteractionLog!.log;
  const startTime = log[0].timestampMillis / 1000;
  const userInteractionDom = log
    .filter((interaction) => {
      const interactionTime =
        interaction.timestampMillis / 1000 - startTime + offsetSeconds;
      return interactionTime >= 0 && interactionTime < clipDurationSeconds;
    })
    .map((interaction) => {
      const interactionTime =
        interaction.timestampMillis / 1000 - startTime + offsetSeconds;

      return (
        <InteractionHandle
          key={`${clipId}-${interaction.timestampMillis}`}
          interactionTime={interactionTime}
          onInteractionDragEnd={onInteractionDragEnd}
          onInteractionDragStart={onInteractionDragStart}
          onInteractionDragUpdate={onInteractionDragUpdate}
          timelineElement={timelineElement}
          userInteraction={interaction}
          viewport={viewport}
        />
      );
    });
  return (
    <div className="h-full w-full flex relative">{userInteractionDom}</div>
  );
}
