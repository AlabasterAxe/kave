import React from "react";
import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import EditorView from "./views/EditorView";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={EditorView}></Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
