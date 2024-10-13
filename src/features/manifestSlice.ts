import { createSelector, PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../app/createAppSlice";

import data from "../free-assets.json";

const freeAssets: Record<string, boolean> = {};

data.forEach((v) => {
  freeAssets[v] = true;
});

interface RawAsset {
  hash: string;
  bytes: number;
}

interface RawResoRecord {
  id: string;
  assetUri: string;
  name: string;
  recordType: "object" | "world" | "audio" | "texture";
  ownerName: string;
  path: string;
  thumbnailUri: string;
  isPublic: boolean;
  creationTime: string;
  lastModificationTime: string;
  assetManifest: Array<RawAsset>;
}

export interface ResoRecord {
  id: string;
  assetUri: string;
  name: string;
  recordType: "object" | "world" | "audio" | "texture";
  ownerName: string;
  path: string;
  thumbnailUri: string;
  isPublic: boolean;
  creationTime: string;
  lastModificationTime: string;
  totalSize: number;
  assets: Array<string>;
}

export interface ResoAsset {
  hash: string;
  bytes: number;
  free: boolean;
  records: Array<string>;
}

interface ManifestState {
  records: Record<string, ResoRecord>;
  assets: Record<string, ResoAsset>;
}

const initialState: ManifestState = {
  records: {},
  assets: {},
};

export const manifestSlice = createAppSlice({
  name: "manifest",
  initialState,
  reducers: (create) => ({
    unloadManifest: create.reducer((state) => {
      Object.assign(state, initialState);
    }),
    loadManifest: create.reducer(
      (state, action: PayloadAction<Array<RawResoRecord>>) => {
        Object.assign(state, initialState);

        action.payload.forEach((rec) => {
          const stateRecord: ResoRecord = (state.records[rec.id] = {
            id: rec.id,
            assetUri: rec.assetUri,
            name: rec.name,
            recordType: rec.recordType,
            ownerName: rec.ownerName,
            path: rec.path,
            thumbnailUri: rec.thumbnailUri,
            isPublic: rec.isPublic,
            creationTime: rec.creationTime,
            lastModificationTime: rec.lastModificationTime,
            totalSize: 0,
            assets: [],
          });

          rec.assetManifest.forEach((asset) => {
            const stateAsset =
              state.assets[asset.hash] ??
              (state.assets[asset.hash] = {
                hash: asset.hash,
                bytes: asset.bytes,
                free: freeAssets[asset.hash] ?? false,
                records: [],
              });
            stateAsset.records.push(rec.id);
            stateRecord.assets.push(asset.hash);
            stateRecord.totalSize += asset.bytes;
          });
        });
      }
    ),
  }),
  selectors: {
    manifestLoaded: (m) => Object.keys(m.records).length !== 0,
    records: (m) => Object.values(m.records),
    record: (m, id) => m.records[id],
    assets: (m) => Object.values(m.assets),
    asset: (m, id) => m.assets[id],
  },
});

export const records = createSelector(
  [manifestSlice.selectors.records],
  (r) => r
);
export const assets = createSelector(
  [manifestSlice.selectors.assets],
  (a) => a
);

export const { loadManifest, unloadManifest } = manifestSlice.actions;
export const { manifestLoaded, record, asset } = manifestSlice.selectors;
