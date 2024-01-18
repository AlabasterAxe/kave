import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import VideoContext from "videocontext";
import { Composition, FileType, Project } from "kave-common";
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

/**
 * This function is responsible for accepting the composition and setting up the VideoContext
 * object. We create the nodes for the videocontext anew every time the composition changes.
 * but we might be able to store the nodes with the clips and update them when the composition changes.
 */
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

interface PlayerViewportState {
  zoom: number;
  offset: { x: number; y: number };
}

function Player() {
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const [ctx, setContext] = useState<VideoContext | null>(null);
  const activeComposition = useAppSelector(selectComposition);
  const playback = useAppSelector(selectPlayback);
  const project = useAppSelector(selectProject);
  const [playerViewport, setPlayerViewport] = useState<PlayerViewportState>({
    zoom: 1,
    offset: { x: 0, y: 0 },
  });
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
    // To avoid an infinite loop during playback we only update the current time when
    // the source of the playback change is not the player itself.
    if (ctx) {
      if (playback.source !== PlaybackStateSource.player) {
        ctx.currentTime = playback.currentTimeSeconds;
        if (playback.state === PlayingState.playing) {
          ctx.play();
        } else {
          ctx.pause();
        }
      }
      ctx.destination._zoom = playerViewport.zoom;
      ctx.destination._offset = playerViewport.offset;
    }
  }, [ctx, playback, playerViewport]);

  useEffect(() => {
    window.addEventListener("resize", resizeCallback);
    return () => window.removeEventListener("resize", resizeCallback);
  }, [resizeCallback]);

  useEffect(resizeCallback, [resizeCallback]);

  const zoomHandler = (e: any) => {
    if (e.ctrlKey) {
      const zoomUnit = playerViewport.zoom / 100;
      setPlayerViewport({
        zoom: Math.max(playerViewport.zoom - e.deltaY * zoomUnit, 0.1),
        offset: playerViewport.offset,
      });
    } else {
      setPlayerViewport({
        zoom: playerViewport.zoom,
        offset: {
          x: playerViewport.offset.x - e.deltaX / playerViewport.zoom,
          y: playerViewport.offset.y + e.deltaY / playerViewport.zoom,
        },
      });
    }
  };

  return (
    <canvas
      onWheel={zoomHandler}
      className="h-full w-full player"
      ref={canvasRef}
    ></canvas>
  );
}

export default Player;
