import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ActiveComposition {
  id: string;
}

function initialComposition(): ActiveComposition {
  return {
    id: "ac7c3a24-e08d-4bb6-b1fe-02960b41b870",
  };
}

export interface SelectCompositionPayload {
  id: string;
}

export const compositionSlice = createSlice({
  name: "composition",
  initialState: initialComposition(),
  reducers: {
    selectComposition: (state, action: PayloadAction<string>) => {},
  },
});
