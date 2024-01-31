import { useEffect, useRef, useState } from "react";
import { DraggableCore } from "react-draggable";
import {
  InteractionLogFile,
  KeyEventPayload,
  TimelineViewport,
  UserInteraction,
} from "kave-common";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { loadInteractionFile } from "../../../store/project";
import { setSelection } from "../../../store/selection";
import { selectSelection } from "../../../store/store";
import {
  scaleToScreen,
  transformToScreen,
} from "../../../util/timeline-transformer";

export interface DragStartEvent {
  startTimeSeconds: number;
  shiftKey: boolean;
  clipId: string;
}

interface InteractionHandleProps {
  onDragStart: (event: DragStartEvent) => void;
  onDragUpdate: (xLocPx: number) => void;
  onDragEnd: () => void;
  onClick: (e: any) => void;
  timelineElement: HTMLElement;
  interactionStartTime: number;
  interactionEndTime: number;
  userInteractions: UserInteraction[];
  viewport: TimelineViewport;
  clipStartTimeSeconds: number;
  bottomTrack?: boolean;
  clipId: string;
}

const COALESCING_THRESHOLD = 1; // if two interactions are within 3 vws of one another, merge them into one
const MIN_INTERACTION_DURATION_SECONDS = 0.1;

function InteractionHandle(props: InteractionHandleProps) {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [emittedStart, setEmittedStart] = useState(false);
  const {
    onDragStart,
    onClick,
    interactionStartTime,
    interactionEndTime,
    userInteractions,
    viewport,
    clipId,
  } = props;
  const interactionStyle = {
    transform: `translateX(${scaleToScreen(
      viewport,
      interactionStartTime
    )}vw) ${props.bottomTrack ? `translateY(100%)` : ""}`,
    cursor: "grab",
    width: `calc(${scaleToScreen(
      viewport,
      interactionEndTime - interactionStartTime
    )}vw)`,
    height: `${100 / 6}%`,
  };
  let displayText = "";

  for (const userInteraction of userInteractions) {
    const key = (userInteraction.payload as KeyEventPayload)?.key
    if (userInteraction.type === "keyup" && key) {
      switch (key) {
        case "Backspace":
          displayText += "‹";
          break;
        case "Space":
          displayText += "•";
          break;
        case "Shift":
          displayText += "⇧";
          break;
        default:
          displayText += key;
      }
    } else if (userInteraction.type === "mousemove" && !displayText) {
      displayText = "Mouse Move";
    } else if (userInteraction.type === "wheel" && !displayText) {
      displayText = "Scroll";
    }
  }

  return (
      <div
        style={interactionStyle}
        className={[
          "h-full",
          "border",
          "border-b-0",
          "border-gray-300",
          "bg-white",
          "absolute",
        ].join(" ")}
        ref={dragRef}
        title={displayText}
        onMouseDown={(e)=>{
          setMouseDown(true);
          setEmittedStart(false);
          e.stopPropagation();
        }}
        onMouseMove={(e)=>{
          if (mouseDown && !emittedStart) {
            setEmittedStart(true);
            onDragStart({startTimeSeconds: interactionStartTime, shiftKey: e.shiftKey, clipId});
          }
        }}
        onMouseUp={()=>{
          if (mouseDown) {
            setMouseDown(false);
          }
        }}
        onClick={onClick}
      >
        <div className="truncate">{displayText}</div>
      </div>
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
  onDragStart: (event: DragStartEvent) => void;
  onDragUpdate: (delta: number) => void;
  onDragEnd: () => void;
}

export function MultiTrackInteractionLog(props: InteractionLogProps) {
  return (
    <>
      <KeyboardInteractionLog {...props} />
      <MouseInteractionLog {...props} />
    </>
  );
}

function MouseInteractionLog(props: InteractionLogProps) {
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
          const userInteractionLog = JSON.parse(text);
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
  const startTime = log[0].time / 1000;
  const visibleUserInteractions = log.filter((interaction) => {
    const interactionTime = interaction.time / 1000 - startTime + offsetSeconds;
    return (
      interaction.type === "wheel" &&
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
    const interactionTime = interaction.time / 1000 - startTime + offsetSeconds;
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
    (interactionCluster: UserInteraction[], index: number) => {
      const interactionStartTime =
        interactionCluster[0].time / 1000 - startTime + offsetSeconds;

      const minEndTime =
        interactionStartTime + MIN_INTERACTION_DURATION_SECONDS;

      // if the next interaction of the is close than MIN_INTERACTION_DURATION_SECONDS
      // we make it as wide as the gap between the interaction time and the next interaction.
      const nextStartTime =
        index === coalescedInteractions.length - 1
          ? Infinity
          : coalescedInteractions[index + 1][0].time / 1000 -
            startTime +
            offsetSeconds;

      const interactionEndTime = Math.min(
        Math.max(
          interactionCluster[interactionCluster.length - 1].time / 1000 -
            startTime +
            offsetSeconds,
          minEndTime
        ),
        nextStartTime
      );

      return (
        <InteractionHandle
          bottomTrack={true}
          key={`${clipId}-${interactionCluster[0].time}`}
          interactionStartTime={interactionStartTime}
          interactionEndTime={interactionEndTime}
          clipId={clipId}
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

function KeyboardInteractionLog(props: InteractionLogProps) {
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
          const userInteractionLog = JSON.parse(text);
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
  const startTime = log[0].time / 1000;
  const visibleUserInteractions = log.filter((interaction) => {
    const interactionTime = interaction.time / 1000 - startTime + offsetSeconds;
    return (
      interaction.type === "keyup" &&
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
    const interactionTime = interaction.time / 1000 - startTime + offsetSeconds;
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
    (interactionCluster: UserInteraction[], index: number) => {
      const interactionStartTime =
        interactionCluster[0].time / 1000 - startTime + offsetSeconds;

      const minEndTime =
        interactionStartTime + MIN_INTERACTION_DURATION_SECONDS;

      // if the next interaction of the is close than MIN_INTERACTION_DURATION_SECONDS
      // we make it as wide as the gap between the interaction time and the next interaction.
      const nextStartTime =
        index === coalescedInteractions.length - 1
          ? Infinity
          : coalescedInteractions[index + 1][0].time / 1000 -
            startTime +
            offsetSeconds;

      const interactionEndTime = Math.min(
        Math.max(
          interactionCluster[interactionCluster.length - 1].time / 1000 -
            startTime +
            offsetSeconds,
          minEndTime
        ),
        nextStartTime
      );

      return (
        <InteractionHandle
          key={`${clipId}-${interactionCluster[0].time}`}
          clipId={clipId}
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
