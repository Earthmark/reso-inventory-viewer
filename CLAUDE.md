# CLAUDE.md — engineering notes for reso-inventory-viewer

These notes are written for future agents (and humans) modifying this
repo. They capture the load-bearing pieces of the architecture, the
gotchas that keep biting, and the conventions to follow when adding
features.

## Tech stack

- **Next.js 16 App Router**, static export (`output: 'export'`, `distDir: 'build'`).
- **React 19**, all components are client components (`"use client"`).
- **Redux Toolkit** with `buildCreateSlice` + the async-thunk creator.
- **react-bootstrap 5** for layout and form controls.
- **react-force-graph-2d** (built on `force-graph` / d3-force) for the visualizer.
- **@table-library/react-table-library** for the virtualized record table.

The app is fully client-side after the initial HTML shell — there is no
server data. `next-redux-wrapper` is intentionally **not** used; the
Redux store is created once at module load (`features/store.ts`) and
provided in `app/layout.tsx`.

## Data model (manifestSlice)

The Redux state shape is:

```ts
{
  records: Record<string, ResoRecord>,    // by id
  assets:  Record<string, ResoAssetBundle>, // by synthetic bundle id
  selectedRecords: string[],              // sorted, unique
  filter: { showObjects, showWorlds, showMessages, showAvatar, showResoniteProvidedAssets },
  loading, error
}
```

A `ResoRecord` is one of `object | world | audio | texture`. An
`ResoAssetBundle` groups assets that are referenced by exactly the same
set of records (plus the Resonite-provided flag). Bundles are the unit
of "shared cost": if every referencing record is deleted, the entire
bundle goes with it.

Key invariants:

- `selectedRecords` is **always sorted and de-duplicated**. Use
  `_.sortedIndexOf` / `_.sortedIndex` to query / insert.
- Selectors created with `createSelector` (e.g. `filteredRecords`,
  `filteredAssets`) memoize on input identity. Don't replace them with
  inline `useMemo` over `useAppSelector`-returned arrays unless you
  understand the re-render implications.
- `internalAssets` is the per-record bundle (assets only that record
  references and which Resonite does not provide). Everything else is
  modeled as a shared bundle, even if only one record refers to it but
  Resonite provides it.

## Selection plumbing

There are three places that have a notion of "selected record":

1. **Redux** — the source of truth (`selectedRecords`).
2. **The Records table** — `@table-library/react-table-library`'s
   `useRowSelect` keeps its own internal state, which doesn't dedupe.
   `Records.tsx` mirrors Redux → table via `useEffect`, gated by the
   `dispatchUpdates` ref so we don't loop.
3. **The Renderer** — clicking a node dispatches `toggleSelectRecord`.

When adding a new piece of UI that reads or writes selection, **read
from Redux and dispatch back to Redux**. Don't introduce a fourth
source of truth.

## Viewer layout (viewer/page.tsx)

The viewer uses a Bootstrap grid: Overview (4) + Renderer (8) on top,
Records (12) below. The grid lives inside a `<Container fluid>` — this
matters because Bootstrap's `.row` has negative `margin-left/right` to
compensate for a Container's horizontal padding. **Without a Container
wrapper, the row overflows the viewport and produces a horizontal
scrollbar on the body**. Don't drop the Container.

The body has `overflow-x: hidden` as a belt-and-braces defense in
`App.css`.

## Renderer gotchas (react-force-graph-2d)

`react-force-graph-2d` wraps the `force-graph` kapsule via
`react-kapsule`. The kapsule mirrors React props to internal state via
setters. Many of these setters are marked `triggerUpdate: true` in
`force-graph`, which means **a prop reference change calls a setter
which resets the cooldown countdown — the simulation runs forever**.

Concretely: `nodeAutoColorBy`, `nodeLabel`, `cooldownTicks`,
`cooldownTime`, `onEngineTick`, `onEngineStop`, etc. are in
`force-graph`'s `linkedProps` list and trigger updates.

**Rules:**

- Wrap every function prop (`nodeLabel`, `nodeColor`, `nodeAutoColorBy`,
  `onNodeClick`, …) in `useCallback` with a precise dep list.
- Wrap object/array props (`graphData`) in `useMemo`.
- Set `cooldownTicks` to a finite number (~100) so the engine settles
  even if a re-render slips through.
- Mount the `ResizeObserver` with an empty deps array — re-creating it
  on every render flaps the canvas size and indirectly re-runs the sim.

`enableNodeDrag={false}` is intentional — record selection is the
click action.

## Records table gotchas (@table-library/react-table-library)

The table uses CSS grid under the hood. The grid template is set via a
CSS custom property `--data-table-library_grid-template-columns` on the
table wrapper. If you don't set one (or only mark some cells `stiff`),
columns auto-size and the long Name column squashes everything else.

Always provide a theme via `useTheme` and lock in a
`grid-template-columns` string. Update the template when you add or
remove columns.

## When adding new features

A few patterns worth keeping in mind for the requests likely coming
next:

### "Show the force graph when an asset is selected"

The selection state is `state.selectedRecords` (record ids only).
Asset bundles are not selectable today; the renderer ignores clicks on
nodes of type `assetBundle`. Two viable paths:

1. **Filter the rendered graph by selection** — restrict `data.nodes`
   in `Renderer.tsx` to the selected records, their bundles, and
   optionally one hop of neighbors. Compute this inside the existing
   `useMemo` and add `selected` to its dep list.
2. **Highlight without filtering** — pass `nodeVisibility` /
   `nodeColor` accessors that dim non-selected nodes. Cheaper, and
   keeps the layout stable across selection changes.

If you go the filtering route, remember the cooldown rules above:
changing `graphData` reference resets the simulation. That's desirable
when the node set changes, but make sure `useMemo` deps are minimal so
selection updates that don't change the node set don't trigger relayout.

There is no Redux action for "select an asset bundle" yet. If asset
selection is needed, add a separate `selectedAssets: string[]` slice
of state rather than overloading `selectedRecords`.

### Adding a new record type

`ResoRecord` is a discriminated union on `type`. Update:

1. `RawResoRecord.recordType` and `ToResoRecord` in `manifestSlice.ts`.
2. The `includeRecord` filter switch.
3. `Records.tsx`'s `Name` function.
4. `Renderer.tsx`'s `NodeLabelRenderer` switch.

TypeScript's exhaustiveness checking on switches will flag the spots
you missed.

### Adding a new filter switch

Filters live in `state.filter` and are toggled via `updateFilter`.
`Overview.tsx` has the existing switches; mirror that pattern. The
filter is consumed by `filteredManifest` (creates `filteredRecords` and
`filteredAssets`), so any new filter dimension must be referenced there
or it won't actually filter.

## Known smaller issues / nice-to-haves

- `Records.tsx` has a sort hook wired up but no `HeaderCellSort` cells,
  so the user can't actually trigger sorts from the UI yet.
- The "Resonite Provided Assets" toggle hides bundles that are entirely
  Resonite-provided. Mixed bundles (rare but possible) are still shown
  regardless of the toggle. This is intentional but worth knowing.
- `bytesToSize` uses log base 1024 → returns `KB`/`MB`/etc. but those
  are technically `KiB`/`MiB`. Cosmetic only.
- `public/manifest.json` is a CRA-era PWA manifest; Next 16 supports
  `app/manifest.ts` and `app/icon.tsx`. Not migrated, since the PWA
  install affordance isn't currently a goal.
