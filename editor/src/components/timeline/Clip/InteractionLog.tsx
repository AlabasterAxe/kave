import { useEffect, useRef, useState } from "react";
import { DraggableCore } from "react-draggable";
import {
  InteractionLogFile,
  TimelineViewport,
  UserInteraction,
} from "../../../../../common/model";
import { parseLog } from "../../../../../common/parse-log";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { loadInteractionFile } from "../../../store/project";
import { setSelection } from "../../../store/selection";
import { selectSelection } from "../../../store/store";
import {
  scaleToScreen,
  transformToScreen,
} from "../../../util/timeline-transformer";

interface InteractionHandleProps {
  onDragStart: (time: number) => void;
  onDragUpdate: (xLocPx: number) => void;
  onDragEnd: () => void;
  onClick: (e: any) => void;
  timelineElement: HTMLElement;
  interactionStartTime: number;
  interactionEndTime: number;
  userInteractions: UserInteraction[];
  viewport: TimelineViewport;
  clipStartTimeSeconds: number;
}

const COALESCING_THRESHOLD = 1; // if two interactions are within 3 vws of one another, merge them into one
const MIN_INTERACTION_DURATION_SECONDS = 0.1;

function InteractionHandle(props: InteractionHandleProps) {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const {
    onDragStart,
    onDragUpdate,
    onDragEnd,
    onClick,
    timelineElement,
    interactionStartTime,
    interactionEndTime,
    userInteractions,
    viewport,
  } = props;
  const interactionStyle = {
    left: `${scaleToScreen(viewport, interactionStartTime)}vw`,
    cursor: "grab",
    width: `calc(${scaleToScreen(
      viewport,
      interactionEndTime - interactionStartTime
    )}vw)`,
    height: "33.333%",
  };
  let displayText = "";

  for (const userInteraction of userInteractions) {
    switch (userInteraction.type) {
      case "BACKSPACE":
        displayText += "‹";
        break;
      case "SPACE":
        displayText += "•";
        break;
      case "SHIFT":
        displayText += "⇧";
        break;
      default:
        displayText += userInteraction.type;
    }
  }

  return (
    <DraggableCore
      nodeRef={dragRef}
      offsetParent={timelineElement}
      onStart={() => onDragStart(interactionStartTime)}
      onDrag={(e, data) => {
        onDragUpdate(data.x);
        setDragging(true);
      }}
      onStop={(e) => {
        if (dragging) {
          onDragEnd();
          setDragging(false);
        } else {
          onClick(e);
        }
      }}
    >
      <div
        style={interactionStyle}
        className={[
          "h-full",
          "rounded-t-lg",
          "border",
          "border-b-0",
          "border-gray-300",
          "bg-white",
          "absolute",
        ].join(" ")}
        ref={dragRef}
        title={displayText}
      >
        <div className="truncate">{displayText}</div>
      </div>
    </DraggableCore>
  );
}

export interface InteractionLogProps {
  // TODO: it's kind of gross how many props we need to pass into this component, potentially we should be passing it the whole clip or getting more
  // stuff from state
  offsetSeconds: number;
  viewport: TimelineViewport;
  compositionId: string;
  clipStartTimeSeconds: number;
  clipDurationSeconds: number;
  timelineElement: HTMLElement;
  clipId: string;
  file: InteractionLogFile;
  onDragStart: (time: number) => void;
  onDragUpdate: (delta: number) => void;
  onDragEnd: () => void;
}

export function InteractionLog(props: InteractionLogProps) {
  const selection = useAppSelector(selectSelection);
  const {
    file,
    offsetSeconds,
    viewport,
    clipDurationSeconds,
    onDragStart,
    onDragUpdate,
    onDragEnd,
    timelineElement,
    clipId,
    clipStartTimeSeconds,
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
  }, [dispatch, file]);

  if (!file.userInteractionLog) {
    return <>Loading...</>;
  }
  const log = file.userInteractionLog!.log;
  const startTime = log[0].timestampMillis / 1000;
  const visibleUserInteractions = log.filter((interaction) => {
    const interactionTime =
      interaction.timestampMillis / 1000 - startTime + offsetSeconds;
    return (
      interactionTime >= 0 &&
      interactionTime < clipDurationSeconds &&
      clipStartTimeSeconds + interactionTime > viewport.startTimeSeconds &&
      clipStartTimeSeconds + interactionTime < viewport.endTimeSeconds
    );
  });

  const coalescedInteractions: UserInteraction[][] = [];
  let currentCluster: UserInteraction[] = [];
  let prevInteractionScreenPosition = null;
  for (const interaction of visibleUserInteractions) {
    const interactionTime =
      interaction.timestampMillis / 1000 - startTime + offsetSeconds;
    const interactionScreenPosition = transformToScreen(
      viewport,
      interactionTime
    );
    if (
      !prevInteractionScreenPosition ||
      interactionScreenPosition - prevInteractionScreenPosition <
        COALESCING_THRESHOLD
    ) {
      currentCluster.push(interaction);
    } else {
      coalescedInteractions.push(currentCluster);
      currentCluster = [interaction];
    }
    prevInteractionScreenPosition = interactionScreenPosition;
  }
  if (currentCluster.length) {
    coalescedInteractions.push(currentCluster);
  }

  const userInteractionDom = coalescedInteractions.map(
    (interactionCluster: UserInteraction[]) => {
      const interactionStartTime =
        interactionCluster[0].timestampMillis / 1000 -
        startTime +
        offsetSeconds;

      const interactionEndTime = Math.max(
        interactionCluster[interactionCluster.length - 1].timestampMillis /
          1000 -
          startTime +
          offsetSeconds,
        interactionStartTime + MIN_INTERACTION_DURATION_SECONDS
      );

      return (
        <InteractionHandle
          key={`${clipId}-${interactionCluster[0].timestampMillis}`}
          interactionStartTime={interactionStartTime}
          interactionEndTime={interactionEndTime}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onClick={(e) => {
            if (e.shiftKey && selection) {
              dispatch(
                setSelection({
                  startTimeSeconds: Math.min(
                    selection.startTimeSeconds,
                    clipStartTimeSeconds + interactionStartTime
                  ),
                  endTimeSeconds: Math.max(
                    selection.endTimeSeconds,
                    clipStartTimeSeconds + interactionEndTime
                  ),
                })
              );
            } else {
              dispatch(
                setSelection({
                  startTimeSeconds: clipStartTimeSeconds + interactionStartTime,
                  endTimeSeconds: clipStartTimeSeconds + interactionEndTime,
                })
              );
            }
          }}
          timelineElement={timelineElement}
          userInteractions={interactionCluster}
          viewport={viewport}
          clipStartTimeSeconds={clipStartTimeSeconds}
        />
      );
    }
  );
  return <>{userInteractionDom}</>;
}
