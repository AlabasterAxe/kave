export interface Clip {
  id: string;
  durationSeconds: number;
  fileUri: string;

  // This is how many seconds from the start of the file that the timeline element starts.
  fileOffsetSeconds: number;
}

export interface UserInteraction {
  date: Date;
  type: string;
}

export interface UserInteractionLog {
  // the alignment indicates where in the timeline (in seconds) the first user interaction should be placed.
  alignment: number;
  log: UserInteraction[];
}

export interface Timeline {
  clips: Clip[];
  durationSeconds: number;
  userInteractions: UserInteractionLog;
}
