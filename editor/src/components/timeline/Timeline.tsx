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

export interface DragOperation {
  clipId: string;
  splitTimeSeconds: number;
  dragAmountSeconds: number;
}

const CLIP_SPLIT_THRESHOLD = 0.05;

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
      setViewport({
        startTimeSeconds: viewport.startTimeSeconds - e.deltaY + e.deltaX / 10,
        endTimeSeconds: viewport.endTimeSeconds + e.deltaY + e.deltaX / 10,
      });
    }
  };

  const onInteractionDragStart = (clipId: string, time: number) => {
    console.log(`onInteractionDragStart: ${time}`);
    setDragOperation({
      clipId: clipId,
      splitTimeSeconds: time,
      dragAmountSeconds: 0,
    });
  };

  const onInteractionDragUpdate = (clipId: string, location: number) => {
    console.log(`onInteractionDragUpdate: ${location}`);
    if (dragOperation) {
      const dragLocSeconds = transformToTimeline(
        viewport,
        location / window.innerWidth
      );
      setDragOperation({
        clipId: clipId,
        splitTimeSeconds: dragOperation.splitTimeSeconds,
        dragAmountSeconds: Math.min(
          dragLocSeconds - dragOperation.splitTimeSeconds,
          0
        ),
      });
    }
  };

  const onInteractionDragEnd = () => {
    console.log("onInteractionDragEnd");
    // apply the drag operation to the composition
    if (
      activeComposition &&
      dragOperation &&
      Math.abs(dragOperation.dragAmountSeconds) > CLIP_SPLIT_THRESHOLD
    ) {
      const priorClip = composition.clips.find(
        (c: Clip) => c.id === dragOperation.clipId
      );
      dispatch(
        interactionDrag(activeComposition.id, dragOperation.splitTimeSeconds, {
          ...priorClip,
          durationSeconds:
            dragOperation.splitTimeSeconds + dragOperation.dragAmountSeconds,
        })
      );
    }
    setDragOperation(null);
  };

  const clips = [];
  let durationSoFar = 0;
  for (let i = 0; i < composition!.clips.length; i++) {
    const clip = composition!.clips[i];
    if (
      dragOperation &&
      dragOperation.splitTimeSeconds < 0.1 &&
      i + 1 < composition!.clips.length &&
      composition!.clips[i + 1].id === dragOperation.clipId
    ) {
      const newClipDuration =
        clip.durationSeconds + dragOperation.dragAmountSeconds;
      clips.push(
        <div
          key={clip.id}
          className="h-full absolute"
          style={{
            left: transformToScreen(viewport, durationSoFar) + "vw",
            width: scaleToScreen(viewport, newClipDuration) + "vw",
          }}
        >
          <ClipComponent
            clip={{ ...clip, durationSeconds: newClipDuration }}
            viewport={viewport}
            clipStartTime={durationSoFar}
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
      durationSoFar += newClipDuration;
    } else if (
      dragOperation &&
      clip.id === dragOperation.clipId &&
      dragOperation.splitTimeSeconds > 0 &&
      Math.abs(dragOperation.dragAmountSeconds) > CLIP_SPLIT_THRESHOLD
    ) {
      const clip1Width =
        dragOperation.splitTimeSeconds + dragOperation.dragAmountSeconds;
      clips.push(
        <div
          key={`${clip.id}-new`}
          className="h-full absolute"
          style={{
            width: scaleToScreen(viewport, clip1Width) + "vw",
            left: transformToScreen(viewport, durationSoFar) + "vw",
          }}
        >
          <ClipComponent
            clip={{
              ...clip,
              id: `${clip.id}-new`,
              durationSeconds: clip1Width,
            }}
            viewport={viewport}
            clipStartTime={durationSoFar}
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

      durationSoFar += clip1Width;
      const clip2Width = clip.durationSeconds - dragOperation.splitTimeSeconds;
      console.log(clip2Width);
      clips.push(
        <div
          key={clip.id}
          className="h-full absolute"
          style={{
            width: scaleToScreen(viewport, clip2Width) + "vw",
            left: transformToScreen(viewport, durationSoFar) + "vw",
          }}
        >
          <ClipComponent
            clip={{
              ...clip,
              sourceOffsetSeconds: dragOperation.splitTimeSeconds,
            }}
            timelineElement={timelineRef.current!}
            viewport={viewport}
            clipStartTime={durationSoFar}
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
      durationSoFar += clip2Width;
    } else {
      clips.push(
        <div
          key={clip.id}
          className="h-full absolute"
          style={{
            width: scaleToScreen(viewport, clip.durationSeconds) + "vw",
            left: transformToScreen(viewport, durationSoFar) + "vw",
          }}
        >
          <ClipComponent
            clip={clip}
            viewport={viewport}
            clipStartTime={durationSoFar}
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
