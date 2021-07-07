import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updatePlayhead, PlaybackStateSource } from "../store/playback";
import { selectTimeline, selectPlayback } from "../store/store";

export function Timeline() {
  const timeline = useAppSelector(selectTimeline);
  const playback = useAppSelector(selectPlayback);
  const dispatch = useAppDispatch();
  const styles = {
    transform: `translate(${
      (playback.currentTimeSeconds / timeline.durationSeconds) * 100
    }vw, 0)`,
  };

  const clickHandler = (e: any) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    dispatch(
      updatePlayhead({
        currentTimeSeconds: (x / rect.width) * timeline.durationSeconds,
        source: PlaybackStateSource.timeline,
      })
    );
  };

  return (
    <div className="w-full h-full bg-yellow-200" onClick={clickHandler}>
      <div style={styles} className="w-1 h-full bg-red-500"></div>
    </div>
  );
}
