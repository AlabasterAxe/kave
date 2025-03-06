import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { store } from "./store/store";
import EditorView from "./views/EditorView";
import { ProjectListView } from "./views/ProjectListView";

const appRootElement = document.getElementById("root");
const root = createRoot(appRootElement!);

const router = createBrowserRouter(createRoutesFromElements((
  <Route path="/" element={<App />}>
    <Route path="/project/:id" element={<EditorView />} />
    <Route path="" element={<ProjectListView/>} />
  </Route>
)))

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
    hello
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
