import Player from "../components/Player";
import { Timeline } from "../components/timeline/Timeline";

function EditorView() {
  return (
    <div className="w-screen h-screen">
      <div className="h-5/6 w-screen bg-blue-200">
        <Player />
      </div>
      <div className="h-1/6 w-screen ">
        <Timeline />
      </div>
    </div>
  );
}

export default EditorView;
