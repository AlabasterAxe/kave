import { createSlice } from "@reduxjs/toolkit";
import { Clip, Timeline } from "../../../common/model";

function initialTimeline(): Timeline {
  return {
    durationSeconds: 8,
    clips: [
      {
        durationSeconds: 4,
        fileOffsetSeconds: 0,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: 1,
      } as Clip,
      {
        durationSeconds: 4,
        fileOffsetSeconds: 0,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: 2,
      } as Clip,
    ],
  };
}

export const timelineSlice = createSlice({
  name: "timeline",
  initialState: initialTimeline(),
  reducers: {},
});
