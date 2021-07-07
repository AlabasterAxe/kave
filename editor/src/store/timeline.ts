import { createSlice } from "@reduxjs/toolkit";
import { Clip, Timeline } from "../../../common/model";

function initialTimeline(): Timeline {
  const interactionLogStartDate = new Date();
  return {
    durationSeconds: 16,
    clips: [
      {
        durationSeconds: 8,
        fileOffsetSeconds: 0,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: 1,
      } as Clip,
      {
        durationSeconds: 8,
        fileOffsetSeconds: 100,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: 2,
      } as Clip,
    ],
    userInteractions: {
      alignment: 0,
      log: [
        {
          date: interactionLogStartDate,
          type: "A",
        },
        {
          date: new Date(interactionLogStartDate.getTime() + 1000),
          type: "B",
        },
        {
          date: new Date(interactionLogStartDate.getTime() + 2000),
          type: "C",
        },
        {
          date: new Date(interactionLogStartDate.getTime() + 3000),
          type: "D",
        },
      ],
    },
  };
}

export const timelineSlice = createSlice({
  name: "timeline",
  initialState: initialTimeline(),
  reducers: {},
});
