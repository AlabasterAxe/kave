import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Selection {
  // these are global values
  startTimeSeconds: number;
  endTimeSeconds: number;
}

export interface SelectionState {
  selection: Selection | undefined;
}

export const selectionSlice = createSlice({
  name: "selection",
  initialState: { selection: undefined },
  reducers: {
    setSelection: (
      state: SelectionState,
      action: PayloadAction<Selection | undefined>
    ) => {
      state.selection = action.payload;
    },
  },
});

export const { setSelection } = selectionSlice.actions;
