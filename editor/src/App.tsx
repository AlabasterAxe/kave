import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import EditorView from "./views/EditorView";
import { useAppDispatch } from "./store/hooks";
import { PlaybackStateSource, togglePlaybackState } from "./store/playback";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        dispatch(togglePlaybackState({ source: PlaybackStateSource.keyboard }));
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
