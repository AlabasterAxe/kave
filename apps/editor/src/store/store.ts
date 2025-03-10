import {
  Action,
  AnyAction,
  configureStore,
  ConfigureStoreOptions,
  Store,
} from "@reduxjs/toolkit";
import {
  getClipForTime,
  getInteractionLogForSourceId,
  KaveDoc,
  Project,
  UserInteraction,
} from "kave-common";
import { thunk, ThunkAction, ThunkDispatch } from "redux-thunk";
import undoable, { ActionCreators, StateWithHistory } from "redux-undo";
import {
  readLocalStoreProjects,
  upsertLocalStoreProject,
} from "../persistence/local-storage-utils";
import { playbackSlice, PlaybackState } from "./playback";
import {
  blankProject,
  deleteSection,
  documentSlice,
  projectsSlice,
  replaceDocument,
  routerSlice,
  RouterState,
  setActiveProjectId,
  setTempDoc,
  smoothInteractions,
  tempDocumentSlice,
  tightenSection,
} from "./project";
import { selectionSlice, SelectionState, setSelection } from "./selection";

export const selectActiveCompositionId = (state: RootState) =>
  state.router.activeCompositionId;
export const selectActiveProjectId = (state: RootState) =>
  state.router.activeProjectId;
export const selectPlayback = (state: RootState) => state.playback;

/** This document represents the most up-to-date document we're aware of. This includes ephemeral operations
 *  such as the user drag operations. It should not be used to compute new states. */
export const selectDocument = (state: RootState) =>
  state.tempDocument ?? state.document.present;

/** This document represents a version of the document that has been persisted but it may not represent
 *  ephemeral operations such as drag events.
 */
export const selectPersistedDocument = (state: RootState) =>
  state.document.present;
export const selectProjects = (state: RootState) => state.projects;
export const selectSelection = (state: RootState) => state.selection.selection;

export function selectCursorLocation(
  state: RootState,
): { x: number; y: number } | undefined {
  const activeCompositionId = selectActiveCompositionId(state);
  const playback = selectPlayback(state);
  const project = selectDocument(state);

  if (!activeCompositionId || !project) {
    return undefined;
  }

  const { clip, offset: clipPlayheadOffset } =
    getClipForTime(project, activeCompositionId, playback.currentTimeSeconds) ??
      {};

  if (!clip || !clipPlayheadOffset) {
    return undefined;
  }

  const { file, offset: interactionLogSourceOffset } =
    getInteractionLogForSourceId(project, clip.sourceId) ?? {};
  if (!file?.userInteractionLog || interactionLogSourceOffset === undefined) {
    return undefined;
  }

  const sourcePlayheadOffset = clip.sourceOffsetSeconds + clipPlayheadOffset;
  const interactionLogPlayheadOffset = sourcePlayheadOffset -
    interactionLogSourceOffset;
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
  state: RootState,
): UserInteraction[] {
  const activeCompositionId = selectActiveCompositionId(state);
  const project = selectDocument(state);
  const selection = selectSelection(state);

  if (!selection || !activeCompositionId || !project) {
    return [];
  }

  const { clip: startClip, offset: selectionStartClipOffset } =
    getClipForTime(project, activeCompositionId, selection.startTimeSeconds) ??
      {};
  const { clip: endClip, offset: selectionEndClipOffset } =
    getClipForTime(project, activeCompositionId, selection.endTimeSeconds) ??
      {};

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
          (selection.endTimeSeconds - selection.startTimeSeconds),
      ) > 0.1
  ) {
    throw new Error("mismatched clips");
  }

  const { file, offset: interactionLogSourceOffset } =
    getInteractionLogForSourceId(project, startClip.sourceId) ?? {};
  if (!file?.userInteractionLog || interactionLogSourceOffset === undefined) {
    return [];
  }

  const sourceSelectionStartOffset = startClip.sourceOffsetSeconds +
    selectionStartClipOffset;
  const sourceSelectionEndOffset = startClip.sourceOffsetSeconds +
    selectionEndClipOffset;
  const interactionLogSelectionStartOffset = sourceSelectionStartOffset -
    interactionLogSourceOffset;
  const interactionLogSelectionEndOffset = sourceSelectionEndOffset -
    interactionLogSourceOffset;
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

export interface RootState {
  playback: PlaybackState;
  document: StateWithHistory<KaveDoc | null>;
  tempDocument: KaveDoc | undefined;
  router: RouterState;
  selection: SelectionState;
  projects: Record<string, Project>;
}

const sideEffectMiddleware =
  (store: Store) => (next: any) => (action: Action) => {
    const preState = store.getState();
    const result = next(action);
    const postState: RootState = store.getState();

    // if anything sets the actual document clear the temp document
    // not sure if this is valid in a multi-user context
    if (preState.document.present !== postState.document.present) {
      store.dispatch(setTempDoc(undefined));
    }

    switch (action.type) {
      case setActiveProjectId.type:
        const projs = readLocalStoreProjects();
        let project = projs.find((p) =>
          p.id === (action as any).payload
        ) as KaveDoc;

        if (!project) {
          project = blankProject((action as any).payload.projectId);
          upsertLocalStoreProject(project);
        }
        store.dispatch(replaceDocument({ project }));
        break;
      default:
        break;
    }

    return result;
  };

export const store = configureStore({
  reducer: {
    playback: playbackSlice.reducer,
    document: undoable<KaveDoc | null>(documentSlice.reducer),
    selection: selectionSlice.reducer,
    router: routerSlice.reducer,
    projects: projectsSlice.reducer,
    tempDocument: tempDocumentSlice.reducer,
  },
  middleware: [thunk, sideEffectMiddleware],
} as ConfigureStoreOptions);

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
      }),
    );
    dispatch(setSelection(undefined));
  };
}

export async function setActiveProject(
  dispatch: (action: any) => void,
  projectId: string,
): Promise<void> {
  dispatch(ActionCreators.clearHistory());
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
      }),
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
}): ThunkAction<void, RootState, unknown, AnyAction> {
  return (dispatch: (action: any) => void, getState: () => RootState) => {
    dispatch(
      smoothInteractions({
        compositionId: compositionId,
        startTimeSeconds: startTimeSeconds,
        endTimeSeconds: endTimeSeconds,
      }),
    );
    dispatch(setSelection(undefined));
  };
}

export type AppDispatch = ThunkDispatch<any, any, AnyAction>;
