import React, { useCallback, useEffect } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import "./App.css";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  nudgeBackward,
  nudgeForward,
  PlaybackStateSource,
  togglePlaybackState,
} from "./store/playback";
import { setSelection } from "./store/selection";
import {
  deleteSelection,
  selectComposition,
  selectSelection,
  tightenSelection,
} from "./store/store";
import EditorView from "./views/EditorView";

function App() {
  const dispatch = useAppDispatch();
  const selection = useAppSelector(selectSelection);
  const activeComposition = useAppSelector(selectComposition);

  const handleKeyboardEvent = useCallback(
    (e) => {
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
          dispatch(setSelection(null));
          break;
        case "Delete":
          if (selection) {
            dispatch(
              deleteSelection({
                compositionId: activeComposition.id,
                startTimeSeconds: selection.startTimeSeconds,
                endTimeSeconds: selection.endTimeSeconds,
              })
            );
          }
          break;
      }
      switch (e.key) {
        case "t":
          dispatch(
            tightenSelection({
              compositionId: activeComposition.id,
              startTimeSeconds: selection.startTimeSeconds,
              endTimeSeconds: selection.endTimeSeconds,
            })
          );
      }
    },
    [dispatch, selection, activeComposition]
  );

  useEffect(() => {
    document.addEventListener("keyup", handleKeyboardEvent);
    return () => document.removeEventListener("keyup", handleKeyboardEvent);
  }, [handleKeyboardEvent]);

  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={EditorView}></Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
