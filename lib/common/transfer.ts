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
  magnification?: number;
}
