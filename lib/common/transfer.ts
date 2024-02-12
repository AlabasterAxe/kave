import { UserInteraction } from "./model";

export enum RunStatus {
  running = "running",
  paused = "paused",
  cancelled = "cancelled",
  finished = "finished",
}

export interface RunInfo { totalFrameCount: number, frameIndex: number, status: RunStatus, }

export interface RunRequest {
  events: UserInteraction[];
  render: boolean;
  target: string;
  username?: string;
  password?: string;
  authTarget?: string;

  // The magnification factor to use when rendering the video.
  magnification?: number;

  // The measured devicePixelRatio of the device that generated the interaction log.
  // this number is a combination of the "native" devicePixelRatio and the zoom level of the browser.
  devicePixelRatio?: number;

  // The zoom level of the browser when the interaction log was recorded.
  originalZoom?: number

  // The size of the browser window when the interaction log was recorded.
  resolution?: { x: number, y: number };
}
