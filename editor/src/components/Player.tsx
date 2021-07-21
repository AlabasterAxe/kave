import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import VideoContext from "videocontext";
import { Composition, FileType, Project } from "../../../common/model";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  PlaybackStateSource,
  PlayingState,
  updatePlayhead,
} from "../store/playback";
import {
  selectComposition,
  selectPlayback,
  selectProject,
} from "../store/store";

function setUpTimeline(
  videoContext: VideoContext,
  composition: Composition,
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

  const resizeCallback = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.clientWidth;
      canvasRef.current.height = canvasRef.current.clientHeight;
    }
  }, [canvasRef]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("webgl");

    if (canvasRef.current && context) {
      let videoContext = ctx;
      if (!videoContext) {
        videoContext = new VideoContext(canvasRef.current, (err: any) =>
          console.error(
            "There was a problem instantiating the Video Context.",
            err
          )
        );
      }
      setUpTimeline(videoContext, composition, project);
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
  }, [dispatch, composition, ctx, project]);

  useEffect(() => {
    if (playback.source !== PlaybackStateSource.player && ctx) {
      ctx.currentTime = playback.currentTimeSeconds;
      if (playback.state === PlayingState.playing) {
        ctx.play();
      } else {
        ctx.pause();
      }
    }
  }, [ctx, playback]);

  useEffect(() => {
    window.addEventListener("resize", resizeCallback);
    return () => window.removeEventListener("resize", resizeCallback);
  }, [resizeCallback]);

  useEffect(resizeCallback, [resizeCallback]);

  return <canvas className="h-full w-full player" ref={canvasRef}></canvas>;
}

export default Player;
