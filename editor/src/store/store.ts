import {
  AnyAction,
  configureStore,
  ConfigureStoreOptions,
} from "@reduxjs/toolkit";
import { playbackSlice } from "./playback";
import { compositionSlice } from "./composition";
import {
  deleteSection,
  projectSlice,
  tightenSection,
  replaceProject,
} from "./project";
import { thunk, ThunkAction, ThunkDispatch } from "redux-thunk";
import { selectionSlice, setSelection } from "./selection";
import { batch } from "react-redux";
import undoable from "redux-undo";
import { Trimerger } from "../persistence/trimerge-sync";
import { create } from "jsondiffpatch";

export const selectComposition = (state: RootState) => state.composition;
export const selectPlayback = (state: RootState) => state.playback;
export const selectProject = (state: RootState) => state.project.present;
export const selectSelection = (state: RootState) => state.selection.selection;

const diffPatcher = create({ textDiff: { minLength: 20 } });

const trimerger = new Trimerger(diffPatcher);

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
      dispatch(setSelection(null));
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
    batch(() => {
      dispatch(
        tightenSection({
          compositionId: compositionId,
          startTimeSeconds: startTimeSeconds,
          endTimeSeconds: endTimeSeconds,
        })
      );
      dispatch(setSelection(null));
    });
  };
}

export type AppDispatch = ThunkDispatch<any, any, AnyAction>;
export type RootState = ReturnType<typeof store.getState>;
