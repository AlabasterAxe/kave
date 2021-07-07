import { useState } from "react";
import { Clip } from "../../../../common/model";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { updatePlayhead, PlaybackStateSource } from "../../store/playback";
import { selectTimeline, selectPlayback } from "../../store/store";
import { InteractionLog } from "./InteractionLog";

export interface TimelineViewport {
  startTimeSeconds: number;
  endTimeSeconds: number;
}

export function Timeline() {
  const timeline = useAppSelector(selectTimeline);
  const playback = useAppSelector(selectPlayback);
  const dispatch = useAppDispatch();
  const [viewport, setViewport] = useState<TimelineViewport>({
    startTimeSeconds: 0,
    endTimeSeconds: timeline.durationSeconds,
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
        currentTimeSeconds: (x / rect.width) * timeline.durationSeconds,
        source: PlaybackStateSource.timeline,
      })
    );
  };

  const zoomHandler = (e: any) => {
    e.preventDefault();

    if (!e.ctrlKey) {
      setViewport({
        startTimeSeconds: viewport.startTimeSeconds - e.deltaY + e.deltaX / 10,
        endTimeSeconds: viewport.endTimeSeconds + e.deltaY + e.deltaX / 10,
      });
    }
  };

  const clips = [];
  let durationSoFar = 0;
  for (const clip of timeline.clips) {
    clips.push(
      <div
        key={clip.id}
        className="h-full rounded border border-gray-400 truncate absolute"
        style={{
          width: (clip.durationSeconds / viewportDuration) * 100 + "vw",
          left:
            ((durationSoFar - viewport.startTimeSeconds) / viewportDuration) *
              100 +
            "vw",
        }}
      >
        {clip.id}
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
      <div className="h-1/2 w-full">
        <InteractionLog timeline={timeline} />
      </div>
      <div className="h-1/2 w-full flex relative">{clips}</div>
    </div>
  );
}
