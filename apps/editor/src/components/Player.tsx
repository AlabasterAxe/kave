import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import VideoContext from "videocontext";
import { Composition, FileType, Project, UserInteraction } from "kave-common";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  PlaybackStateSource,
  PlayingState,
  updatePlayhead,
} from "../store/playback";
import {
  selectActiveCompositionId,
  selectCursorLocation,
  selectPlayback,
  selectProject,
  selectSelectionUserInteractions,
} from "../store/store";
import { normalizedVideoPointToScreen } from "../util/canvas-transformer";

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
            clip.durationSeconds,
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
        clip.durationSeconds,
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
  const activeCompositionId = useAppSelector(selectActiveCompositionId);
  const playback = useAppSelector(selectPlayback);
  const project = useAppSelector(selectProject);
  const cursorLocation = useAppSelector(selectCursorLocation);
  const selectionUserInteractions = useAppSelector(selectSelectionUserInteractions);
  const [playerViewport, setPlayerViewport] = useState<PlayerViewportState>({
    zoom: 1,
    offset: { x: 0, y: 0 },
  });
  const composition = project.compositions.find(
    (c: Composition) => c.id === activeCompositionId
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
        videoContext = new VideoContext(
          canvasRef.current,
          (err: any) =>
            console.error(
              "There was a problem instantiating the Video Context.",
              err
            ),
          { aspectRatio: composition?.resolution ? composition?.resolution.x / composition?.resolution.y : 16/9 }
        );
      }
      if (!composition) {
        return;
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
    if (e.ctrlKey || e.metaKey) {
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

  function normalizedPointToScreen(point: {x: number, y: number}) {
    return normalizedVideoPointToScreen({ offset: playerViewport.offset, zoom: playerViewport.zoom, viewportSize: {x: canvasRef.current?.clientWidth!, y: canvasRef.current?.clientHeight!}, videoSize: composition?.resolution ?? {x: 1920, y: 1080}, }, point);
  }

  function browserPointToNormalizedVideoPoint(browserPoint: {x: number, y: number}) {
    return {x: browserPoint.x/(composition?.resolution.x ?? 1920)/videoScaleFactor, y: browserPoint.y/(composition?.resolution.y ?? 1080)/videoScaleFactor};
  }

  function getMouseCursorPathSvgElement(selectionMouseEvents: UserInteraction[]) {
    if (selectionMouseEvents.length < 2) {
      return null;
    }
    const path = selectionMouseEvents.map((interaction) => {
      if (!interaction.x || !interaction.y) {
        return '';
      }
      const screenPoint = normalizedPointToScreen(browserPointToNormalizedVideoPoint(interaction as {x: number, y: number}));
      return `${screenPoint.x},${screenPoint.y}`;
    }).join(' ');
    return <path d={`M ${path}`} fill="none" stroke="#000000" strokeWidth="2" opacity={0.5}></path>
  }
  
  const upperLeft = normalizedPointToScreen({x: 0, y: 0});
  const upperRight = normalizedPointToScreen({x: 1, y: 0});
  const lowerRight = normalizedPointToScreen({x: 1, y: 1});
  const lowerLeft = normalizedPointToScreen({x: 0, y: 1});

  const videoScaleFactor = 1/1.75;
  
  const canvasCursorLocation = cursorLocation ? normalizedPointToScreen(browserPointToNormalizedVideoPoint(cursorLocation)): undefined;

  return (
    <div className="h-full w-full relative" onWheel={zoomHandler}>
      <canvas
        className="h-full w-full player absolute top-0 left-0"
        ref={canvasRef}
      ></canvas>
      <svg className="h-full w-full player absolute top-0 left-0">
        <circle cx={upperLeft.x} cy={upperLeft.y} r={10} fill="#000000"></circle>
        <circle cx={upperRight.x} cy={upperRight.y} r={10} fill="#000000"></circle>
        <circle cx={lowerRight.x} cy={lowerRight.y} r={10} fill="#000000"></circle>
        <circle cx={lowerLeft.x} cy={lowerLeft.y} r={10} fill="#000000"></circle>
        {getMouseCursorPathSvgElement(selectionUserInteractions)}
        {selectionUserInteractions.map((interaction) => {
          if (interaction.x && interaction.y) {
            const screenPoint = normalizedPointToScreen(browserPointToNormalizedVideoPoint(interaction as {x: number, y: number}));
            return <circle cx={screenPoint.x} cy={screenPoint.y} r={5} fill="#00FF00"></circle>
          }
          return null;
        })}
        {canvasCursorLocation && <circle cx={canvasCursorLocation.x} cy={canvasCursorLocation.y} r={10} fill="#FF0000"></circle>}
      </svg>
    </div>
  );
}

export default Player;
