"use client";

import dynamic from "next/dynamic";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});
import { useAppDispatch, useAppSelector } from "@/src/features/hooks";
import {
  assetLookup,
  filteredAssets,
  filteredRecords,
  ResoAssetBundle,
  ResoRecord,
  selectedRecords,
  toggleSelectRecord,
} from "@/src/features/manifestSlice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bytesToSize } from "@/src/util";
import _ from "lodash";

type GraphNode = ResoRecord | ResoAssetBundle;

const NODE_COLORS: Record<string, { base: string; selected: string }> = {
  object: { base: "#5b8db8", selected: "#1e3f5c" },
  world: { base: "#6aaa64", selected: "#1e5228" },
  audio: { base: "#e8a838", selected: "#7a5010" },
  texture: { base: "#c47bb0", selected: "#5c2a50" },
  "assetBundle|false": { base: "#e07070", selected: "#8a2a2a" }, // user-owned
  "assetBundle|true": { base: "#90b8b4", selected: "#3a6460" }, // Resonite-provided
};

function NodeLabelRenderer(
  node: GraphNode,
  rawLookup: Record<string, ResoAssetBundle>,
  selected: Array<string>,
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
        node.internalSize,
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

  const [size, setSize] = useState({ width: 100, height: 100 });
  const wrapper = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wrapper.current) return;
    const observer = new ResizeObserver((event) => {
      const box = event[0].contentBoxSize[0];
      setSize((prev) => {
        const width = box.inlineSize;
        const height = box.blockSize;
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

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
      r.sharedAssetBundles.map((a) => ({ source: r.id, target: a })),
    );

    return {
      nodes: nodes,
      links: links,
    };
  }, [records, filAsset]);

  const nodeLabel = useCallback(
    (node: any) => NodeLabelRenderer(node, srcAssets, selected) as string,
    [srcAssets, selected],
  );

  const nodeColor = useCallback(
    (n: any) => {
      const key =
        n.type === "assetBundle" ? `assetBundle|${n.resoniteProvided}` : n.type;
      const palette = NODE_COLORS[key] ?? { base: "#999", selected: "#333" };
      return _.indexOf(selected, n.id) !== -1 ? palette.selected : palette.base;
    },
    [selected],
  );

  const onNodeClick = useCallback(
    (n: any) => {
      // Only records can be selected, which is any kind other than an asset bundle.
      if (n.type !== "assetBundle") {
        dispatch(toggleSelectRecord(n.id as string));
      }
    },
    [dispatch],
  );

  return (
    <div
      ref={wrapper}
      style={{ width: "100%", height: "100%", minHeight: "500px" }}
    >
      <ForceGraph2D
        width={size.width}
        height={size.height}
        graphData={data}
        enableNodeDrag={false}
        cooldownTicks={100}
        d3AlphaMin={0.01}
        onNodeClick={onNodeClick}
        nodeLabel={nodeLabel}
        nodeColor={nodeColor}
      />
    </div>
  );
};

export default Renderer;
