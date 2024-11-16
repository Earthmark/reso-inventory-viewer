import { Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  assetLookup,
  filter,
  filteredRecords,
  recordLookup,
  records,
  ResoAssetBundle,
  ResoRecord,
  selectedRecords,
  updateFilter,
} from "../features/manifestSlice";
import { useMemo } from "react";
import { bytesToSize } from "../util";

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

const Overview = () => {
  const dispatch = useAppDispatch();
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

  const totalSizes = useSelectionSizes(
    recordList,
    assetMap,
    f.showResoniteProvidedAssets
  );
  const filteredSizes = useSelectionSizes(
    filteredRecordList,
    assetMap,
    f.showResoniteProvidedAssets
  );
  const selectedSizes = useSelectionSizes(
    selectedRec,
    assetMap,
    f.showResoniteProvidedAssets
  );

  return (
    <>
      <Form>
        <Form.Switch
          label="Objects"
          inline
          checked={f.showObjects}
          onChange={(e) =>
            dispatch(
              updateFilter({
                showObjects: e.target.checked,
              })
            )
          }
        />
        <Form.Switch
          label="Worlds"
          inline
          checked={f.showWorlds}
          onChange={(e) =>
            dispatch(
              updateFilter({
                showWorlds: e.target.checked,
              })
            )
          }
        />
        <Form.Switch
          label="Messages"
          inline
          checked={f.showMessages}
          onChange={(e) =>
            dispatch(
              updateFilter({
                showMessages: e.target.checked,
              })
            )
          }
        />
        <Form.Switch
          label="User Avatar"
          inline
          checked={f.showAvatar}
          onChange={(e) =>
            dispatch(
              updateFilter({
                showAvatar: e.target.checked,
              })
            )
          }
        />
        <Form.Switch
          label="Resonite Provided Assets"
          inline
          checked={f.showResoniteProvidedAssets}
          onChange={(e) =>
            dispatch(
              updateFilter({
                showResoniteProvidedAssets: e.target.checked,
              })
            )
          }
        />
      </Form>
      <Table striped bordered>
        <thead>
          <tr>
            <th></th>
            <th>Records</th>
            <th>Direct Assets</th>
            <th>Referenced Assets</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total</td>
            <td>{totalSizes.records}</td>
            <td>
              {totalSizes.directAssets}
              <br />({bytesToSize(totalSizes.directSize)})
            </td>
            <td>
              {totalSizes.referencedAssets}
              <br />({bytesToSize(totalSizes.referencedSize)})
            </td>
          </tr>
          <tr>
            <td>Filtered</td>
            <td>{filteredSizes.records}</td>
            <td>
              {filteredSizes.directAssets}
              <br />({bytesToSize(filteredSizes.directSize)})
            </td>
            <td>
              {filteredSizes.referencedAssets}
              <br />({bytesToSize(filteredSizes.referencedSize)})
            </td>
          </tr>
          <tr>
            <td>Selected</td>
            <td>{selectedSizes.records}</td>
            <td>
              {selectedSizes.directAssets}
              <br />({bytesToSize(selectedSizes.directSize)})
            </td>
            <td>
              {selectedSizes.referencedAssets}
              <br />({bytesToSize(selectedSizes.referencedSize)})
            </td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};

export default Overview;
