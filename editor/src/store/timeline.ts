import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Clip, Timeline } from "../../../common/model";
import { v4 as uuidv4 } from "uuid";

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
        id: uuidv4(),
      } as Clip,
      {
        durationSeconds: 8,
        fileOffsetSeconds: 100,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: uuidv4(),
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
          date: new Date(interactionLogStartDate.getTime() + 6000),
          type: "D",
        },
      ],
    },
  };
}

export interface SplitClipPayload {
  splitOffsetSeconds: number;
}

export const timelineSlice = createSlice({
  name: "timeline",
  initialState: initialTimeline(),
  reducers: {
    splitClip: (state, action: PayloadAction<SplitClipPayload>) => {
      const newClips = [];
      let durationSoFar = 0;
      for (const clip of state.clips) {
        if (
          action.payload.splitOffsetSeconds > durationSoFar &&
          action.payload.splitOffsetSeconds <
            durationSoFar + clip.durationSeconds
        ) {
          const beforeClip: Clip = {
            durationSeconds: action.payload.splitOffsetSeconds - durationSoFar,
            fileOffsetSeconds: clip.fileOffsetSeconds,
            fileUri: clip.fileUri,
            id: clip.id,
          };
          const afterClip: Clip = {
            durationSeconds:
              durationSoFar +
              clip.durationSeconds -
              action.payload.splitOffsetSeconds,
            fileOffsetSeconds:
              clip.fileOffsetSeconds +
              action.payload.splitOffsetSeconds -
              durationSoFar,
            fileUri: clip.fileUri,
            id: uuidv4(),
          };
          newClips.push(beforeClip);
          newClips.push(afterClip);
        } else {
          newClips.push(clip);
        }
        durationSoFar += clip.durationSeconds;
      }
      state.clips = newClips;
    },
  },
});

export const { splitClip } = timelineSlice.actions;
