export declare enum FileType {
    video = 0,
    interaction_log = 1
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
export declare type KaveFile = VideoFile | InteractionLogFile;
export interface Track {
    id: string;
    fileId: string;
    alignmentSeconds: number;
}
export interface Sequence {
    id: string;
    tracks: Track[];
}
export declare type Clip = Readonly<{
    id: string;
    durationSeconds: number;
    sourceId: string;
    sourceOffsetSeconds: number;
}>;
export declare type Composition = Readonly<{
    id: string;
    clips: Clip[];
}>;
export declare type Project = Readonly<{
    id: string;
    files: KaveFile[];
    sequences: Sequence[];
    compositions: Composition[];
}>;
export interface TimelineViewport {
    startTimeSeconds: number;
    endTimeSeconds: number;
}
