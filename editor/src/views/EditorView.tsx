import Player from "../components/Player";
import { Timeline } from "../components/timeline/Timeline";

function EditorView() {
  return (
    <div className="w-screen h-screen bg-blue-200">
      <div className="h-5/6 player m-auto ">
        <Player />
      </div>
      <div className="h-1/6 w-screen ">
        <Timeline />
      </div>
    </div>
  );
}

export default EditorView;
