import { createAppSlice } from "../app/createAppSlice";

import data from "../free-assets.json";

const initialState = {
  freeAssets: new Set(data),
};

export const freeAssetSlice = createAppSlice({
  name: "freeAssets",
  initialState,
  reducers: () => ({}),
  selectors: {
    selectIsFree: (counter, assetId: string) => counter.freeAssets.has(assetId),
    selectFreeAssets: (counter) => counter.freeAssets,
  },
});

export const { selectIsFree, selectFreeAssets } = freeAssetSlice.selectors;
