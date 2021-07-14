export enum FileType {
  // can be used as clipref
  video,

  // cannot be used as clipref by itself
  interaction_log,
}

export interface UserInteraction {
  timestampMillis: number;
  type: string;
}

export interface UserInteractionLog {
  log: UserInteraction[];
}

export interface FileBase {
  id: string;
  type: FileType;

  fileUri?: string;

  // this is slightly gross. I'd like to have a more generic way to represent the user interaction log.
  userInteractionLog?: UserInteractionLog;
}

export interface VideoFile extends FileBase {
  type: FileType.video;
  fileUri: string;
}

export interface InteractionLogFile extends FileBase {
  type: FileType.interaction_log;
  userInteractionLog?: UserInteractionLog;
  fileUri?: string;
}

export type KaveFile = VideoFile | InteractionLogFile;

export interface Track {
  id: string;
  fileId: string;

  // The alignment of this file relative to the sequence, must be positive.
  alignmentSeconds: number;
}

export interface Sequence {
  id: string;
  tracks: Track[];
}

export interface Clip {
  id: string;
  durationSeconds: number;

  // This can be a video file or a sequence.
  sourceId: string;

  // This is how many seconds from the start of the file that the timeline element starts.
  sourceOffsetSeconds: number;
}

export interface Composition {
  id: string;
  clips: Clip[];
  durationSeconds: number;
}

export interface Project {
  id: string;
  files: KaveFile[];
  sequences: Sequence[];
  compositions: Composition[];
}

export interface TimelineViewport {
  startTimeSeconds: number;
  endTimeSeconds: number;
}
