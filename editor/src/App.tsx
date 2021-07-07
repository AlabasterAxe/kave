import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import EditorView from "./views/EditorView";
import { useAppDispatch } from "./store/hooks";
import {
  nudgeBackward,
  nudgeForward,
  PlaybackStateSource,
  togglePlaybackState,
} from "./store/playback";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.addEventListener("keyup", (e) => {
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
      }
      if (e.code === "Space") {
      }
    });
  }, [dispatch]);
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={EditorView}></Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
