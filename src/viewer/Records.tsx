import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  filteredAssetLookup,
  filteredRecords,
  ResoRecord,
  selectedRecords,
  selectRecords,
} from "../features/manifestSlice";
import {
  Cell,
  HeaderCell,
  HeaderRow,
  Row,
  Table,
} from "@table-library/react-table-library/table";
import { Virtualized } from "@table-library/react-table-library/virtualized";
import { bytesToSize } from "../util";
import {
  HeaderCellSelect,
  CellSelect,
  SelectTypes,
  useRowSelect,
  Select,
} from "@table-library/react-table-library/select";
import { useEffect, useRef } from "react";
import _ from "lodash";
import {
  useSort,
  HeaderCellSort,
  SortIconPositions,
  SortToggleType,
} from "@table-library/react-table-library/sort";

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
  selected: Array<string>
): Record<string, (nodes: ResoRecord[]) => ResoRecord[]> => ({
  SELECTED: (nodes) =>
    nodes.sort(
      (a, b) => isSelected(selected, a.id) - isSelected(selected, b.id)
    ),
});

const Records = () => {
  const dispatch = useAppDispatch();
  const assetBundles = useAppSelector(filteredAssetLookup);
  const nodes = useAppSelector(filteredRecords);
  const data = { nodes };
  const selRecords = useAppSelector(selectedRecords);

  // This allows the useEffect below to not trigger dispatch
  // updates when re-integrating the redux state into the list state.
  const dispatchUpdates = useRef(true);

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
    // eslint-disable-next-line
  }, [selRecords]);

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
    }
  );

  const sort = useSort(
    data,
    {
      onChange: (act, sta) => console.log(act, sta),
    },
    {
      sortFns: sortFns(selRecords) as any,
    }
  );

  return (
    <div style={{ height: "400px" }}>
      <Table
        data={data}
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
                <HeaderCellSelect sortKey="SELECTED"></HeaderCellSelect>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell>Last Update Time</HeaderCell>
                <HeaderCell>Internal Size</HeaderCell>
                <HeaderCell>Referenced Asset Bundles</HeaderCell>
                <HeaderCell>Referenced Size</HeaderCell>
              </HeaderRow>
            )}
            body={(item) => (
              <Row item={item}>
                <CellSelect item={item}></CellSelect>
                <Cell stiff>{Name(item)}</Cell>
                <Cell>{item.type}</Cell>
                <Cell>{ToRealisticDate(item)}</Cell>
                <Cell>{bytesToSize(item.internalSize)}</Cell>
                <Cell>{item.sharedAssetBundles.length}</Cell>
                <Cell>
                  {bytesToSize(
                    item.sharedAssetBundles.reduce(
                      (cur, a) => cur + assetBundles[a].size,
                      0
                    )
                  )}
                </Cell>
              </Row>
            )}
          />
        )}
      </Table>
    </div>
  );
};

export default Records;
