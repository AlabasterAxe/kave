import {
  configureStore,
  ConfigureStoreOptions,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { Timeline, Clip } from "../../../common/model";

// import timeline model object
function initialTimeline(): Timeline {
  return {
    clips: [
      {
        duration: 4,
        fileOffsetSeconds: 0,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: 1,
      } as Clip,
    ],
  };
}

interface SplitOperation {
  clipId: number;
  clipOffsetSeconds: number;
}

export const selectTimeline = (state: RootState) => state.timeline;

export const timelineSlice = createSlice({
  name: "timeline",
  initialState: initialTimeline(),
  reducers: {
    split: (state, action: PayloadAction<SplitOperation>) => {
      //TODO: implement async call to backend
    },
    delete: (state, action: PayloadAction<Clip>) => {},
    clear: (state) => {
      state = initialTimeline();
    },
  },
});

export const store = configureStore({
  reducer: {
    timeline: timelineSlice.reducer,
  },
} as ConfigureStoreOptions);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
