"use client";

import { Dropdown, Form } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/src/features/hooks";
import {
  assetLookup,
  filter,
  filteredAssetLookup,
  filteredRecords,
  records as allRecordsSelector,
  recordLookup,
  ResoAssetBundle,
  ResoRecord,
  selectedRecords,
  selectRecords,
  updateFilter,
} from "@/src/features/manifestSlice";
import {
  Cell,
  HeaderCell,
  HeaderRow,
  Row,
  Table,
} from "@table-library/react-table-library/table";
import { Virtualized } from "@table-library/react-table-library/virtualized";
import { useTheme } from "@table-library/react-table-library/theme";
import { bytesToSize } from "@/src/util";
import {
  HeaderCellSelect,
  CellSelect,
  SelectTypes,
  useRowSelect,
} from "@table-library/react-table-library/select";
import { useEffect, useMemo, useRef } from "react";
import _ from "lodash";
import { useSort } from "@table-library/react-table-library/sort";

const TypedVirtualized = Virtualized<ResoRecord>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Name(record: ResoRecord): string {
  switch (record.type) {
    case "audio":
      return "Audio Message";
    case "object":
      return record.fullName;
    case "world":
      return record.name;
    case "texture":
      return "User Avatar";
  }
}

function ToRealisticDate(record: ResoRecord): string {
  return new Date(record.creationTime).toLocaleDateString();
}

function isSelected(selected: Array<string>, id: string): number {
  return _.sortedIndexOf(selected, id) !== -1 ? 1 : 0;
}

const sortFns = (
  selected: Array<string>,
): Record<string, (nodes: ResoRecord[]) => ResoRecord[]> => ({
  SELECTED: (nodes) =>
    nodes.sort(
      (a, b) => isSelected(selected, a.id) - isSelected(selected, b.id),
    ),
});

// ---------------------------------------------------------------------------
// Selection size calculation
// Computes how much storage would be freed if all records in the given list
// were deleted. "Shared" bundles are only freed when every record that
// references that bundle is also being deleted.
// ---------------------------------------------------------------------------

interface SelectionMetrics {
  directSize: number;
  sharedSize: number;
}

function useSelectionSizes(
  records: ResoRecord[],
  allAssets: Record<string, ResoAssetBundle>,
  includeProvided: boolean,
): SelectionMetrics {
  return useMemo(() => {
    const directSize = records.reduce(
      (n, r) => n + r.internalAssets.reduce((s, a) => s + a.bytes, 0),
      0,
    );

    const recordMap: Record<string, ResoRecord> = {};
    const bundleMap: Record<string, ResoAssetBundle> = {};
    for (const r of records) {
      recordMap[r.id] = r;
      for (const a of r.sharedAssetBundles) {
        bundleMap[a] = allAssets[a];
      }
    }

    let sharedSize = 0;
    for (const id in bundleMap) {
      const bundle = bundleMap[id];
      // Only count the bundle if:
      //  1. It's not Resonite-provided (or the user opted in), AND
      //  2. Every record that references it is also being deleted.
      if (
        (!bundle.resoniteProvided || includeProvided) &&
        bundle.recordIds.every((r) => recordMap[r])
      ) {
        sharedSize += bundle.size;
      }
    }

    return { directSize, sharedSize };
  }, [records, allAssets, includeProvided]);
}

// ---------------------------------------------------------------------------
// @table-library grid template
// @table-library uses CSS grid under the hood. Without an explicit
// grid-template-columns the columns auto-size and end up uneven (the long
// name column squashes the rest). This locks in sensible widths.
//   - select      : tight checkbox column
//   - name        : flex, takes remaining space
//   - type        : short enum values ("object", "world", etc.)
//   - last update : date string, ~10 chars
//   - internal sz : values like "2.76 GB"
//   - bundles     : small integer, no header wrapping needed
//   - shared sz   : values like "384.51 MB"
// ---------------------------------------------------------------------------
const RECORDS_THEME = {
  Table: `
    --data-table-library_grid-template-columns:
      44px minmax(180px, 1fr) 90px 105px 105px 72px 110px;
  `,
};

