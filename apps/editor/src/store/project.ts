import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import {
  Clip,
  KaveFile,
  KaveDoc,
  Sequence,
  UserInteractionLog,
  FileType,
  InteractionLogFile,
  UserInteraction,
  Track,
  Project,
} from "kave-common";
import { readLocalStoreProjects, upsertLocalStoreProject } from "../persistence/local-storage-utils";

const INTERACTION_DURATION_SECONDS = 0.1;

function initialProject(): KaveDoc {
  const fileId = '74340fe5-c232-4de4-803e-42fafcd6de31';
  const userInteractionLogId = 'df805f00-4df7-4787-9a5d-9f067029bb3f';
  const sequenceId = '0ed26414-999f-4c82-9810-745d3a6c9ddb';
  const clipId1 = '3e3803ec-6b1c-4cf9-b699-43a1b57bb304';
  const projectId = '5e6ba258-22be-46fe-a50e-96b1e64191a2';

  return {
    id: projectId,
    name: "Initial Project",
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
            id: '2f0cafdb-7f8e-4117-8b8c-4f1baafaadb1',
            alignmentSeconds: 0,
            fileId: fileId,
          },
          {
            id: '32a4f95f-f24c-4e48-b1e7-c388dd3e10c0',
            alignmentSeconds: 5.5,
            fileId: userInteractionLogId,
          },
        ],
      },
    ],
  };
}

export function blankProject(projectId: string): KaveDoc {
  const sequenceId = uuidv4();
  const clipId1 = uuidv4();

  return {
    id: projectId,
    name: "Untitled",
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
          x: 1920,
          y: 1080,
        }
      },
    ],
    files: [
    ],
    sequences: [
      {
        id: sequenceId,
        tracks: [
        ],
      },
    ],
  };
}

function newProject(): KaveDoc {
  const videoFileId = 'ef0b60f4-08cd-45a1-8363-419a6dbc50dc';
  const userInteractionLogId = 'd8a111f3-8c5b-42cc-bd42-af1b059db41a';
  const sequenceId = 'e8c8e417-727c-4a8e-9e45-2a786f154010';
  const clipId1 = '21e5177e-c110-469f-bff5-843cc4a2c358';
  const projectId = '7dbcaf88-5984-4cf0-8110-1e6acf18b975';
  const track1Id = '3324f740-6cf7-4988-97ab-65bf34a3069c';
  const track2Id = 'd978b76a-5e47-4010-bacb-773b6444c305';

  return {
    id: projectId,
    name: "Take 6",
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
        fileUri: "/screen_recording.mp4",
        resolution: {
          x: 2558,
          y: 1316,
        },
      },
      {
        id: userInteractionLogId,
        type: FileType.interaction_log,
        fileUri: "/interaction_events.json",
      },
    ],
    sequences: [
      {
        id: sequenceId,
        tracks: [
          {
            id: track1Id,
            alignmentSeconds: 0,
            fileId: videoFileId,
          },
          {
            id: track2Id,
            alignmentSeconds: -17.1,
            fileId: userInteractionLogId,
          },
        ],
      },
    ],
  };
}

