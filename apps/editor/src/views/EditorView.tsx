import { useEffect, useState } from "react";
import { NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { RenderPanel } from "../RenderPanel";
import Player from "../components/Player";
import { Timeline } from "../components/timeline/Timeline";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectPersistedDocument, setActiveProject } from "../store/store";
import FileDropZone, { FileDropEvent } from "../components/EventLogDropZone";
import { addFileToDefaultSequence, replaceDocument } from "../store/project";
import JsonEditor from "../components/JsonEditor";
import { TextContent } from "vanilla-jsoneditor";

function EditorView() {
  const { id } = useParams();
  const persistedDoc = useAppSelector(selectPersistedDocument);
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

  const handleFileDrop = (event: FileDropEvent) => {
    for (const file of event.files) {
      dispatch(addFileToDefaultSequence(file));
    }
  }

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
      <div className="left-0 top-0 w-96 absolute h-full">
      <JsonEditor content={{json: persistedDoc ?? {}}} onChange={(content)=>{
        if ((content as TextContent).text) {
          dispatch(replaceDocument({project: JSON.parse((content as TextContent).text)}));
        }
      }}/></div>
      <FileDropZone onFileDrop={handleFileDrop}/>
    </div>
  );
}

export default EditorView;
