import { useRef, useState } from "react";
import { Clip, Composition, TimelineViewport } from "../../../../common/model";
import { ActiveComposition } from "../../store/composition";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { PlaybackStateSource, updatePlayhead } from "../../store/playback";
import { interactionDrag } from "../../store/project";
import {
  selectComposition,
  selectPlayback,
  selectProject,
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
  clipId: string;
  // this is the point in the original clip that the user started dragging on
  // e.g. if the user clicks on an interaction that occurred 2 seconds into the clip, this value will be 2
  // this can be null if the drags an interaction that is aligned to the start of the clip
  relativeSplitTimeSeconds: number;
  dragAmountSeconds: number;
}

export function Timeline() {
  const activeComposition: ActiveComposition =
    useAppSelector(selectComposition);
  const playback = useAppSelector(selectPlayback);
  const project = useAppSelector(selectProject);
  const [dragOperation, setDragOperation] = useState<DragOperation | null>(
    null
  );
  const composition = project.compositions.find(
    (c: Composition) => c.id === activeComposition.id
  );
  const dispatch = useAppDispatch();
  const [viewport, setViewport] = useState<TimelineViewport>({
    startTimeSeconds: 0,
    endTimeSeconds: composition!.durationSeconds,
  });
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const playheadStyle = {
    transform: `translate(${transformToScreen(
      viewport,
      playback.currentTimeSeconds
    )}vw, 0)`,
  };

  const scrubHandler = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    dispatch(
      updatePlayhead({
        currentTimeSeconds: Math.min(
          Math.max(0, transformToTimeline(viewport, x / rect.width)),
          composition!.durationSeconds
        ),
        source: PlaybackStateSource.timeline,
      })
    );
  };

  const zoomHandler = (e: any) => {
    if (!e.ctrlKey) {
      const viewportSpan = Math.max(
        viewport.endTimeSeconds - viewport.startTimeSeconds,
        MIN_VIEWPORT_SPAN
      );
      const scrollUnit = viewportSpan / 200;
      const startTimeSeconds =
        viewport.startTimeSeconds -
        e.deltaY * scrollUnit +
        e.deltaX * scrollUnit;
      let endTimeSeconds =
        viewport.endTimeSeconds + e.deltaY * scrollUnit + e.deltaX * scrollUnit;

      if (endTimeSeconds - startTimeSeconds < MIN_VIEWPORT_SPAN) {
        endTimeSeconds = startTimeSeconds + MIN_VIEWPORT_SPAN;
      }
      setViewport({
        startTimeSeconds,
        endTimeSeconds,
      });
    }
  };

  const getClipStartTimeSeconds = (clipId: string): number => {
    let clipStartTimeSeconds = 0;
    for (const clip of composition!.clips) {
      if (clip.id === clipId) {
        break;
      }
      clipStartTimeSeconds += clip.durationSeconds;
    }
    return clipStartTimeSeconds;
  };

  const onInteractionDragStart = (
    clipId: string,
    relativeHandleTimeSeconds: number
  ) => {
    // this means the user is dragging an interaction that is aligned to the start of the clip
    if (relativeHandleTimeSeconds <= 0) {
      const clips = composition!.clips;
      const prevClipId =
        clips[clips.findIndex((c: Clip) => c.id === clipId) - 1].id;
      setDragOperation({
        clipId: prevClipId,
        relativeSplitTimeSeconds: 0,
        dragAmountSeconds: 0,
      });
    } else {
      setDragOperation({
        clipId: clipId,
        relativeSplitTimeSeconds: relativeHandleTimeSeconds,
        dragAmountSeconds: 0,
      });
    }
  };

  const onInteractionDragUpdate = (clipId: string, dragLocPx: number) => {
    const clipStartTime = getClipStartTimeSeconds(clipId);
    if (dragOperation) {
      const globalTimelineLocationSeconds = transformToTimeline(
        viewport,
        dragLocPx / window.innerWidth
      );
      const localTimelineLocationSeconds =
        globalTimelineLocationSeconds - clipStartTime;
      setDragOperation({
        clipId: clipId,
        relativeSplitTimeSeconds: dragOperation.relativeSplitTimeSeconds,
        dragAmountSeconds: Math.min(
          localTimelineLocationSeconds - dragOperation.relativeSplitTimeSeconds,
          0
        ),
      });
    }
  };

  const onInteractionDragEnd = () => {
    if (
      activeComposition &&
      dragOperation &&
      Math.abs(dragOperation.dragAmountSeconds) > CLIP_SPLIT_THRESHOLD
    ) {
      const priorClip = composition.clips.find(
        (c: Clip) => c.id === dragOperation.clipId
      );
      const clipStartTime = getClipStartTimeSeconds(dragOperation.clipId);
      dispatch(
        interactionDrag(
          activeComposition.id,
          clipStartTime + dragOperation.relativeSplitTimeSeconds,
          {
            ...priorClip,
            durationSeconds:
              dragOperation.relativeSplitTimeSeconds +
              dragOperation.dragAmountSeconds,
          }
        )
      );
    }
    setDragOperation(null);
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
          left: transformToScreen(viewport, clipStartTimeSeconds) + "vw",
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
            onInteractionDragStart(clip.id, time)
          }
          onInteractionDragUpdate={(delta: number) =>
            onInteractionDragUpdate(clip.id, delta)
          }
          onInteractionDragEnd={() => onInteractionDragEnd()}
        ></ClipComponent>
      </div>
    );
  };

  const clips = [];
  let durationSoFar = 0;

  for (const clip of composition!.clips) {
    if (
      dragOperation &&
      dragOperation.clipId === clip.id &&
      Math.abs(dragOperation.dragAmountSeconds) > CLIP_SPLIT_THRESHOLD
    ) {
      const shorteningClipWidth = dragOperation.relativeSplitTimeSeconds
        ? dragOperation.relativeSplitTimeSeconds +
          dragOperation.dragAmountSeconds
        : clip.durationSeconds + dragOperation.dragAmountSeconds;
      clips.push(
        renderClip(
          {
            ...clip,
            id: clip.id + "-new",
          },
          durationSoFar,
          shorteningClipWidth
        )
      );
      durationSoFar += shorteningClipWidth;
      if (dragOperation.relativeSplitTimeSeconds) {
        const newClipWidth =
          clip.durationSeconds - dragOperation.relativeSplitTimeSeconds;

        clips.push(
          renderClip(
            {
              ...clip,
              sourceOffsetSeconds:
                clip.sourceOffsetSeconds +
                dragOperation.relativeSplitTimeSeconds,
            },
            durationSoFar,
            newClipWidth
          )
        );
        durationSoFar += newClipWidth;
      }
    } else {
      clips.push(renderClip(clip, durationSoFar));
      durationSoFar += clip.durationSeconds;
    }
  }

  return (
    <div
      ref={timelineRef}
      className="w-full h-full bg-yellow-200 relative flex flex-col"
      onClick={scrubHandler}
      onWheel={zoomHandler}
    >
      <div
        style={playheadStyle}
        className="w-1 h-full bg-red-500 absolute "
      ></div>
      <div className="h-full w-full flex relative">{clips}</div>
    </div>
  );
}
