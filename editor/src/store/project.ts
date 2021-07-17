import {
  AnyAction,
  createSlice,
  PayloadAction,
  ThunkAction,
} from "@reduxjs/toolkit";
import {
  Clip,
  FileType,
  KaveFile,
  Project,
  Sequence,
  UserInteractionLog,
} from "../../../common/model";
import { v4 as uuidv4 } from "uuid";
import { batch } from "react-redux";
import { RootState } from "./store";

const INTERACTION_DURATION_SECONDS = 0.1;

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

interface DeleteSectionPayload {
  compositionId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
}

interface TightenSectionPayload {
  compositionId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
}

interface ClipTighteningResult {
  clips: Clip[];
  nextClipStartSeconds: number;
}

export const deleteSectionFromClips = (
  clips: Clip[],
  startTimeSeconds: number,
  endTimeSeconds: number
): Clip[] => {
  const newClips = [];
  let nextStartTime = 0;
  for (const clip of clips) {
    const clipEndTime = nextStartTime + clip.durationSeconds;
    // the clip is completely outside of the selection
    if (
      (nextStartTime < startTimeSeconds && clipEndTime < startTimeSeconds) ||
      (nextStartTime > endTimeSeconds && clipEndTime > endTimeSeconds)
    ) {
      newClips.push(clip);
      nextStartTime = clipEndTime;
    } else if (
      // the clip is completely within the selection so we don't even add the clip.
      nextStartTime > startTimeSeconds &&
      clipEndTime < endTimeSeconds
    ) {
      continue;
    } else {
      // things get hairy, either the selection is completely within the clip (cutting it in two) or the selection cuts off part of the clip.
      let durationToAdd = 0;
      if (startTimeSeconds > nextStartTime && startTimeSeconds < clipEndTime) {
        const newClipDuration = startTimeSeconds - nextStartTime;
        newClips.push({
          ...clip,
          id: uuidv4(),
          durationSeconds: startTimeSeconds - nextStartTime,
        });
        durationToAdd += newClipDuration;
      }
      if (endTimeSeconds > nextStartTime && endTimeSeconds < clipEndTime) {
        const newClipDuration = clipEndTime - endTimeSeconds;
        newClips.push({
          ...clip,
          durationSeconds: newClipDuration,
          sourceOffsetSeconds:
            clip.sourceOffsetSeconds + endTimeSeconds - nextStartTime,
        });
        durationToAdd += newClipDuration;
      }
      nextStartTime += durationToAdd;
    }
  }
  return newClips;
};

