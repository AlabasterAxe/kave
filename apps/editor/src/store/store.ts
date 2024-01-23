import {
  AnyAction,
  configureStore,
  ConfigureStoreOptions,
} from "@reduxjs/toolkit";
import { playbackSlice, PlaybackState } from "./playback";
import { ActiveComposition, compositionSlice } from "./composition";
import {
  deleteSection,
  projectSlice,
  tightenSection,
  replaceProject,
  getClipForTime,
  getInteractionLogForSourceId,
  smoothInteractions,
} from "./project";
import { thunk, ThunkAction, ThunkDispatch } from "redux-thunk";
import { selectionSlice, SelectionState, setSelection } from "./selection";
import { batch } from "react-redux";
import undoable, { StateWithHistory } from "redux-undo";
import { Trimerger } from "../persistence/trimerge-sync";
import { create } from "jsondiffpatch";
import { Project, UserInteraction } from "../../../../lib/common/dist";

export const selectComposition = (state: RootState) => state.composition;
export const selectPlayback = (state: RootState) => state.playback;
export const selectProject = (state: RootState) => state.project.present;
export const selectSelection = (state: RootState) => state.selection.selection;

export function selectCursorLocation(
  state: RootState
): { x: number; y: number } | undefined {
  const composition = selectComposition(state);
  const playback = selectPlayback(state);
  const project = selectProject(state);
  const { clip, offset: clipPlayheadOffset } =
    getClipForTime(project, composition.id, playback.currentTimeSeconds) ?? {};

  if (!clip || !clipPlayheadOffset) {
    return undefined;
  }

  const { file, offset: interactionLogSourceOffset } =
    getInteractionLogForSourceId(project, clip.sourceId) ?? {};
  if (!file?.userInteractionLog || interactionLogSourceOffset === undefined) {
    return undefined;
  }

  const sourcePlayheadOffset = clip.sourceOffsetSeconds + clipPlayheadOffset;
  const interactionLogPlayheadOffset =
    sourcePlayheadOffset - interactionLogSourceOffset;
  let lastInteractionLogEvent: UserInteraction | undefined;
  const MARGIN_SECONDS = 2;
  for (const event of file.userInteractionLog.log) {
    const eventTimeSeconds = event.time / 1000;
    if (
      eventTimeSeconds > interactionLogPlayheadOffset - MARGIN_SECONDS &&
      eventTimeSeconds < interactionLogPlayheadOffset
    ) {
      lastInteractionLogEvent = event;
    } else if (eventTimeSeconds > interactionLogPlayheadOffset) {
      break;
    }
  }

  if (!lastInteractionLogEvent?.x || !lastInteractionLogEvent?.y) {
    return undefined;
  }

  return { x: lastInteractionLogEvent.x, y: lastInteractionLogEvent.y };
}

export function selectSelectionUserInteractions(
  state: RootState
): UserInteraction[] {
  const composition = selectComposition(state);
  const project = selectProject(state);
  const selection = selectSelection(state);

  if (!selection) {
    return [];
  }

  const { clip: startClip, offset: selectionStartClipOffset } =
    getClipForTime(project, composition.id, selection.startTimeSeconds) ?? {};
  const { clip: endClip, offset: selectionEndClipOffset } =
    getClipForTime(project, composition.id, selection.endTimeSeconds) ?? {};

  // TODO: this can probably be handled better
  if (
    !startClip ||
    !endClip ||
    !selectionStartClipOffset ||
    !selectionEndClipOffset
  ) {
    return [];
  }

  // TODO: handle mismatched clips
  if (
    startClip?.id !== endClip?.id ||
    Math.abs(
      selectionEndClipOffset -
        selectionStartClipOffset -
        (selection.endTimeSeconds - selection.startTimeSeconds)
    ) > 0.1
  ) {
    throw new Error("mismatched clips");
  }

  const { file, offset: interactionLogSourceOffset } =
    getInteractionLogForSourceId(project, startClip.sourceId) ?? {};
  if (!file?.userInteractionLog || !interactionLogSourceOffset) {
    return [];
  }

  const sourceSelectionStartOffset =
    startClip.sourceOffsetSeconds + selectionStartClipOffset;
  const sourceSelectionEndOffset =
    startClip.sourceOffsetSeconds + selectionEndClipOffset;
  const interactionLogSelectionStartOffset =
    sourceSelectionStartOffset - interactionLogSourceOffset;
  const interactionLogSelectionEndOffset =
    sourceSelectionEndOffset - interactionLogSourceOffset;
  const result: UserInteraction[] = [];
  for (const event of file.userInteractionLog.log) {
    const eventTimeSeconds = event.time / 1000;
    if (
      eventTimeSeconds > interactionLogSelectionStartOffset &&
      eventTimeSeconds < interactionLogSelectionEndOffset
    ) {
      result.push(event);
    } else if (eventTimeSeconds > interactionLogSelectionEndOffset) {
      break;
    }
  }

  return result;
}

const diffPatcher = create({ textDiff: { minLength: 20 } });

const trimerger = new Trimerger(diffPatcher);

export interface RootState {
  composition: ActiveComposition;
  playback: PlaybackState;
  project: StateWithHistory<Project>;
  selection: SelectionState;
}

export const store = configureStore({
  reducer: {
    composition: compositionSlice.reducer,
    playback: playbackSlice.reducer,
    project: undoable(projectSlice.reducer),
    selection: selectionSlice.reducer,
  },
  middleware: [thunk, trimerger.middleware],
} as ConfigureStoreOptions);

trimerger.client.subscribeState((project) => {
  if (project) {
    store.dispatch(replaceProject({ project }));
  }
});

export function deleteSelection({
  compositionId,
  startTimeSeconds,
  endTimeSeconds,
}: {
  compositionId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
}): ThunkAction<void, RootState, unknown, AnyAction> {
  return (dispatch: (action: any) => void) => {
    // should only result in one combined re-render, not two
    batch(() => {
      dispatch(
        deleteSection({
          compositionId: compositionId,
          startTimeSeconds: startTimeSeconds,
          endTimeSeconds: endTimeSeconds,
        })
      );
      dispatch(setSelection(undefined));
    });
  };
}

export function tightenSelection({
  compositionId,
  startTimeSeconds,
  endTimeSeconds,
}: {
  compositionId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
}): ThunkAction<void, RootState, unknown, AnyAction> {
  return (dispatch: (action: any) => void) => {
    // should only result in one combined re-render, not two
    dispatch(
      tightenSection({
        compositionId: compositionId,
        startTimeSeconds: startTimeSeconds,
        endTimeSeconds: endTimeSeconds,
      })
    );
    dispatch(setSelection(undefined));
  };
}

export function simplifySelectedMouseInteractions({
  compositionId,
  startTimeSeconds,
  endTimeSeconds,
}: {
  compositionId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
}): ThunkAction<
  void,
  RootState,
  unknown,
  AnyAction
> {
  return (dispatch: (action: any) => void, getState: () => RootState) => {
    dispatch(
      smoothInteractions({
        compositionId: compositionId,
        startTimeSeconds: startTimeSeconds,
        endTimeSeconds: endTimeSeconds,
      })
    );
    dispatch(setSelection(undefined));
  };
}

export type AppDispatch = ThunkDispatch<any, any, AnyAction>;