// ---------------------------------------------------------------------------
// Type filter dropdown
// Only covers the four actual record types. "Resonite Assets" is a separate
// concept (asset accounting, not record type) and lives in the summary bar.
// Uses popperConfig strategy:"fixed" so the menu isn't clipped by the
// table's overflow container.
// ---------------------------------------------------------------------------
const TypeFilterDropdown = () => {
  const dispatch = useAppDispatch();
  const f = useAppSelector(filter);

  const options = [
    { label: "Objects", checked: f.showObjects, key: "showObjects" },
    { label: "Worlds", checked: f.showWorlds, key: "showWorlds" },
    { label: "Messages", checked: f.showMessages, key: "showMessages" },
    { label: "User Avatar", checked: f.showAvatar, key: "showAvatar" },
  ] as const;

  const hiddenCount = options.filter((o) => !o.checked).length;

  return (
    <Dropdown onClick={(e) => e.stopPropagation()}>
      <Dropdown.Toggle
        variant="link"
        size="sm"
        className="p-0 text-decoration-none fw-bold text-body"
      >
        Type
        {hiddenCount > 0 && (
          <span className="ms-1 badge bg-primary">
            {options.length - hiddenCount}/{options.length}
          </span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu popperConfig={{ strategy: "fixed" }} renderOnMount>
        {options.map((opt) => (
          <Dropdown.ItemText key={opt.key}>
            <Form.Check
              type="checkbox"
              label={opt.label}
              checked={opt.checked}
              onChange={(e) =>
                dispatch(updateFilter({ [opt.key]: e.target.checked }))
              }
            />
          </Dropdown.ItemText>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

// ---------------------------------------------------------------------------
// Records table
// ---------------------------------------------------------------------------
const Records = () => {
  const dispatch = useAppDispatch();
  const f = useAppSelector(filter);

  const assetBundles = useAppSelector(filteredAssetLookup);
  const allAssets = useAppSelector(assetLookup);
  const recordMap = useAppSelector(recordLookup);

  const nodes = useAppSelector(filteredRecords);
  const allRecords = useAppSelector(allRecordsSelector);
  const selRecords = useAppSelector(selectedRecords);

  const data = useMemo(() => ({ nodes }), [nodes]);

  // Build the array of full ResoRecord objects for the current selection so
  // useSelectionSizes can compute how much storage would actually be freed.
  const selectedRecs = useMemo(
    () => selRecords.map((id) => recordMap[id]).filter(Boolean) as ResoRecord[],
    [selRecords, recordMap],
  );

  const selectedSizes = useSelectionSizes(
    selectedRecs,
    allAssets,
    f.showResoniteProvidedAssets,
  );

  const theme = useTheme(RECORDS_THEME);

  // This ref prevents the useEffect below from re-dispatching to Redux when
  // we're the ones driving the table's selection state from Redux.
  const dispatchUpdates = useRef(true);

  const select = useRowSelect(
    data,
    {
      state: { ids: [] },
      onChange: (a, s) => {
        if (dispatchUpdates.current && s.ids !== selRecords) {
          dispatch(selectRecords(s.ids));
        }
      },
    },
    { rowSelect: SelectTypes.MultiSelect },
  );

  useEffect(() => {
    dispatchUpdates.current = false;
    const toAdd = _.without(selRecords, ...select.state.ids);
    const toRemove = _.without(select.state.ids, ...selRecords);
    if (toAdd.length > 0) select.fns.onAddByIds(toAdd, {});
    if (toRemove.length > 0) select.fns.onRemoveByIds(toRemove);
    dispatchUpdates.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selRecords]);

  const sort = useSort(data, {}, { sortFns: sortFns(selRecords) as any });

  const freedTotal = selectedSizes.directSize + selectedSizes.sharedSize;

  return (
    // h-100 + d-flex flex-column: Bootstrap utilities so the table library
    // gets a real pixel height from the flex parent.
    <div className="h-100 d-flex flex-column">
      {/* ------------------------------------------------------------------ */}
      {/* Summary bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex-shrink-0 d-flex align-items-center gap-3 px-3 py-2 border-top border-bottom flex-wrap"
        style={{ fontSize: "0.82rem" }}
      >
        {/* Record counts */}
        <span className="text-muted">
          Total <strong className="text-body">{allRecords.length}</strong>
        </span>
        <span className="text-muted">
          Filtered <strong className="text-body">{nodes.length}</strong>
        </span>
        <span className="text-muted">
          Selected <strong className="text-body">{selRecords.length}</strong>
        </span>

        {/* Freed-storage estimate — only visible when something is selected */}
        {selRecords.length > 0 && (
          <>
            <div className="vr" />
            <span className="text-muted">
              Would free{" "}
              <strong className="text-body">{bytesToSize(freedTotal)}</strong>
              <span className="ms-1" style={{ fontSize: "0.75rem" }}>
                ({bytesToSize(selectedSizes.directSize)} direct
                {selectedSizes.sharedSize > 0 &&
                  ` + ${bytesToSize(selectedSizes.sharedSize)} shared`}
                )
              </span>
            </span>
          </>
        )}

        {/* Resonite Assets toggle — right-aligned.
            Off by default: Resonite-provided assets don't count against user
            storage, so including them would overstate how much space is freed. */}
        <Form.Check
          type="checkbox"
          label="Incl. Resonite Provided Assets"
          className="ms-auto text-muted user-select-none"
          style={{ fontSize: "0.82rem" }}
          checked={f.showResoniteProvidedAssets}
          onChange={(e) =>
            dispatch(
              updateFilter({ showResoniteProvidedAssets: e.target.checked }),
            )
          }
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Virtualized table                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-grow-1" style={{ minHeight: 0 }}>
        <Table
          data={data}
          theme={theme}
          layout={{ isDiv: true, fixedHeader: true }}
          select={select}
          sort={sort}
        >
          {(tableList: ResoRecord[]) => (
            <TypedVirtualized
              tableList={tableList}
              rowHeight={30}
              header={() => (
                <HeaderRow>
                  <HeaderCellSelect />
                  <HeaderCell>Name</HeaderCell>
                  <HeaderCell>
                    <TypeFilterDropdown />
                  </HeaderCell>
                  <HeaderCell>Last Update</HeaderCell>
                  <HeaderCell>Internal Size</HeaderCell>
                  <HeaderCell>Bundles</HeaderCell>
                  <HeaderCell>Shared Size</HeaderCell>
                </HeaderRow>
              )}
              body={(item) => (
                <Row item={item}>
                  <CellSelect item={item} />
                  <Cell>{Name(item)}</Cell>
                  <Cell>{item.type}</Cell>
                  <Cell>{ToRealisticDate(item)}</Cell>
                  <Cell>{bytesToSize(item.internalSize)}</Cell>
                  <Cell>{item.sharedAssetBundles.length}</Cell>
                  <Cell>
                    {bytesToSize(
                      item.sharedAssetBundles.reduce(
                        (cur, a) => cur + assetBundles[a].size,
                        0,
                      ),
                    )}
                  </Cell>
                </Row>
              )}
            />
          )}
        </Table>
      </div>
    </div>
  );
};

export default Records;
