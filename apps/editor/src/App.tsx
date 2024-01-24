import { useCallback, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ActionCreators } from "redux-undo";
import "./App.css";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  PlaybackStateSource,
  nudgeBackward,
  nudgeForward,
  togglePlaybackState,
} from "./store/playback";
import { setSelection } from "./store/selection";
import {
  deleteSelection,
  selectActiveCompositionId,
  selectSelection,
  simplifySelectedMouseInteractions,
  tightenSelection,
} from "./store/store";
import EditorView from "./views/EditorView";
import { ProjectListView } from "./views/ProjectListView";


function App() {
  const dispatch = useAppDispatch();
  const selection = useAppSelector(selectSelection);
  const activeCompositionId = useAppSelector(selectActiveCompositionId);

  const handleKeyboardEvent = useCallback(
    (e: any) => {
      switch (e.code) {
        case "Space":
          dispatch(
            togglePlaybackState({ source: PlaybackStateSource.keyboard })
          );
          break;
        case "ArrowLeft":
          dispatch(nudgeBackward({ source: PlaybackStateSource.keyboard }));
          break;
        case "ArrowRight":
          dispatch(nudgeForward({ source: PlaybackStateSource.keyboard }));
          break;
        case "Escape":
          dispatch(setSelection(undefined));
          break;
        case "Delete":
          if (selection && activeCompositionId) {
            dispatch(
              deleteSelection({
                compositionId: activeCompositionId,
                startTimeSeconds: selection.startTimeSeconds,
                endTimeSeconds: selection.endTimeSeconds,
              })
            );
          }
          break;
      }
      switch (e.key) {
        case "t":
          if (selection && activeCompositionId) {
            dispatch(
              tightenSelection({
                compositionId: activeCompositionId,
                startTimeSeconds: selection.startTimeSeconds,
                endTimeSeconds: selection.endTimeSeconds,
              })
            );
          }
          
          break;
        case "s":
          if (selection && activeCompositionId) {
            dispatch(
              simplifySelectedMouseInteractions({
                compositionId: activeCompositionId,
                startTimeSeconds: selection.startTimeSeconds,
                endTimeSeconds: selection.endTimeSeconds,
              })
            );
          }
          
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            dispatch(ActionCreators.undo());
          }
      }
    },
    [dispatch, selection, activeCompositionId]
  );

  useEffect(() => {
    const cancelWheel = (event: any) => event.preventDefault();

    document.body.addEventListener("wheel", cancelWheel, { passive: false });

    return () => {
      document.body.removeEventListener("wheel", cancelWheel);
    };
  }, []);

  useEffect(() => {
    document.addEventListener("keyup", handleKeyboardEvent);
    return () => document.removeEventListener("keyup", handleKeyboardEvent);
  }, [handleKeyboardEvent]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectListView />}></Route>
        <Route path="/project/:id" element={<EditorView />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
