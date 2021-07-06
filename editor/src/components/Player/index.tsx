import { MutableRefObject, useEffect, useRef, useState } from "react";
import VideoContext from "videocontext";

function Player() {
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const [ctx, setContext] = useState<VideoContext | null>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext("webgl");
    if (canvasRef.current && context) {
      const videoContext = new VideoContext(canvasRef.current, (err: any) =>
        console.error(
          "There was a problem instantiating the Video Context.",
          err
        )
      );
      const videoNode = videoContext.video(
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      );
      videoNode.connect(videoContext.destination);
      videoNode.start(0);
      videoNode.stop(4);
      setContext(videoContext);
    }
  }, []);

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
