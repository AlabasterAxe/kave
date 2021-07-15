import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Selection {
  // these are global values
  startTimeSeconds: number;
  endTimeSeconds: number;
}

export interface SelectionState {
  selection: Selection | null;
}

export const selectionSlice = createSlice({
  name: "selection",
  initialState: { selection: null },
  reducers: {
    setSelection: (state: SelectionState, action: PayloadAction<Selection>) => {
      state.selection = action.payload;
    },
  },
});

export const { setSelection } = selectionSlice.actions;
