import { createSelector, PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../app/createAppSlice";
import _ from "lodash";

import data from "../free-assets.json";

const freeAssets: Record<string, boolean> = {};

data.forEach((v) => {
  freeAssets[v] = true;
});

// Manifest types
type RawResoManifest = Array<RawResoRecord>;

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
  assetManifest: Array<RawResoAsset>;
}

interface RawResoAsset {
  hash: string;
  bytes: number;
}

// Exposed Interface Types

interface BaseResoRecord {
  id: string;
  assetUri: string;
  creationTime: string;

  sharedAssetBundles: Array<string>;
  internalAssets: Array<ResoAsset>;
  internalSize: number;
}

interface ObjectRecord extends BaseResoRecord {
  type: "object";
  fullName: string;
  name: string;
  path: Array<string>;
  thumbnailUri: string;
}

interface AudioRecord extends BaseResoRecord {
  type: "audio";
}

interface WorldRecord extends BaseResoRecord {
  type: "world";
  name: string;
}

interface TextureRecord extends BaseResoRecord {
  type: "texture";
  thumbnailUri: string;
}

export type ResoRecord =
  | ObjectRecord
  | AudioRecord
  | WorldRecord
  | TextureRecord;

export interface ResoAsset {
  hash: string;
  bytes: number;
  resoniteProvided: boolean;
}

export interface ResoAssetBundle {
  type: "assetBundle";
  id: string;
  size: number;
  assets: Array<ResoAsset>;
  recordIds: Array<string>;
  resoniteProvided: boolean;
}

function ToResoRecord(raw: RawResoRecord): ResoRecord {
  const common: BaseResoRecord = {
    id: raw.id,
    assetUri: raw.assetUri,
    creationTime: raw.creationTime,
    sharedAssetBundles: [],
    internalAssets: [],
    internalSize: 0,
  };
  switch (raw.recordType) {
    case "audio":
      return {
        ...common,
        type: "audio",
      };
    case "object":
      const path = raw.path ? raw.path.split("\\").slice(1) : [];
      return {
        ...common,
        type: "object",
        fullName: path.length > 0 ? path.join("/") + "/" + raw.name : raw.name,
        name: raw.name,
        path: path,
        thumbnailUri: raw.thumbnailUri,
      };
    case "world":
      return {
        ...common,
        type: "world",
        name: raw.name,
      };
    case "texture":
      return {
        ...common,
        type: "texture",
        thumbnailUri: raw.thumbnailUri,
      };
  }
}

interface ManifestState {
  records: Record<string, ResoRecord>;
  assets: Record<string, ResoAssetBundle>;
  // The selected records field is always sorted and unique.
  selectedRecords: Array<string>;
  error?: string;
  loading: boolean;
  filter: ManifestFilterOptions;
}

interface ManifestFilterOptions {
  showMessages: boolean;
  showObjects: boolean;
  showWorlds: boolean;
  showAvatar: boolean;
  showResoniteProvidedAssets: boolean;
}

const initialState: ManifestState = {
  records: {},
  assets: {},
  selectedRecords: [],
  loading: false,
  filter: {
    showMessages: true,
    showObjects: true,
    showWorlds: true,
    showAvatar: true,
    showResoniteProvidedAssets: false,
  },
};

