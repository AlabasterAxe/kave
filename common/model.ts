export interface Clip {
  id: number;
  duration: number;
  fileUri: string;

  // This is how many seconds from the start of the file that the timeline element starts.
  fileOffsetSeconds: number;
}

export interface Timeline {
  clips: Clip[];
}
