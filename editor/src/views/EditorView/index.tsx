import Player from "../../components/Player";

function EditorView() {
  return (
    <div className="w-screen h-screen">
      <div className="h-3/4 w-screen bg-blue-200">
        <Player />
      </div>
      <div className="h-1/4 w-screen bg-yellow-200"></div>
    </div>
  );
}

export default EditorView;
