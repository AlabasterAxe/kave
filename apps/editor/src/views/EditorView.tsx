import { useParams } from "react-router-dom";
import { RenderPanel } from "../RenderPanel";
import Player from "../components/Player";
import { Timeline } from "../components/timeline/Timeline";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectActiveProjectId, setActiveProject } from "../store/store";

function EditorView() {
  const { id } = useParams();
  const dispatch = useAppDispatch()

  useEffect(()=>{
    dispatch(setActiveProject({projectId: id}))
  }, [dispatch, id]);

  return (
    <div className="w-screen h-screen bg-blue-200 relative">
      <div className="h-5/6 player m-auto ">
        <Player />
      </div>
      <div className="h-1/6 w-screen ">
        <Timeline />
      </div>
      <div className="right-0 top-0 absolute">
        <RenderPanel />
      </div>
    </div>
  );
}

export default EditorView;
