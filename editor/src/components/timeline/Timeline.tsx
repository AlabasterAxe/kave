import { useState } from "react";
import { Composition, TimelineViewport } from "../../../../common/model";
import { ActiveComposition } from "../../store/composition";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { PlaybackStateSource, updatePlayhead } from "../../store/playback";
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

export function Timeline() {
  const activeComposition: ActiveComposition =
    useAppSelector(selectComposition);
  const project = useAppSelector(selectProject);
  const playback = useAppSelector(selectPlayback);
  const composition = project.compositions.find(
    (c: Composition) => c.id === activeComposition.id
  );
  const dispatch = useAppDispatch();
  const [viewport, setViewport] = useState<TimelineViewport>({
    startTimeSeconds: 0,
    endTimeSeconds: composition.durationSeconds,
  });
  const viewportDuration = viewport.endTimeSeconds - viewport.startTimeSeconds;
  const playheadStyle = {
    transform: `translate(${
      ((playback.currentTimeSeconds - viewport.startTimeSeconds) /
        viewportDuration) *
      100
    }vw, 0)`,
  };

  const scrubHandler = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    dispatch(
      updatePlayhead({
        currentTimeSeconds: Math.min(
          Math.max(0, transformToTimeline(viewport, x / rect.width)),
          composition.durationSeconds
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

  const clips = [];
  let durationSoFar = 0;
  for (const clip of composition.clips) {
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
        ></ClipComponent>
      </div>
    );
    durationSoFar += clip.durationSeconds;
  }

  return (
    <div
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
