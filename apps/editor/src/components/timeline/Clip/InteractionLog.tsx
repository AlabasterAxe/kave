import { useEffect, useRef, useState } from "react";
import { DraggableCore } from "react-draggable";
import {
  Clip,
  InteractionLogFile,
  KeyEventPayload,
  TimelineViewport,
  UserInteraction,
  getInteractionLogEventsForClip,
} from "kave-common";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSelection } from "../../../store/selection";
import { selectDocument, selectSelection } from "../../../store/store";
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
  trackNumber: number;
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
    )}vw) translateY(${props.trackNumber * 100}%)`,
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
    if ((userInteraction.type === "keyup" || userInteraction.type === "keydown") && key) {
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
    } else if (userInteraction.type === "mouseup" && !displayText) {
      displayText = "Click";
    }
  }

  return (
      <div
        style={interactionStyle}
        className={[
          "h-full",
          "border",
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
  clipCompositionOffset: number;
  viewport: TimelineViewport;
  compositionId: string;
  clipStartTimeSeconds: number;
  clipDurationSeconds: number;
  timelineElement: HTMLElement;
  clip: Clip;
  onDragStart: (event: DragStartEvent) => void;
  onDragUpdate: (delta: number) => void;
  onDragEnd: () => void;
}

export function MultiTrackInteractionLog(props: InteractionLogProps) {
  return (
    <>
      <InteractionTrack {...props} interactionType="mouseup" trackNumber={0} />
      <InteractionTrack {...props} interactionType="keydown" trackNumber={1} />
      <InteractionTrack {...props} interactionType="keyup" trackNumber={2} />
      <InteractionTrack {...props} interactionType="mousemove" trackNumber={3} />
      <InteractionTrack {...props} interactionType="wheel" trackNumber={4} />
    </>
  );
}

function InteractionTrack(props: InteractionLogProps & { interactionType: string, trackNumber: number}) {
  const selection = useAppSelector(selectSelection);
  const doc = useAppSelector(selectDocument);
  const {
    clipCompositionOffset,
    viewport,
    clipDurationSeconds,
    onDragStart,
    onDragUpdate,
    onDragEnd,
    timelineElement,
    clip,
    clipStartTimeSeconds,
  } = props;
  const dispatch = useAppDispatch();

  const log = getInteractionLogEventsForClip(doc, clip) ?? {}; 


  if (!log) {
    return <>Loading...</>;
  }

  const visibleUserInteractions = log.filter((interaction: UserInteraction) => {
    const interactionTime = interaction.time / 1000;
    return (
      interaction.type === props.interactionType &&
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
    const interactionTimeSeconds = interaction.time / 1000;
    const interactionScreenPosition = transformToScreen(
      viewport,
      interactionTimeSeconds
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
        interactionCluster[0].time / 1000;

      const minEndTime =
        interactionStartTime + MIN_INTERACTION_DURATION_SECONDS;

      // if the next interaction of the is close than MIN_INTERACTION_DURATION_SECONDS
      // we make it as wide as the gap between the interaction time and the next interaction.
      const nextStartTime =
        index === coalescedInteractions.length - 1
          ? Infinity
          : coalescedInteractions[index + 1][0].time / 1000;

      const interactionEndTime = Math.min(
        Math.max(
          interactionCluster[interactionCluster.length - 1].time / 1000,
          minEndTime
        ),
        nextStartTime
      );

      return (
        <InteractionHandle
          trackNumber={props.trackNumber}
          key={`${clip.id}-${interactionCluster[0].time}`}
          interactionStartTime={interactionStartTime}
          interactionEndTime={interactionEndTime}
          clipId={clip.id}
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
