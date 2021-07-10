import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Clip, FileType, Project } from "../../../common/model";
import { v4 as uuidv4 } from "uuid";

function initialProject(): Project {
  const fileId = uuidv4();
  const userInteractionLogId = uuidv4();
  const sequenceId = uuidv4();
  const interactionLogStartDate = new Date();

  return {
    id: uuidv4(),
    compositions: [
      {
        id: "ac7c3a24-e08d-4bb6-b1fe-02960b41b870",
        clips: [
          {
            id: uuidv4(),
            durationSeconds: 8,
            sourceId: sequenceId,
            sourceOffsetSeconds: 0,
          },
          {
            id: uuidv4(),
            durationSeconds: 8,
            sourceId: fileId,
            sourceOffsetSeconds: 100,
          },
        ],
        durationSeconds: 16,
      },
    ],
    files: [
      {
        id: fileId,
        type: FileType.video,
        fileUri:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
      {
        id: userInteractionLogId,
        type: FileType.interaction_log,
        userInteractionLog: {
          id: uuidv4(),
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
      },
    ],
    sequences: [
      {
        id: sequenceId,
        tracks: [
          {
            id: uuidv4(),
            alignmentSeconds: 0,
            fileId: fileId,
          },
          {
            id: uuidv4(),
            alignmentSeconds: 0,
            fileId: userInteractionLogId,
          },
        ],
      },
    ],
  };
}

export interface SplitClipPayload {
  compositionId: string;
  splitOffsetSeconds: number;
}

export const projectSlice = createSlice({
  name: "playback",
  initialState: initialProject(),
  reducers: {
    splitClip: (state, action: PayloadAction<SplitClipPayload>) => {
      const composition = state.compositions.find(
        (composition) => composition.id === action.payload.compositionId
      );

      if (!composition) {
        return state;
      }

      const newClips = [];
      let durationSoFar = 0;
      for (const clip of composition.clips) {
        if (
          action.payload.splitOffsetSeconds > durationSoFar &&
          action.payload.splitOffsetSeconds <
            durationSoFar + clip.durationSeconds
        ) {
          const beforeClip: Clip = {
            durationSeconds: action.payload.splitOffsetSeconds - durationSoFar,
            sourceOffsetSeconds: clip.sourceOffsetSeconds,
            sourceId: clip.sourceId,
            id: clip.id,
          };
          const afterClip: Clip = {
            durationSeconds:
              durationSoFar +
              clip.durationSeconds -
              action.payload.splitOffsetSeconds,
            sourceOffsetSeconds:
              clip.sourceOffsetSeconds +
              action.payload.splitOffsetSeconds -
              durationSoFar,
            sourceId: clip.sourceId,
            id: uuidv4(),
          };
          newClips.push(beforeClip);
          newClips.push(afterClip);
        } else {
          newClips.push(clip);
        }
        durationSoFar += clip.durationSeconds;
      }
      const newCompositions = state.compositions.filter(
        (c) => c.id !== composition.id
      );
      newCompositions.push(composition);
      state.compositions = newCompositions;
    },
  },
});

export const { splitClip } = projectSlice.actions;