export const manifestSlice = createAppSlice({
  name: "manifest",
  initialState,
  reducers: (create) => ({
    unloadManifest: create.reducer((state) => {
      Object.assign(state, initialState);
    }),
    loadManifest: create.asyncThunk(
      async (file: File) => {
        const text = await file.text();
        const records = JSON.parse(text) as RawResoManifest;

        const recordLookup: Record<string, ResoRecord> = {};
        const reverseAssetMap: Record<
          string,
          RawResoAsset & { free: boolean; records: Array<string> }
        > = {};

        records.forEach((rec) => {
          recordLookup[rec.id] = ToResoRecord(rec);

          rec.assetManifest.forEach((asset) => {
            const stateAsset =
              reverseAssetMap[asset.hash] ??
              (reverseAssetMap[asset.hash] = {
                hash: asset.hash,
                bytes: asset.bytes,
                free: freeAssets[asset.hash] ?? false,
                records: [],
              });
            stateAsset.records.push(rec.id);
          });
        });

        for (const aId in reverseAssetMap) {
          reverseAssetMap[aId].records.sort();
        }

        const groupedAssets = _.groupBy(
          Object.values(reverseAssetMap),
          (val) => `|${val.records.join("|")}|${val.free}`
        );

        const assetLookup: Record<string, ResoAssetBundle> = {};

        let bundleId = 0;

        for (const key in groupedAssets) {
          const group = groupedAssets[key];

          const initialAsset = group[0];

          // If the length is one, this is the internal record bundle.
          // Also filter on non-free only, as we want to include charged bytes only in the internal manifest.
          if (initialAsset.records.length === 1 && !initialAsset.free) {
            const record = recordLookup[initialAsset.records[0]];

            record.internalAssets = group.map((a) => ({
              hash: a.hash,
              bytes: a.bytes,
              resoniteProvided: a.free, // this should always be false.
            }));
            record.internalSize = record.internalAssets.reduce(
              (cur, a) => a.bytes + cur,
              0
            );
          } else {
            const bundleKey = bundleId++ + "";

            assetLookup[bundleKey] = {
              type: "assetBundle",
              id: bundleKey,
              size: group.reduce((cur, a) => a.bytes + cur, 0),
              assets: group.map((a) => ({
                hash: a.hash,
                bytes: a.bytes,
                resoniteProvided: a.free,
              })),
              // These two are group key derived, so only the first asset needs to be checked.
              recordIds: group[0].records,
              resoniteProvided: group[0].free,
            };

            for (const recordId of initialAsset.records) {
              recordLookup[recordId].sharedAssetBundles.push(bundleKey);
            }
          }
        }

        return {
          records: recordLookup,
          assets: assetLookup,
        };
      },
      {
        pending: (state) => {
          Object.assign(state, initialState);
          state.loading = true;
        },
        rejected: (state) => {
          Object.assign(state, initialState);
          state.error = "Error loading manifest.";
        },
        fulfilled: (state, action) => {
          Object.assign(state, initialState);

          state.records = action.payload.records;
          state.assets = action.payload.assets;
        },
      }
    ),
    updateFilter: create.reducer(
      (state, update: PayloadAction<Partial<ManifestFilterOptions>>) => {
        Object.assign(state.filter, update.payload);
      }
    ),
    toggleSelectRecord: create.reducer((state, update: PayloadAction<string>) => {
      const id = update.payload;
      if (!state.records[id]) {
        return;
      }

      const index = _.sortedIndex(state.selectedRecords, update.type)
      if (state.selectedRecords[index] === id) {
        state.selectedRecords.splice(index, 1);
      } else {
        state.selectedRecords.splice(index, 0, id);
      }
    }),
    selectRecords: create.reducer((state, update: PayloadAction<string[]>) => {
      state.selectedRecords = [];
      for (const record of _.uniq(update.payload)) {
        if (state.records[record]) {
          state.selectedRecords.push(record);
        }
        state.selectedRecords.sort();
      }
    }),
  }),
  selectors: {
    manifestError: (m) => m.error,
    selectedRecords: (m) => m.selectedRecords,
    isRecordSelected: (m, id) =>
      _.sortedIndexOf(m.selectedRecords, id) !== -1,
    filter: (m) => m.filter,
    records: (m) => m.records,
    record: (m, id) => m.records[id],
    assets: (m) => m.assets,
    asset: (m, id) => m.assets[id],
  },
});

export const records = createSelector(manifestSlice.selectors.records, (m) =>
  Object.values(m)
);
export const assets = createSelector(manifestSlice.selectors.assets, (m) =>
  Object.values(m)
);

export const manifestLoaded = createSelector(
  records,
  (rec) => rec.length !== 0
);

function includeRecord(
  rec: ResoRecord,
  filter: ManifestFilterOptions
): boolean {
  switch (rec.type) {
    case "audio":
      return filter.showMessages;
    case "object":
      return filter.showObjects;
    case "texture":
      return filter.showAvatar;
    case "world":
      return filter.showWorlds;
  }
}

const filteredManifest = createSelector(
  records,
  manifestSlice.selectors.assets,
  manifestSlice.selectors.filter,
  (records, assets, filter) => {
    // Make a copy of these objects, so we can prune the record list.
    const filteredRecords: Record<string, ResoRecord> = {};
    const filteredAssets: Record<string, ResoAssetBundle> = {};
    records.forEach((rec) => {
      if (includeRecord(rec, filter)) {
        const copyRec = Object.assign({}, rec);
        filteredRecords[copyRec.id] = copyRec;

        const newBundleList: Array<string> = [];
        rec.sharedAssetBundles.forEach((a) => {
          const bundle = assets[a];
          if (!bundle.resoniteProvided || filter.showResoniteProvidedAssets) {
            filteredAssets[a] = bundle;
            newBundleList.push(a);
          }
        });
        copyRec.sharedAssetBundles = newBundleList;
      }
    });

    return {
      filteredRecords,
      filteredAssets,
    };
  }
);

export const filteredAssets = createSelector(filteredManifest, (m) =>
  Object.values(m.filteredAssets)
);
export const filteredRecords = createSelector(filteredManifest, (m) =>
  Object.values(m.filteredRecords)
);

export const filteredAssetLookup = createSelector(
  filteredManifest,
  (m) => m.filteredAssets
);

export const filteredRecordsLookup = createSelector(
  filteredManifest,
  (m) => m.filteredRecords
);

export const {
  unloadManifest,
  loadManifest,
  updateFilter,
  selectRecords,
  toggleSelectRecord,
} = manifestSlice.actions;
export const {
  manifestError,
  record,
  records: recordLookup,
  asset,
  filter,
  assets: assetLookup,
  selectedRecords,
  isRecordSelected,
} = manifestSlice.selectors;
