"use client";

import { Card } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/src/features/hooks";
import {
  filteredAssetLookup,
  filteredRecords,
  ResoRecord,
  selectedRecords,
  selectRecords,
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

// @table-library uses CSS grid under the hood. Without an explicit
// grid-template-columns the columns auto-size and end up uneven (the long
// name column squashes the rest). This locks in sensible widths.
//   - select  : tight checkbox column
//   - name    : flex, takes remaining space
//   - others  : sized to content / data
const RECORDS_THEME = {
  Table: `
    --data-table-library_grid-template-columns:
      44px minmax(180px, 1fr) 90px 140px 110px 90px 130px;
  `,
};

const Records = () => {
  const dispatch = useAppDispatch();
  const assetBundles = useAppSelector(filteredAssetLookup);
  const nodes = useAppSelector(filteredRecords);
  const data = useMemo(() => ({ nodes }), [nodes]);
  const selRecords = useAppSelector(selectedRecords);

  const theme = useTheme(RECORDS_THEME);

  // This allows the useEffect below to not trigger dispatch
  // updates when re-integrating the redux state into the list state.
  const dispatchUpdates = useRef(true);

  // for some reason rowSelect's state management is very messy.
  // It contains a lot of duplicate rows, and other funky stuff.
  // Our redux store de-duplicates the data,
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
    {
      rowSelect: SelectTypes.MultiSelect,
    },
  );

  useEffect(() => {
    dispatchUpdates.current = false;
    const toAdd = _.without(selRecords, ...select.state.ids);
    const toRemove = _.without(select.state.ids, ...selRecords);
    if (toAdd.length > 0) {
      select.fns.onAddByIds(toAdd, {});
    }
    if (toRemove.length > 0) {
      select.fns.onRemoveByIds(toRemove);
    }
    dispatchUpdates.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selRecords]);

  const sort = useSort(
    data,
    {},
    {
      sortFns: sortFns(selRecords) as any,
    },
  );

  return (
    // height: 100% + flex column so the table library gets a real pixel
    // height from the flex parent rather than the old hardcoded 400px.
    <Card className="shadow-sm" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, minHeight: 0 }}>
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
                <HeaderCellSelect></HeaderCellSelect>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell>Last Update Time</HeaderCell>
                <HeaderCell>Internal Size</HeaderCell>
                <HeaderCell>Bundles</HeaderCell>
                <HeaderCell>Referenced Size</HeaderCell>
              </HeaderRow>
            )}
            body={(item) => (
              <Row item={item}>
                <CellSelect item={item}></CellSelect>
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
    </Card>
  );
};

export default Records;
