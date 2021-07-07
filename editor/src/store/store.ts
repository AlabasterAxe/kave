import { configureStore, ConfigureStoreOptions } from "@reduxjs/toolkit";
import { playbackSlice } from "./playback";
import { timelineSlice } from "./timeline";

export const selectTimeline = (state: RootState) => state.timeline;
export const selectPlayback = (state: RootState) => state.playback;

export const store = configureStore({
  reducer: {
    timeline: timelineSlice.reducer,
    playback: playbackSlice.reducer,
  },
} as ConfigureStoreOptions);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
