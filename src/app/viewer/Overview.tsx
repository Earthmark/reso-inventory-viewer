import { useAppSelector } from "@/src/features/hooks";
import {
  assetLookup,
  filter,
  filteredRecords,
  recordLookup,
  records,
  ResoAssetBundle,
  ResoRecord,
  selectedRecords,
} from "@/src/features/manifestSlice";
import React, { useMemo } from "react";
import { bytesToSize } from "@/src/util";

interface SelectionMetrics {
  records: number;
  directAssets: number;
  directSize: number;
  referencedAssets: number;
  referencedSize: number;
}

const useSelectionSizes = (
  records: Array<ResoRecord>,
  allAssets: Record<string, ResoAssetBundle>,
  includeProvided: boolean
): SelectionMetrics =>
  useMemo(() => {
    const directAssets = records.reduce(
      (n, r) => n + r.internalAssets.length,
      0
    );
    const directSize = records.reduce(
      (n, r) => n + r.internalAssets.reduce((n, r) => n + r.bytes, 0),
      0
    );

    const recordMap: Record<string, ResoRecord> = {};
    const assetMap: Record<string, ResoAssetBundle> = {};
    for (var r of records) {
      recordMap[r.id] = r;
      for (var a of r.sharedAssetBundles) {
        assetMap[a] = allAssets[a];
      }
    }

    let referencedAssets = 0;
    let referencedSize = 0;
    for (var asset in assetMap) {
      const bundle = assetMap[asset];
      // If every record is included in the selected set.
      if (
        (!bundle.resoniteProvided || includeProvided) &&
        bundle.recordIds.every((r) => recordMap[r])
      ) {
        referencedAssets += bundle.assets.length;
        referencedSize += bundle.size;
      }
    }

    return {
      records: records.length,
      directAssets,
      directSize,
      referencedAssets,
      referencedSize,
    };
  }, [records, allAssets, includeProvided]);

// A single number + optional size sub-label, used in the stats grid.
const Stat = ({ count, size }: { count: number; size?: number }) => (
  <div className="text-center">
    <div className="fs-4 fw-bold lh-1">{count}</div>
    {size !== undefined && (
      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
        {bytesToSize(size)}
      </div>
    )}
  </div>
);

const Overview = () => {
  const f = useAppSelector(filter);

  const recordList = useAppSelector(records);
  const recordMap = useAppSelector(recordLookup);
  const assetMap = useAppSelector(assetLookup);
  const selected = useAppSelector(selectedRecords);
  const filteredRecordList = useAppSelector(filteredRecords);

  const selectedRec = useMemo(
    () => selected.map((r) => recordMap[r]),
    [selected, recordMap]
  );

  const totalSizes = useSelectionSizes(recordList, assetMap, f.showResoniteProvidedAssets);
  const filteredSizes = useSelectionSizes(filteredRecordList, assetMap, f.showResoniteProvidedAssets);
  const selectedSizes = useSelectionSizes(selectedRec, assetMap, f.showResoniteProvidedAssets);

  // Column widths: label takes the left side, the three data columns share the rest equally.
  const labelStyle: React.CSSProperties = { width: "30%", fontSize: "0.8rem" };
  const colStyle: React.CSSProperties = { width: "23.33%" };

  return (
    <div>
      {/* Column headers */}
      <div className="d-flex text-center text-muted fw-semibold mb-3" style={{ fontSize: "0.8rem" }}>
        <div style={labelStyle} />
        <div style={colStyle}>Total</div>
        <div style={colStyle}>Filtered</div>
        <div style={colStyle}>Selected</div>
      </div>

      {/* Records row */}
      <div className="d-flex align-items-center mb-4">
        <div style={labelStyle} className="text-muted">Records</div>
        <div style={colStyle}><Stat count={totalSizes.records} /></div>
        <div style={colStyle}><Stat count={filteredSizes.records} /></div>
        <div style={colStyle}><Stat count={selectedSizes.records} /></div>
      </div>

      {/* Direct Assets row */}
      <div className="d-flex align-items-center mb-4">
        <div style={labelStyle} className="text-muted">Direct<br />Assets</div>
        <div style={colStyle}><Stat count={totalSizes.directAssets} size={totalSizes.directSize} /></div>
        <div style={colStyle}><Stat count={filteredSizes.directAssets} size={filteredSizes.directSize} /></div>
        <div style={colStyle}><Stat count={selectedSizes.directAssets} size={selectedSizes.directSize} /></div>
      </div>

      {/* Referenced Assets row */}
      <div className="d-flex align-items-center">
        <div style={labelStyle} className="text-muted">Referenced<br />Assets</div>
        <div style={colStyle}><Stat count={totalSizes.referencedAssets} size={totalSizes.referencedSize} /></div>
        <div style={colStyle}><Stat count={filteredSizes.referencedAssets} size={filteredSizes.referencedSize} /></div>
        <div style={colStyle}><Stat count={selectedSizes.referencedAssets} size={selectedSizes.referencedSize} /></div>
      </div>
    </div>
  );
};

export default Overview;
