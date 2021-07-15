import {
  AnyAction,
  createSlice,
  PayloadAction,
  ThunkAction,
} from "@reduxjs/toolkit";
import {
  Clip,
  FileType,
  Project,
  UserInteractionLog,
} from "../../../common/model";
import { v4 as uuidv4 } from "uuid";
import { batch } from "react-redux";
import { RootState } from "./store";

function initialProject(): Project {
  const fileId = uuidv4();
  const userInteractionLogId = uuidv4();
  const sequenceId = uuidv4();
  const clipId1 = uuidv4();

  return {
    id: uuidv4(),
    compositions: [
      {
        id: "ac7c3a24-e08d-4bb6-b1fe-02960b41b870",
        clips: [
          {
            id: clipId1,
            durationSeconds: 60,
            sourceId: sequenceId,
            sourceOffsetSeconds: 0,
          },
        ],
      },
    ],
    files: [
      {
        id: fileId,
        type: FileType.video,
        fileUri: "test_video.m4v",
      },
      {
        id: userInteractionLogId,
        type: FileType.interaction_log,
        fileUri: "test_video.log",
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
            alignmentSeconds: 5.5,
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

export interface UpdateClipPayload {
  compositionId: string;
  clip: Clip;
}

export interface LoadInteractionFilePayload {
  fileId: string;
  interactionLog: UserInteractionLog;
}

export function interactionDrag(
  compositionId: string,
  splitOffsetSeconds: number,
  priorClip: Clip
): ThunkAction<void, RootState, unknown, AnyAction> {
  return (dispatch: (action: any) => void) => {
    // should only result in one combined re-render, not two
    batch(() => {
      if (splitOffsetSeconds > 0) {
        dispatch(
          splitClip({
            compositionId: compositionId,
            splitOffsetSeconds: splitOffsetSeconds,
          })
        );
      }
      dispatch(
        updateClip({
          compositionId: compositionId,
          clip: priorClip,
        })
      );
    });
  };
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
        console.warn("non-existent composition referenced in action payload");
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
      composition.clips = newClips;
      const newCompositions = state.compositions.filter(
        (c) => c.id !== composition.id
      );
      newCompositions.push(composition);
      state.compositions = newCompositions;
    },
    updateClip: (state, action: PayloadAction<UpdateClipPayload>) => {
      const composition = state.compositions.find(
        (composition) => composition.id === action.payload.compositionId
      );
      if (!composition) {
        console.warn("non-existent composition referenced in action payload");
        return state;
      }
      const newClips = [];
      for (const clip of composition.clips) {
        if (clip.id === action.payload.clip.id) {
          clip.durationSeconds = action.payload.clip.durationSeconds;
          clip.sourceOffsetSeconds = action.payload.clip.sourceOffsetSeconds;
          clip.sourceId = action.payload.clip.sourceId;
        }
        newClips.push(clip);
      }
      composition.clips = newClips;
      const newCompositions = state.compositions.filter(
        (c) => c.id !== composition.id
      );
      newCompositions.push(composition);
      state.compositions = newCompositions;
    },
    loadInteractionFile: (
      state,
      action: PayloadAction<LoadInteractionFilePayload>
    ) => {
      const newFiles = state.files.map((file) => {
        if (file.id === action.payload.fileId) {
          return { ...file, userInteractionLog: action.payload.interactionLog };
        } else {
          return file;
        }
      });
      state.files = newFiles;
    },
  },
});

export const { splitClip, updateClip, loadInteractionFile } =
  projectSlice.actions;
