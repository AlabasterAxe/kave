import {
  AnyAction,
  configureStore,
  ConfigureStoreOptions,
} from "@reduxjs/toolkit";
import { playbackSlice } from "./playback";
import { compositionSlice } from "./composition";
import { projectSlice } from "./project";
import thunk, { ThunkDispatch } from "redux-thunk";
import { selectionSlice } from "./selection";

export const selectComposition = (state: RootState) => state.composition;
export const selectPlayback = (state: RootState) => state.playback;
export const selectProject = (state: RootState) => state.project;
export const selectSelection = (state: RootState) => state.selection.selection;

// TODO: figure out how to get better typings for the store slices
export const store = configureStore({
  reducer: {
    composition: compositionSlice.reducer,
    playback: playbackSlice.reducer,
    project: projectSlice.reducer,
    selection: selectionSlice.reducer,
  },
  middleware: [thunk],
} as ConfigureStoreOptions);

export type AppDispatch = ThunkDispatch<any, any, AnyAction>;
export type RootState = ReturnType<typeof store.getState>;
