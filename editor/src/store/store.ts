import { configureStore, ConfigureStoreOptions } from "@reduxjs/toolkit";
import { playbackSlice } from "./playback";
import { compositionSlice } from "./composition";
import { projectSlice } from "./project";

export const selectComposition = (state: RootState) => state.composition;
export const selectPlayback = (state: RootState) => state.playback;
export const selectProject = (state: RootState) => state.project;

// TODO: figure out how to get better typings for the store slices
export const store = configureStore({
  reducer: {
    composition: compositionSlice.reducer,
    playback: playbackSlice.reducer,
    project: projectSlice.reducer,
  },
} as ConfigureStoreOptions);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
