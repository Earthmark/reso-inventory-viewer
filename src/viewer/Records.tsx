import { useAppSelector } from "../app/hooks";
import { records, ResoRecord } from "../features/manifestSlice";
import {
  Column,
  CompactTable,
} from "@table-library/react-table-library/compact";

const COLUMNS: Array<Column<ResoRecord>> = [
  { label: "name", renderCell: (item) => item.path ? item.path + "\\" + item.name : item.name, tree: true },
  { label: "Type", renderCell: (item) => item.recordType },
  { label: "size", renderCell: (item) => item.totalSize },
];

function Records() {
  const nodes = useAppSelector(records);
  const data = { nodes };

  return <CompactTable columns={COLUMNS} data={data} />;
}

export default Records;
