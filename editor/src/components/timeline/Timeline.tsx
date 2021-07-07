import { Timeline, Clip } from "../../../../common/model";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { updatePlayhead, PlaybackStateSource } from "../../store/playback";
import { selectTimeline, selectPlayback } from "../../store/store";
import { InteractionLog } from "./InteractionLog";

export function Timeline() {
  const timeline: Timeline = useAppSelector(selectTimeline);
  const playback = useAppSelector(selectPlayback);
  const dispatch = useAppDispatch();
  const styles = {
    transform: `translate(${
      (playback.currentTimeSeconds / timeline.durationSeconds) * 100
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

  const clips = (timeline.clips || []).map((clip: Clip) => (
    <div
      key={clip.id}
      className="h-full rounded border border-gray-400"
      style={{ flex: clip.durationSeconds }}
    >
      {clip.id}
    </div>
  ));

  return (
    <div
      className="w-full h-full bg-yellow-200 relative flex flex-col"
      onClick={scrubHandler}
    >
      <div style={styles} className="w-1 h-full bg-red-500 absolute "></div>
      <div className="h-1/2 w-full">
        <InteractionLog log={timeline.userInteractions} />
      </div>
      <div className="h-1/2 w-full flex">{clips}</div>
    </div>
  );
}
