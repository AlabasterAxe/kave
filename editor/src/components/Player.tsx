import { MutableRefObject, useEffect, useRef, useState } from "react";
import VideoContext from "videocontext";
import { Composition, FileType, Project } from "../../../common/model";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  PlaybackState,
  PlayingState,
  PlaybackStateSource,
  updatePlayhead,
} from "../store/playback";
import {
  selectPlayback,
  selectComposition,
  selectProject,
} from "../store/store";

function setUpTimeline(
  videoContext: VideoContext,
  composition: Composition,
  playbackState: PlaybackState,
  project: Project
) {
  videoContext.reset();
  let duration = 0;
  for (const clip of composition.clips) {
    let file = project.files.find((f) => f.id === clip.sourceId);
    if (!file) {
      const seq = project.sequences.find((s) => s.id === clip.sourceId);
      if (!seq) {
        continue;
      }

      for (const track of seq.tracks) {
        const trackFile = project.files.find((f) => f.id === track.fileId);
        if (trackFile?.type === FileType.video) {
          // TODO: this can potentially cause issues if the track alignment causes a gap in the video.
          const videoNode = videoContext.video(
            trackFile.fileUri,
            clip.sourceOffsetSeconds - track.alignmentSeconds,
            clip.durationSeconds
          );
          videoNode.connect(videoContext.destination);
          videoNode.startAt(duration);
          duration += clip.durationSeconds;
          videoNode.stopAt(duration);
        }
      }
    } else {
      if (file.type !== FileType.video) {
        continue;
      }
      const videoNode = videoContext.video(
        file.fileUri,
        clip.sourceOffsetSeconds,
        clip.durationSeconds
      );
      videoNode.connect(videoContext.destination);
      videoNode.startAt(duration);
      duration += clip.durationSeconds;
      videoNode.stopAt(duration);
    }
  }
  videoContext.currentTime = playbackState.currentTimeSeconds;
  if (playbackState.state === PlayingState.playing) {
    videoContext.play();
  }
}

function Player() {
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const [ctx, setContext] = useState<VideoContext | null>(null);
  const activeComposition = useAppSelector(selectComposition);
  const playback = useAppSelector(selectPlayback);
  const project = useAppSelector(selectProject);
  const composition = project.compositions.find(
    (c: Composition) => c.id === activeComposition.id
  );
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
        setUpTimeline(videoContext, composition, playback, project);
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
  }, [dispatch, activeComposition, playback, ctx, project]);

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
