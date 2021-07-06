import { MutableRefObject, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import VideoContext from "videocontext";
import { Timeline } from "../../../../common/model";
import { selectTimeline } from "../../store/store";

function setUpTimeline(videoContext: VideoContext, timeline: Timeline) {
  videoContext.reset();
  let duration = 0;
  for (const clip of timeline.clips) {
    const videoNode = videoContext.video(
      clip.fileUri,
      clip.fileOffsetSeconds,
      clip.duration
    );
    videoNode.connect(videoContext.destination);
    videoNode.startAt(duration);
    duration += clip.duration;
    videoNode.stopAt(duration);
  }
}

function Player() {
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const [ctx, setContext] = useState<VideoContext | null>(null);
  const timeline = useSelector(selectTimeline);

  useEffect(() => {
    const context = canvasRef.current?.getContext("webgl");
    if (canvasRef.current && context) {
      const videoContext = new VideoContext(canvasRef.current, (err: any) =>
        console.error(
          "There was a problem instantiating the Video Context.",
          err
        )
      );
      setUpTimeline(videoContext, timeline);

      setContext(videoContext);
    }
  }, [timeline]);

  return (
    <>
      <canvas
        className="m-auto"
        ref={canvasRef}
        width="1000"
        height="562"
      ></canvas>
      <button
        onClick={() => {
          if (ctx) {
            ctx.currentTime = 0;
            ctx.play();
          }
        }}
      >
        Play
      </button>
    </>
  );
}

export default Player;
