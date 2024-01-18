import { useRef, useState } from "react";
import { Clip, Composition, TimelineViewport } from "kave-common";
import { ActiveComposition } from "../../store/composition";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { PlaybackStateSource, updatePlayhead } from "../../store/playback";
import { Selection } from "../../store/selection";
import { deleteSection, deleteSectionFromClips } from "../../store/project";
import {
  selectComposition,
  selectPlayback,
  selectProject,
  selectSelection,
} from "../../store/store";
import {
  scaleToScreen,
  transformToScreen,
  transformToTimeline,
} from "../../util/timeline-transformer";
import ClipComponent from "./Clip/Clip";

const CLIP_SPLIT_THRESHOLD = 0.05;
const MIN_VIEWPORT_SPAN = 0.05;

export interface DragOperation {
  // this is the point in the original clip that the user started dragging on
  // e.g. if the user clicks on an interaction that occurred 2 seconds into the clip, this value will be 2
  // this can be null if the drags an interaction that is aligned to the start of the clip
  dragStartTimeSeconds: number;
  currentDragTimeSeconds: number;
}

function validDragOperation(
  operation: DragOperation | null
): operation is DragOperation {
  return (
    !!operation &&
    operation.dragStartTimeSeconds - operation.currentDragTimeSeconds >
      CLIP_SPLIT_THRESHOLD
  );
}