const getTightenedClips = (
  clip: Clip,
  interactionLog: UserInteractionLog,
  interactionLogAlignmentSeconds: number,
  startTimeSeconds?: number,
  endTimeSeconds?: number
): ClipTighteningResult => {
  const tightenedClips: Clip[] = [];
  let durationSoFar = 0;
  if (startTimeSeconds) {
    tightenedClips.push({ ...clip, durationSeconds: startTimeSeconds });
    durationSoFar = startTimeSeconds;
  }
  const startTime = interactionLog.log[0].timestampMillis;
  const interactionLogOffset =
    interactionLogAlignmentSeconds - clip.sourceOffsetSeconds;

  let interactionLogIndex = 0;
  let interactionLogTime = interactionLogOffset;
  while (interactionLogTime < durationSoFar) {
    interactionLogIndex++;
    interactionLogTime =
      (interactionLog.log[interactionLogIndex].timestampMillis - startTime) /
        1000 +
      interactionLogOffset;
  }

  while (interactionLogTime < clip.durationSeconds) {
    if (endTimeSeconds && interactionLogTime >= endTimeSeconds) {
      tightenedClips.push({
        ...clip,
        id: uuidv4(),
        durationSeconds: clip.durationSeconds - endTimeSeconds,
        sourceOffsetSeconds: clip.sourceOffsetSeconds + endTimeSeconds,
      });
      break;
    }

    interactionLogTime =
      (interactionLog.log[interactionLogIndex].timestampMillis - startTime) /
        1000 +
      interactionLogOffset;
    let newInteractionClipEndTime = interactionLogTime;
    let nextInteractionGap = 0;
    while (
      (!endTimeSeconds || newInteractionClipEndTime < endTimeSeconds) &&
      interactionLogIndex <= interactionLog.log.length - 1 &&
      nextInteractionGap < INTERACTION_DURATION_SECONDS
    ) {
      const currentInteractionTime =
        (interactionLog.log[interactionLogIndex].timestampMillis - startTime) /
          1000 +
        interactionLogOffset;
      newInteractionClipEndTime =
        currentInteractionTime + INTERACTION_DURATION_SECONDS;
      interactionLogIndex++;
      if (interactionLogIndex <= interactionLog.log.length - 1) {
        const nextInteractionTime =
          (interactionLog.log[interactionLogIndex].timestampMillis -
            startTime) /
            1000 +
          interactionLogOffset;
        nextInteractionGap = nextInteractionTime - currentInteractionTime;
      }
    }

    tightenedClips.push({
      ...clip,
      id: uuidv4(),
      durationSeconds: newInteractionClipEndTime - interactionLogTime,
      sourceOffsetSeconds: interactionLogTime,
    });
    durationSoFar += newInteractionClipEndTime - interactionLogTime;
  }
  return { clips: tightenedClips, nextClipStartSeconds: durationSoFar };
};

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
    deleteSection: (state, action: PayloadAction<DeleteSectionPayload>) => {
      const composition = state.compositions.find(
        (composition) => composition.id === action.payload.compositionId
      );
      if (!composition) {
        console.warn("non-existent composition referenced in action payload");
        return state;
      }

      composition.clips = deleteSectionFromClips(
        composition.clips,
        action.payload.startTimeSeconds,
        action.payload.endTimeSeconds
      );
      const newCompositions = state.compositions.filter(
        (c) => c.id !== composition.id
      );
      newCompositions.push(composition);
      state.compositions = newCompositions;
    },
    tightenSection: (state, action: PayloadAction<TightenSectionPayload>) => {
      const composition = state.compositions.find(
        (composition) => composition.id === action.payload.compositionId
      );
      if (!composition) {
        console.warn("non-existent composition referenced in action payload");
        return state;
      }
      let newClips: Clip[] = [];
      let nextStartTime = 0;
      for (const clip of composition.clips) {
        const clipEndTime = nextStartTime + clip.durationSeconds;
        let file = state.files.find((f: KaveFile) => f.id === clip.sourceId);
        if (file) {
          newClips.push(clip);
          continue;
        }

        const seq = state.sequences.find(
          (s: Sequence) => s.id === clip.sourceId
        );
        if (!seq) {
          continue;
        }

        let userInteractionLog: UserInteractionLog | null = null;
        let userInteractionLogAlignment: number | null = null;
        for (const track of seq.tracks) {
          const trackFile: KaveFile | undefined = state.files.find(
            (f: KaveFile) => f.id === track.fileId
          );
          if (!trackFile) {
            continue;
          }
          if (trackFile.type === FileType.interaction_log) {
            userInteractionLog = trackFile.userInteractionLog!;
            userInteractionLogAlignment = track.alignmentSeconds;
            break;
          }
        }

        // the clip is completely outside of the selection
        if (
          (nextStartTime < action.payload.startTimeSeconds &&
            clipEndTime <= action.payload.startTimeSeconds) ||
          (nextStartTime >= action.payload.endTimeSeconds &&
            clipEndTime > action.payload.endTimeSeconds)
        ) {
          newClips.push(clip);
          nextStartTime = clipEndTime;
        } else if (
          nextStartTime > action.payload.startTimeSeconds &&
          clipEndTime < action.payload.endTimeSeconds
        ) {
          const result = getTightenedClips(
            clip,
            userInteractionLog!,
            userInteractionLogAlignment!
          );
          newClips = newClips.concat(result.clips);
          nextStartTime = result.nextClipStartSeconds;
        } else {
          // things get hairy, either the selection is completely within the clip (cutting it in two) or the selection cuts off part of the clip.
          let startTimeSeconds: number | undefined;
          let endTimeSeconds: number | undefined;
          if (
            action.payload.startTimeSeconds > nextStartTime &&
            action.payload.startTimeSeconds < clipEndTime
          ) {
            startTimeSeconds = action.payload.startTimeSeconds;
          }
          if (
            action.payload.endTimeSeconds > nextStartTime &&
            action.payload.endTimeSeconds < clipEndTime
          ) {
            endTimeSeconds = action.payload.endTimeSeconds;
          }
          const result = getTightenedClips(
            clip,
            userInteractionLog!,
            userInteractionLogAlignment!,
            startTimeSeconds,
            endTimeSeconds
          );
          newClips = newClips.concat(result.clips);
          nextStartTime = result.nextClipStartSeconds;
        }
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

export const {
  splitClip,
  updateClip,
  loadInteractionFile,
  deleteSection,
  tightenSection,
} = projectSlice.actions;
