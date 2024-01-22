import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import {
  Clip,
  KaveFile,
  Project,
  Sequence,
  UserInteractionLog,
  FileType,
  InteractionLogFile,
  UserInteraction,
  Track,
} from "kave-common";

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
        resolution: {
          x: 893,
          y: 480,
        }
      },
    ],
    files: [
      {
        id: fileId,
        type: FileType.video,
        fileUri: "test_video.m4v",
        resolution: {
          x: 893,
          y: 480,
        }
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

function newProject(): Project {
  const videoFileId = uuidv4();
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
            durationSeconds: 14,
            sourceId: sequenceId,
            sourceOffsetSeconds: 0,
          },
        ],
        resolution: {
          x: 2558,
          y: 1316,
        },
      },
    ],
    files: [
      {
        id: videoFileId,
        type: FileType.video,
        fileUri: "screen_recording.mp4",
        resolution: {
          x: 2558,
          y: 1316,
        },
      },
      {
        id: userInteractionLogId,
        type: FileType.interaction_log,
        fileUri: "interaction_events.json",
      },
    ],
    sequences: [
      {
        id: sequenceId,
        tracks: [
          {
            id: uuidv4(),
            alignmentSeconds: 0,
            fileId: videoFileId,
          },
          {
            id: uuidv4(),
            alignmentSeconds: -17.1,
            fileId: userInteractionLogId,
          },
        ],
      },
    ],
  };
}

function clipOffsetToInteractionLogOffset(
  clip: Clip,
  interactionLogTrack: Track,
  clipOffsetSeconds: number,
): number {
  return clip.sourceOffsetSeconds + clipOffsetSeconds - interactionLogTrack.alignmentSeconds;
}

export interface SplitClipPayload {
  compositionId: string;
  splitOffsetSeconds: number;
}

export interface ReplaceProjectPayload {
  project: Project;
}

export interface UpdateClipPayload {
  compositionId: string;
  clip: Clip;
}

export interface LoadInteractionFilePayload {
  fileId: string;
  interactionLog: UserInteractionLog;
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
  deletionStartTimeSeconds: number,
  deletionEndTimeSeconds: number
): Clip[] => {
  const newClips = [];
  let clipStartTime = 0;
  for (const clip of clips) {
    const clipEndTime = clipStartTime + clip.durationSeconds;
    // the clip is completely outside of the selection
    if (
      (clipStartTime <= deletionStartTimeSeconds &&
        clipEndTime <= deletionStartTimeSeconds) ||
      (clipStartTime >= deletionEndTimeSeconds &&
        clipEndTime >= deletionEndTimeSeconds)
    ) {
      newClips.push(clip);
    } else if (
      // the clip is completely within the selection so we don't even add the clip.
      clipStartTime > deletionStartTimeSeconds &&
      clipEndTime < deletionEndTimeSeconds
    ) {
      continue;
    } else {
      // things get hairy, either the selection is completely within the clip (cutting it in two) or the selection cuts off part of the clip.
      if (
        deletionStartTimeSeconds > clipStartTime &&
        deletionStartTimeSeconds < clipEndTime
      ) {
        const newClipDuration = deletionStartTimeSeconds - clipStartTime;
        newClips.push({
          ...clip,
          id: uuidv4(),
          durationSeconds: newClipDuration,
        });
      }
      if (
        deletionEndTimeSeconds > clipStartTime &&
        deletionEndTimeSeconds < clipEndTime
      ) {
        const newClipDuration = clipEndTime - deletionEndTimeSeconds;
        newClips.push({
          ...clip,
          durationSeconds: newClipDuration,
          sourceOffsetSeconds:
            clip.sourceOffsetSeconds + deletionEndTimeSeconds - clipStartTime,
        });
      }
    }
    clipStartTime = clipEndTime;
  }
  return newClips;
};

export function getInteractionLogForSourceId(
  state: Project,
  sourceId: string
): { file: InteractionLogFile; offset: number } | undefined {
  const sequence = state.sequences.find((f) => f.id === sourceId);

  if (!sequence) {
    return undefined;
  }

  let interactionLogFile: InteractionLogFile | undefined;
  const track = sequence.tracks.find((t) => {
    const file = state.files.find((f) => f.id === t.fileId);
    if (file?.type === FileType.interaction_log) {
      interactionLogFile = file;
      return true;
    }
    return false;
  });

  if (!interactionLogFile || !track) {
    return undefined;
  }

  return { file: interactionLogFile, offset: track.alignmentSeconds };
}

export function getClipForTime(
  project: Project,
  compositionId: string,
  time: number
): { clip: Clip; offset: number } | undefined {
  const comp = project.compositions.find((c) => c.id === compositionId);
  if (!comp) {
    return undefined;
  }
  let curTime = 0;
  for (const clip of comp.clips) {
    if (curTime + clip.durationSeconds > time) {
      return { clip, offset: time - curTime };
    }
    curTime += clip.durationSeconds;
  }
  return undefined;
}

export function getInteractionLogEventsForClip(
  project: Project,
  clip: Clip
): UserInteraction[] {
  const sequence = project.sequences.find((f) => f.id === clip.sourceId);

  if (!sequence) {
    return [];
  }

  let interactionLogFile: InteractionLogFile | undefined;
  const track = sequence.tracks.find((t) => {
    const file = project.files.find((f) => f.id === t.fileId);
    if (file?.type === FileType.interaction_log) {
      interactionLogFile = file;
      return true;
    }
    return false;
  });

  if (!interactionLogFile || !track) {
    return [];
  }

  const interactionLogOffset = clip.sourceOffsetSeconds - track.alignmentSeconds;
  const interactionLogEvents = interactionLogFile.userInteractionLog?.log.filter(
    (event) => {
      const eventTimeSeconds = event.time / 1000;
      return (
        eventTimeSeconds >= interactionLogOffset &&
        eventTimeSeconds <= interactionLogOffset + clip.durationSeconds
      );
    }
  );

  return interactionLogEvents ?? [];
}

