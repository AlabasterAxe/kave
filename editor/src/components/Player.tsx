import { MutableRefObject, useEffect, useRef, useState } from "react";
import VideoContext from "videocontext";
import { Timeline } from "../../../common/model";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  PlaybackState,
  PlayingState,
  PlaybackStateSource,
  updatePlayhead,
} from "../store/playback";
import { selectPlayback, selectTimeline } from "../store/store";

function setUpTimeline(
  videoContext: VideoContext,
  timeline: Timeline,
  playbackState: PlaybackState
) {
  videoContext.reset();
  let duration = 0;
  for (const clip of timeline.clips) {
    const videoNode = videoContext.video(
      clip.fileUri,
      clip.fileOffsetSeconds,
      clip.durationSeconds
    );
    videoNode.connect(videoContext.destination);
    videoNode.startAt(duration);
    duration += clip.durationSeconds;
    videoNode.stopAt(duration);
  }
  videoContext.currentTime = playbackState.currentTimeSeconds;
  if (playbackState.state === PlayingState.playing) {
    videoContext.play();
  }
}

function Player() {
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const [ctx, setContext] = useState<VideoContext | null>(null);
  const timeline = useAppSelector(selectTimeline);
  const playback = useAppSelector(selectPlayback);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const context = canvasRef.current?.getContext("webgl");

    if (canvasRef.current && context) {
      if (playback.source !== PlaybackStateSource.player) {
        let videoContext = ctx;
        if (!videoContext) {
          videoContext = new VideoContext(canvasRef.current, (err: any) =>
            console.error(
              "There was a problem instantiating the Video Context.",
              err
            )
          );
        }
        setUpTimeline(videoContext, timeline, playback);
        videoContext.registerCallback(
          VideoContext.EVENTS.UPDATE,
          (currentTime: number) => {
            dispatch(
              updatePlayhead({
                currentTimeSeconds: currentTime,
                source: PlaybackStateSource.player,
              })
            );
          }
        );
        videoContext.registerCallback(
          VideoContext.EVENTS.ENDED,
          (currentTime: number) => {
            dispatch(
              updatePlayhead({
                currentTimeSeconds: currentTime,
                source: PlaybackStateSource.player,
              })
            );
          }
        );

        setContext(videoContext);
      }
    }
  }, [dispatch, timeline, playback, ctx]);

  return (
    <>
      <canvas
        className="m-auto"
        ref={canvasRef}
        width="1000"
        height="562"
      ></canvas>
    </>
  );
}

export default Player;
