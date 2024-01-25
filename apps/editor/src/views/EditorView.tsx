import { useEffect, useState } from "react";
import { NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { RenderPanel } from "../RenderPanel";
import Player from "../components/Player";
import { Timeline } from "../components/timeline/Timeline";
import { useAppDispatch } from "../store/hooks";
import { setActiveProject } from "../store/store";
import EventLogDropZone from "../components/EventLogDropZone";

function EditorView() {
  const { id } = useParams();
  const dispatch = useAppDispatch();

  useEffect(
    () => {
      if (id === "new" || !id) {
        return;
      }
      setActiveProject(dispatch, id)
    },
    [dispatch, id]
  );

  return (
    <div className="w-full h-full bg-blue-200 relative">
      <div className="h-5/6 player m-auto ">
        <Player />
      </div>
      <div className="h-1/6 w-screen ">
        <Timeline />
      </div>
      <div className="right-0 top-0 absolute">
        <RenderPanel />
      </div>
      <EventLogDropZone onNewLog={console.log}/>
    </div>
  );
}

export default EditorView;
