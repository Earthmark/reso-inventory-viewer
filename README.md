# reso-inventory-viewer

A browser-based viewer for your Resonite inventory, built to help diagnose
storage usage. Load your inventory export and explore what's taking up space
via a searchable record table and an interactive force graph.

**Live site:** https://earthmark.github.io/reso-inventory-viewer

## Getting your inventory file

In Resonite, send the **Resonite** contact the message
`/requestRecordUsageJSON`. The bot replies with a zipped `RecordUsage.json`
to the email associated with your account. Drop that file into the app to
get started.

Everything is processed entirely in-browser — nothing is uploaded.

## Development

| Script           | What it does                                             |
| ---------------- | -------------------------------------------------------- |
| `npm run dev`    | Start the dev server on http://localhost:3000            |
| `npm run build`  | Build a static export into `./build`                     |
| `npm start`      | Serve the built export locally                           |
| `npm run deploy` | Push `./build` to the `gh-pages` branch                  |

For architecture notes and gotchas, see [CLAUDE.md](./CLAUDE.md).