function take_7(): KaveDoc {
  const videoFileId = '1fb7df05-fb97-4d45-82f6-d01f394b2797';
  const userInteractionLogId = '4ab6a265-b9a5-44e1-83d6-f746ae023a49';
  const sequenceId = 'fb4b1d99-4104-4002-ac22-38697eedc9c8';
  const clipId1 = '529d7130-c065-4533-8bbb-228f251e2cfc';
  const projectId = 'b37fefab-792f-4e9e-bc98-73900b5b3d3e';
  const track1Id = '3118a8c0-b387-4497-aba6-5559e8eed9c9';
  const track2Id = 'ae6927cd-d9a4-4127-8300-a2d1e958b851';

  return {
    id: projectId,
    name: "Take 7",
    compositions: [
      {
        id: "ac7c3a24-e08d-4bb6-b1fe-02960b41b870",
        clips: [
          {
            id: clipId1,
            durationSeconds: 300,
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
        fileUri: "/media/take_7/screen_recording.mp4",
        resolution: {
          x: 2558,
          y: 1318,
        },
      },
      {
        id: userInteractionLogId,
        type: FileType.interaction_log,
        fileUri: "/media/take_7/interaction_events.json",
      },
    ],
    sequences: [
      {
        id: sequenceId,
        tracks: [
          {
            id: track1Id,
            alignmentSeconds: -10.5,
            fileId: videoFileId,
          },
          {
            id: track2Id,
            alignmentSeconds: 0,
            fileId: userInteractionLogId,
          },
        ],
      },
    ],
  };
}

export const ALL_PROJECTS = [initialProject(), newProject(), take_7()];

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
  project: KaveDoc;
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
  doc: KaveDoc,
  compositionId: string,
  deletionStartTimeSeconds: number,
  deletionEndTimeSeconds: number
): KaveDoc => {
  const composition = doc.compositions.find((c)=>c.id === compositionId);
  if (!composition) {
    return doc;
  }
  const newClips: Clip[] = [];
  let clipStartTime = 0;
  for (const clip of composition.clips) {
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
  return {
    ...doc,
    compositions: doc.compositions.map((composition) => {
      if (composition.id === doc.compositions[0].id) {
        return { ...composition, clips: newClips };
      } else {
        return composition;
      }
    }),
  };
};

export function updateInteractionLogOffset(state: KaveDoc, clipId: string, delta: number): KaveDoc {
  const composition = state.compositions.find((composition) => composition.clips.find((clip) => clip.id === clipId));
  if (!composition) {
    console.warn("non-existent composition referenced in action payload");
    return state;
  }
  const clip = composition.clips.find((clip) => clip.id === clipId);

  if (!clip) {
    console.warn("non-existent clip referenced in action payload");
    return state;
  }

  const sequence = state.sequences.find((f) => f.id === clip.sourceId);

  if (!sequence) {
    return state;
  }

  let newTrack: Track | undefined;
  for (const track of sequence.tracks) {
    const file = state.files.find((f) => f.id === track.fileId);
    if (file?.type === FileType.interaction_log) {
      newTrack = { ...track, alignmentSeconds: track.alignmentSeconds + delta };
      break;
    }
  }
  return {
    ...state,
    sequences: state.sequences.filter((s) => s.id !== sequence.id).concat({
      ...sequence,
      tracks: sequence.tracks.filter((t) => t.id !== newTrack?.id).concat(newTrack!),
    }),
  }
}

export function getInteractionLogForSourceId(
  state: KaveDoc,
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
  project: KaveDoc,
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
  project: KaveDoc,
  clip: Clip
): {
  log: UserInteraction[],
  logClipOffsetSeconds: number,
} | undefined {
  const sequence = project.sequences.find((f) => f.id === clip.sourceId);

  if (!sequence) {
    return undefined;
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
    return undefined;
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

  return {
    log: interactionLogEvents ?? [],
    logClipOffsetSeconds: interactionLogOffset,
  };
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

export interface RouterState {
  activeProjectId: string | undefined;
  activeCompositionId: string | undefined;
}

export const routerSlice = createSlice({
  name: "router",
  initialState: {
    activeProjectId: undefined,
    // TODO: fix this
    activeCompositionId: "ac7c3a24-e08d-4bb6-b1fe-02960b41b870",
  } as RouterState,
  reducers: {
    setActiveProjectId: (state, action: PayloadAction<string | undefined>) => {
      state.activeProjectId = action.payload;
    },
    setActiveCompositionId: (state, action: PayloadAction<string | undefined>) => {
      state.activeCompositionId = action.payload;
    },
  },
});

export const projectsSlice = createSlice({
  name: "projects",
  initialState: readLocalStoreProjects().reduce((acc: Record<string, Project>, project) => {
    acc[project.id] = project;
    return acc;
  },{}),
  reducers: {
    upsertProject: (state, action: PayloadAction<Project>) => {
      state[action.payload.id] = action.payload;
      upsertLocalStoreProject(action.payload);
    },
  },
});

export const tempDocumentSlice = createSlice({
  name: "tempDocument",
  initialState: null as KaveDoc | null,
  reducers: {
    setTempDoc: (state, action: PayloadAction<KaveDoc | undefined>) => {
      return action.payload ?? null;
    },
  },
});

export const documentSlice = createSlice({
  name: "document",
  // This is null because undoable does something weird with undefined values when you attempt to clear the state
  initialState: null as KaveDoc | null,
  reducers: {
    replaceDocument: (_, action: PayloadAction<ReplaceProjectPayload>) => {
      return action.payload.project;
    },
    addFileToDefaultSequence: (state, action: PayloadAction<KaveFile>) => {
      if (!state) {
        return state;
      }
      const [sequence] = state.sequences;
      if (!sequence) {
        return state;
      }
      sequence.tracks.push({
        id: uuidv4(),
        alignmentSeconds: 0,
        fileId: action.payload.id,
      });
      state.files.push(action.payload);

      if (action.payload.type === FileType.interaction_log) {
        let minEventTimeSeconds: number | undefined;
        let maxEventTimeSeconds: number | undefined;
        action.payload.userInteractionLog?.log.forEach((event) => {
          const eventTimeSeconds = event.time / 1000;
          if (!minEventTimeSeconds || eventTimeSeconds < minEventTimeSeconds) {
            minEventTimeSeconds = eventTimeSeconds;
          }
          if (!maxEventTimeSeconds || eventTimeSeconds > maxEventTimeSeconds) {
            maxEventTimeSeconds = eventTimeSeconds;
          }
        });
        const [compositions] = state.compositions;
        if (!compositions) {
          return state;
        }

        const [clip] = compositions.clips;
        clip.durationSeconds = maxEventTimeSeconds! - minEventTimeSeconds!;
      }
    },
    updateInteractionLogOffsetAction: (state, action: PayloadAction<{ clipId: string; delta: number }>) => {
      if (!state) {
        return state;
      }
      return updateInteractionLogOffset(state, action.payload.clipId, action.payload.delta);
    },
    splitClip: (state, action: PayloadAction<SplitClipPayload>) => {
      if (!state) {
        return state;
      }
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
      if (!state) {
        return state;
      }
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
      if (!state) {
        return state;
      }
      const composition = state.compositions.find(
        (composition) => composition.id === action.payload.compositionId
      );
      if (!composition) {
        console.warn("non-existent composition referenced in action payload");
        return state;
      }

      return deleteSectionFromClips(
        state,
        composition.id,
        action.payload.startTimeSeconds,
        action.payload.endTimeSeconds
      );
    },
    tightenSection: (state, action: PayloadAction<TightenSectionPayload>) => {
      if (!state) {
        return state;
      }
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
      if (!state) {
        return state;
      }
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
      if (!state) {
        return state;
      }
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
  replaceDocument,
  smoothInteractions,
  addFileToDefaultSequence,
  updateInteractionLogOffsetAction,
} = documentSlice.actions;

export const {
  setActiveProjectId,
  setActiveCompositionId,
} = routerSlice.actions;

export const {
  upsertProject,
} = projectsSlice.actions;

export const {
  setTempDoc,
} = tempDocumentSlice.actions;