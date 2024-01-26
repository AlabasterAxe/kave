export enum FileType {
  // can be used as clipref
  video,

  // cannot be used as clipref by itself
  interaction_log,
}

export interface KeyEventPayload {
  key: string;
  code: string;
}

export interface UserInteraction {
  time: number;
  type: string;
  x?: number;
  y?: number;
  payload?: KeyEventPayload;
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
  resolution: {x: number, y: number};
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

export type Clip = Readonly<{
  id: string;
  durationSeconds: number;

  // This can be a video file or a sequence.
  sourceId: string;

  // This is how many seconds from the start of the file that the timeline element starts.
  sourceOffsetSeconds: number;
}>;

export type Composition = Readonly<{
  id: string;
  clips: Clip[];
  resolution: {x: number, y: number};
}>;

export type KaveDoc = Readonly<{
  id: string;
  name: string;
  files: KaveFile[];
  sequences: Sequence[];
  compositions: Composition[];
}>;

export type Project = Readonly<{
  id: string;
  name: string;
}>;

export interface TimelineViewport {
  startTimeSeconds: number;
  endTimeSeconds: number;
}
