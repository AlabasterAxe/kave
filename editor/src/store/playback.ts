import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum PlayingState {
  stopped = "stopped",
  paused = "paused",
  playing = "playing",
}

export enum PlaybackStateSource {
  player = "player",
  timeline = "timeline",
  keyboard = "keyboard",
  initial = "initial",
}

export interface PlaybackState {
  currentTimeSeconds: number;
  state: PlayingState;
  source: PlaybackStateSource;
}

const initialPlayback = (): PlaybackState => ({
  currentTimeSeconds: 0,
  state: PlayingState.stopped,
  source: PlaybackStateSource.initial,
});

interface BasePlaybackActionPayload {
  source: PlaybackStateSource;
}

export interface UpdatePlayheadPayload extends BasePlaybackActionPayload {
  currentTimeSeconds: number;
}

export interface SetPlaybackStatePayload extends BasePlaybackActionPayload {
  state: PlayingState;
}

export const playbackSlice = createSlice({
  name: "playback",
  initialState: initialPlayback(),
  reducers: {
    updatePlayhead: (state, action: PayloadAction<UpdatePlayheadPayload>) => {
      state.currentTimeSeconds = action.payload.currentTimeSeconds;
      state.source = action.payload.source;
    },
    togglePlaybackState: (
      state,
      action: PayloadAction<BasePlaybackActionPayload>
    ) => {
      state.source = action.payload.source;
      switch (state.state) {
        case PlayingState.stopped:
          state.currentTimeSeconds = 0;
          state.state = PlayingState.playing;
          break;
        case PlayingState.playing:
          state.state = PlayingState.paused;
          break;
        case PlayingState.paused:
          state.state = PlayingState.playing;
          break;
      }
    },
    play: (state, action: PayloadAction<BasePlaybackActionPayload>) => {
      state.source = action.payload.source;
      state.state = PlayingState.playing;
    },
    pause: (state, action: PayloadAction<BasePlaybackActionPayload>) => {
      state.source = action.payload.source;
      state.state = PlayingState.paused;
    },
    stop: (state) => {
      state = initialPlayback();
    },
  },
});

export const { updatePlayhead, pause, stop, play, togglePlaybackState } =
  playbackSlice.actions;
