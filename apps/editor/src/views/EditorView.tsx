import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { TextContent } from "vanilla-jsoneditor";
import { RenderPanel } from "../RenderPanel";
import FileDropZone, { FileDropEvent } from "../components/EventLogDropZone";
import JsonEditor from "../components/JsonEditor";
import Player from "../components/Player";
import { Timeline } from "../components/timeline/Timeline";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addFileToDefaultSequence, replaceDocument } from "../store/project";
import { selectPersistedDocument, setActiveProject } from "../store/store";

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
