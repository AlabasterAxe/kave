import {
  Action,
  AnyAction,
  configureStore,
  ConfigureStoreOptions,
  Store,
} from "@reduxjs/toolkit";
import { playbackSlice, PlaybackState } from "./playback";
import {
  deleteSection,
  projectSlice,
  tightenSection,
  replaceProject,
  getClipForTime,
  getInteractionLogForSourceId,
  smoothInteractions,
  RouterState,
  routerSlice,
  setActiveProjectId,
} from "./project";
import { thunk, ThunkAction, ThunkDispatch } from "redux-thunk";
import { selectionSlice, SelectionState, setSelection } from "./selection";
import undoable, { ActionCreators, StateWithHistory } from "redux-undo";
import { Trimerger } from "../persistence/trimerge-sync";
import { create } from "jsondiffpatch";
import { Project, UserInteraction } from "../../../../lib/common/dist";

export const selectActiveCompositionId = (state: RootState) => state.router.activeCompositionId;
export const selectActiveProjectId = (state: RootState) => state.router.activeProjectId;
export const selectPlayback = (state: RootState) => state.playback;
export const selectProject = (state: RootState) => state.project.present;
export const selectSelection = (state: RootState) => state.selection.selection;

export function selectCursorLocation(
  state: RootState
): { x: number; y: number } | undefined {
  const activeCompositionId = selectActiveCompositionId(state);
  const playback = selectPlayback(state);
  const project = selectProject(state);

  if (!activeCompositionId || !project) {
    return undefined;
  }

  const { clip, offset: clipPlayheadOffset } =
    getClipForTime(project, activeCompositionId, playback.currentTimeSeconds) ?? {};

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
  const activeCompositionId = selectActiveCompositionId(state);
  const project = selectProject(state);
  const selection = selectSelection(state);

  if (!selection || !activeCompositionId || !project) {
    return [];
  }

  const { clip: startClip, offset: selectionStartClipOffset } =
    getClipForTime(project, activeCompositionId, selection.startTimeSeconds) ?? {};
  const { clip: endClip, offset: selectionEndClipOffset } =
    getClipForTime(project, activeCompositionId, selection.endTimeSeconds) ?? {};

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
  if (!file?.userInteractionLog || interactionLogSourceOffset === undefined) {
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
  playback: PlaybackState;
  project: StateWithHistory<Project|null>;
  router: RouterState;
  selection: SelectionState;
}

const projectMiddleware = (store: Store) => (next: any) => (action: Action) => {
  const result = next(action);
  if (action.type === setActiveProjectId.type && (action as any).payload.initialize) {
    const projects = JSON.parse(localStorage.getItem('projects') ?? "[]") as {id: string, name: string}[];
    projects.push({
      id: (action as any).payload.projectId,
      name: "Untitled",
    });
    localStorage.setItem('projects', JSON.stringify(projects));
  }

  return result;
};

export const store = configureStore({
  reducer: {
    playback: playbackSlice.reducer,
    project: undoable<Project|null>(projectSlice.reducer),
    selection: selectionSlice.reducer,
    router: routerSlice.reducer,
  },
  middleware: [thunk, trimerger.middleware, projectMiddleware],
} as ConfigureStoreOptions);

trimerger.subscribeDoc((project) => {
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
      dispatch(
        deleteSection({
          compositionId: compositionId,
          startTimeSeconds: startTimeSeconds,
          endTimeSeconds: endTimeSeconds,
        })
      );
      dispatch(setSelection(undefined));
  };
}


export async function setActiveProject(dispatch: (action: any) => void, projectId: string): Promise<void> {
  dispatch(ActionCreators.clearHistory());
  await trimerger.setActiveProject(projectId);
  dispatch(setActiveProjectId(projectId));
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
