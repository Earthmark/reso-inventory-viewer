import { ForceGraph2D } from "react-force-graph";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  assetLookup,
  filteredAssets,
  filteredRecords,
  ResoAssetBundle,
  ResoRecord,
  selectedRecords,
  toggleSelectRecord,
} from "../features/manifestSlice";
import { useEffect, useMemo, useRef, useState } from "react";
import { bytesToSize } from "../util";
import _ from "lodash";

function NodeLabelRenderer(
  node: ResoRecord | ResoAssetBundle,
  rawLookup: Record<string, ResoAssetBundle>,
  selected: Array<string>
) {
  const selectedTag = _.indexOf(selected, node.id) !== -1 ? "<br>Selected" : "";
  switch (node.type) {
    case "assetBundle":
      return `${bytesToSize(node.size)}<br>Used in ${
        rawLookup[node.id].recordIds.length
      } records.<br>Contains ${node.assets.length} assets.${
        node.resoniteProvided ? "<br>Resonite provided" : ""
      }${selectedTag}`;
    case "world":
      return `${node.name}<br>${bytesToSize(node.internalSize)}${selectedTag}`;
    case "audio":
      return `Message<br>${bytesToSize(node.internalSize)}${selectedTag}`;
    case "object":
      return `${node.fullName}<br>${bytesToSize(
        node.internalSize
      )}${selectedTag}`;
    case "texture":
      return `User avatar<br>${bytesToSize(node.internalSize)}${selectedTag}`;
  }
}

const Renderer = () => {
  const srcAssets = useAppSelector(assetLookup);
  const records = useAppSelector(filteredRecords);
  const filAsset = useAppSelector(filteredAssets);
  const selected = useAppSelector(selectedRecords);

  const dispatch = useAppDispatch();

  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const wrapper = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (wrapper.current) {
      const observer = new ResizeObserver((event) => {
        setWidth(event[0].contentBoxSize[0].inlineSize);
        setHeight(event[0].contentBoxSize[0].blockSize);
      });
      observer.observe(wrapper.current);
      return () => observer.disconnect();
    }
  });

  const data = useMemo(() => {
    const r = records.map((rec) => ({
      ...rec,
      val: Math.log10(rec.internalSize + 1),
    }));
    const a = filAsset.map((a) => ({
      ...a,
      id: a.id,
      name: a.assets.map((a) => a.hash).join("\n"),
      val: Math.log10(a.size + 1),
    }));

    const nodes = [...r, ...a];
    const links = r.flatMap((r) =>
      r.sharedAssetBundles.map((a) => ({ source: r.id, target: a }))
    );

    return {
      nodes: nodes,
      links: links,
    };
  }, [records, filAsset]);

  return (
    <div
      ref={wrapper}
      style={{ width: "100%", height: "100%", minHeight: "500px" }}
    >
      <ForceGraph2D
        width={width}
        height={height}
        graphData={data}
        enableNodeDrag={false}
        onEngineStop={() => {
          console.log("Stopped sim");
        }}
        onEngineTick={() => {
          console.log("tick");
        }}
        onNodeClick={(n) => {
          // Only records can be selected, which is any kind other than an asset bundle.
          if (n.type !== "assetBundle") {
            dispatch(toggleSelectRecord(n.id));
          }
        }}
        nodeLabel={(node) =>
          NodeLabelRenderer(node, srcAssets, selected) as string
        }
        nodeAutoColorBy={(n) =>
          n.type +
          "|" +
          (n.type === "assetBundle" ? n.resoniteProvided : "") +
          "|" +
          (_.indexOf(selected, n.id) === -1)
        }
      />
    </div>
  );
};

export default Renderer;