export function Timeline() {
  const activeComposition: ActiveComposition =
    useAppSelector(selectComposition);
  const playback = useAppSelector(selectPlayback);
  const project = useAppSelector(selectProject);
  const selection = useAppSelector(selectSelection);
  const [dragOperation, setDragOperation] = useState<DragOperation | null>(
    null
  );
  const composition = project.compositions.find(
    (c: Composition) => c.id === activeComposition.id
  );
  const compositionDurationSeconds: number = composition!.clips.reduce(
    (acc: number, clip: Clip) => clip.durationSeconds + acc,
    0
  );
  const dispatch = useAppDispatch();
  const [viewport, setViewport] = useState<TimelineViewport>({
    startTimeSeconds: 0,
    endTimeSeconds: compositionDurationSeconds,
  });
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const scrubHandler = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    dispatch(
      updatePlayhead({
        currentTimeSeconds: Math.min(
          Math.max(0, transformToTimeline(viewport, x / rect.width)),
          compositionDurationSeconds
        ),
        source: PlaybackStateSource.timeline,
      })
    );
  };

  const zoomHandler = (e: any) => {
    const viewportSpan = Math.max(
      viewport.endTimeSeconds - viewport.startTimeSeconds,
      MIN_VIEWPORT_SPAN
    );
    const scrollUnit = viewportSpan / 200;
    const startTimeSeconds =
      viewport.startTimeSeconds - e.deltaY * scrollUnit + e.deltaX * scrollUnit;
    let endTimeSeconds =
      viewport.endTimeSeconds + e.deltaY * scrollUnit + e.deltaX * scrollUnit;

    if (endTimeSeconds - startTimeSeconds < MIN_VIEWPORT_SPAN) {
      endTimeSeconds = startTimeSeconds + MIN_VIEWPORT_SPAN;
    }
    setViewport({
      startTimeSeconds,
      endTimeSeconds,
    });
  };

  const onInteractionDragStart = (dragStartSeconds: number) => {
    // this means the user is dragging an interaction that is aligned to the start of the clip
    setDragOperation({
      dragStartTimeSeconds: dragStartSeconds,
      currentDragTimeSeconds: dragStartSeconds,
    });
  };

  const onInteractionDragUpdate = (dragLocPx: number) => {
    if (dragOperation) {
      const globalTimelineLocationSeconds = transformToTimeline(
        viewport,
        dragLocPx / window.innerWidth
      );
      setDragOperation({
        dragStartTimeSeconds: dragOperation.dragStartTimeSeconds,
        currentDragTimeSeconds: Math.min(
          globalTimelineLocationSeconds,
          dragOperation.dragStartTimeSeconds
        ),
      });
    }
  };

  const onInteractionDragEnd = () => {
    if (
      activeComposition &&
      dragOperation &&
      dragOperation.dragStartTimeSeconds -
        dragOperation.currentDragTimeSeconds >
        CLIP_SPLIT_THRESHOLD
    ) {
      dispatch(
        deleteSection({
          compositionId: activeComposition.id,
          startTimeSeconds: dragOperation.currentDragTimeSeconds,
          endTimeSeconds: dragOperation.dragStartTimeSeconds,
        })
      );
    }
    setDragOperation(null);
  };

  const renderTimeline = (viewport: TimelineViewport, clips: Clip[]) => {
    const timelineDuration = clips.reduce(
      (acc: number, clip: Clip) => clip.durationSeconds + acc,
      0
    );

    const timelineStyle = {
      transform: `translateX(${transformToScreen(viewport, 0)}vw)`,
      width: `${scaleToScreen(viewport, timelineDuration)}vw`,
    };
    return (
      <div style={timelineStyle} className="h-full absolute bg-gray-100"></div>
    );
  };

  const renderPlayhead = (viewport: TimelineViewport, timeSeconds: number) => {
    const playheadStyle = {
      transform: `translateX(${transformToScreen(viewport, timeSeconds)}vw)`,
    };
    return (
      <div
        style={playheadStyle}
        className="w-0.5 h-full bg-red-500 absolute"
      ></div>
    );
  };

  const renderSelection = (
    viewport: TimelineViewport,
    selection: Selection
  ) => {
    const selectionStyle = {
      transform: selection
        ? `translateX(${transformToScreen(
            viewport,
            selection.startTimeSeconds
          )}vw)`
        : `translateX(0px)`,
      width: selection
        ? `${scaleToScreen(
            viewport,
            selection.endTimeSeconds - selection.startTimeSeconds
          )}vw`
        : 0,
    };
    return (
      selection && (
        <div
          style={selectionStyle}
          className="h-full absolute bg-blue-400 bg-opacity-30 pointer-events-none"
        ></div>
      )
    );
  };

  // this method renders a clip with an optional clip duration override
  const renderClip = (
    clip: Clip,
    clipStartTimeSeconds: number,
    clipDurationSeconds?: number
  ) => {
    return (
      <div
        key={clip.id}
        className="h-full absolute"
        style={{
          width:
            scaleToScreen(
              viewport,
              clipDurationSeconds ?? clip.durationSeconds
            ) + "vw",
          transform: `translateX(${transformToScreen(
            viewport,
            clipStartTimeSeconds
          )}vw)`,
        }}
      >
        <ClipComponent
          clip={{
            ...clip,
            durationSeconds: clipDurationSeconds ?? clip.durationSeconds,
          }}
          viewport={viewport}
          clipStartTime={clipStartTimeSeconds}
          timelineElement={timelineRef.current!}
          onInteractionDragStart={(time: number) =>
            onInteractionDragStart(time)
          }
          onInteractionDragUpdate={(dragLocPx: number) =>
            onInteractionDragUpdate(dragLocPx)
          }
          onInteractionDragEnd={() => onInteractionDragEnd()}
        ></ClipComponent>
      </div>
    );
  };

  const clips = [];
  let durationSoFar = 0;
  const timelineClips = validDragOperation(dragOperation)
    ? deleteSectionFromClips(
        composition!.clips,
        dragOperation.currentDragTimeSeconds,
        dragOperation.dragStartTimeSeconds
      )
    : composition!.clips;
  for (const clip of timelineClips) {
    clips.push(renderClip(clip, durationSoFar));
    durationSoFar += clip.durationSeconds;
  }

  return (
    <div
      ref={timelineRef}
      className="w-full h-full bg-gray-200 relative flex flex-col"
      onClick={scrubHandler}
      onWheel={zoomHandler}
    >
      {renderTimeline(viewport, timelineClips)}
      <div className="h-full w-full flex relative">{clips}</div>
      {renderSelection(viewport, selection)}
      {renderPlayhead(viewport, playback.currentTimeSeconds)}
    </div>
  );
}