/** This will replace the events in the specified range of the log file and replace them with the supplied events that occur within the specified time range.
 *  It doesn't attempt to do anything clever with the timestamps of the incoming events so it's possible that the new events will overlap with the old ones. 
 */
export function replaceInteractionLogRange(file: InteractionLogFile, startTimeSeconds: number, endTimeSeconds: number, newEvents: UserInteraction[]): InteractionLogFile {
  const logWithRemovedSection = file.userInteractionLog!.log.filter((event) => {
    const eventTimeSeconds = event.time / 1000;
    return eventTimeSeconds < startTimeSeconds || eventTimeSeconds > endTimeSeconds;
  });

  const eventsWithinRange = newEvents.filter((event) => {
    const eventTimeSeconds = event.time / 1000;
    return eventTimeSeconds >= startTimeSeconds && eventTimeSeconds <= endTimeSeconds;
  });

  logWithRemovedSection.push(...eventsWithinRange);
  logWithRemovedSection.sort((a, b) => a.time - b.time);
  return { ...file, userInteractionLog: { log: logWithRemovedSection } };
}

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
  const startTime = interactionLog.log[0].time;
  const interactionLogOffset =
    interactionLogAlignmentSeconds - clip.sourceOffsetSeconds;

  let interactionLogIndex = 0;
  let interactionLogTime = interactionLogOffset;
  while (interactionLogTime < durationSoFar) {
    interactionLogIndex++;
    interactionLogTime =
      (interactionLog.log[interactionLogIndex].time - startTime) / 1000 +
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
      (interactionLog.log[interactionLogIndex].time - startTime) / 1000 +
      interactionLogOffset;
    let newInteractionClipEndTime = interactionLogTime;
    let nextInteractionGap = 0;
    while (
      (!endTimeSeconds || newInteractionClipEndTime < endTimeSeconds) &&
      interactionLogIndex <= interactionLog.log.length - 1 &&
      nextInteractionGap < INTERACTION_DURATION_SECONDS
    ) {
      const currentInteractionTime =
        (interactionLog.log[interactionLogIndex].time - startTime) / 1000 +
        interactionLogOffset;
      newInteractionClipEndTime =
        currentInteractionTime + INTERACTION_DURATION_SECONDS;
      interactionLogIndex++;
      if (interactionLogIndex <= interactionLog.log.length - 1) {
        const nextInteractionTime =
          (interactionLog.log[interactionLogIndex].time - startTime) / 1000 +
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
  initialState: newProject(),
  reducers: {
    replaceProject: (_, action: PayloadAction<ReplaceProjectPayload>) => {
      return action.payload.project;
    },
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
          (nextStartTime <= action.payload.startTimeSeconds &&
            clipEndTime <= action.payload.startTimeSeconds) ||
          (nextStartTime >= action.payload.endTimeSeconds &&
            clipEndTime >= action.payload.endTimeSeconds)
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
    smoothInteractions: (state, action: PayloadAction<TightenSectionPayload>) => {
      const composition = state.compositions.find(
        (composition) => composition.id === action.payload.compositionId
      );
      if (!composition) {
        console.warn("non-existent composition referenced in action payload");
        return state;
      }
      
      let nextStartTime = 0;
      for (const clip of composition.clips) {
        const clipEndTime = nextStartTime + clip.durationSeconds;
        
        // before the selection
        if (clipEndTime < action.payload.startTimeSeconds) {
          nextStartTime = clipEndTime;
          continue;
        }

        // after the selection
        if (nextStartTime > action.payload.endTimeSeconds) {
          break;
        }

        // this clip doesn't have an interaction log
        let file = state.files.find((f: KaveFile) => f.id === clip.sourceId);
        if (file) {
          continue;
        }

        const seq = state.sequences.find(
          (s: Sequence) => s.id === clip.sourceId
        );

        // this clip doesn't have an interaction log
        if (!seq) {
          continue;
        }


        let interactionLogTrack: Track | undefined = undefined;
        let interactionLogFile: InteractionLogFile | undefined;
        for (const track of seq.tracks) {
          const trackFile: KaveFile | undefined = state.files.find(
            (f: KaveFile) => f.id === track.fileId
          );
          if (!trackFile) {
            continue;
          }
          if (trackFile.type === FileType.interaction_log) {
            interactionLogTrack = track;
            interactionLogFile = trackFile as InteractionLogFile;
            break;
          }
        }

        if (!interactionLogTrack || !interactionLogFile) {
          continue;
        }


        const selectionStartClipOffsetSeconds = action.payload.startTimeSeconds - nextStartTime;
        const selectionEndClipOffsetSeconds = action.payload.endTimeSeconds - nextStartTime;
        const selectionStartInteractionOffsetSeconds = clipOffsetToInteractionLogOffset(clip, interactionLogTrack, selectionStartClipOffsetSeconds);
        const selectionEndInteractionOffsetSeconds = clipOffsetToInteractionLogOffset(clip, interactionLogTrack, selectionEndClipOffsetSeconds);
        const newInteractionLogFile = replaceInteractionLogRange(interactionLogFile, selectionStartInteractionOffsetSeconds, selectionEndInteractionOffsetSeconds, []);
        
        state.files = state.files.map((file) => {
          if (file.id === interactionLogFile?.id) {
            return newInteractionLogFile;
          } else {
            return file;
          }
        });
      }
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
  replaceProject,
  smoothInteractions,
} = projectSlice.actions;
