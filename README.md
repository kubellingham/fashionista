# Fashionista 👗

A mobile-first wardrobe tracker. All data — including photos — lives **on your
device** in the browser's IndexedDB. No account, no server, fully private.

## Features

- **Closet** — catalog every item with a photo (opens your phone camera
  directly), category, brand, color, size, and price. Filter by category.
- **Outfits** — combine items into named outfits, plan them onto future
  dates, and log them with one "Wore it ✓" tap.
- **Log** — record what you wore each day. The Stats sheet shows most-worn
  items, cost-per-wear, total closet value, and a "never worn — donate?" list.
- **Laundry** — items you log as worn are marked dirty automatically, then
  move through dirty → laundry / dry cleaner → clean with one-tap buttons.
- **Backup** — the ⋮ menu exports everything (photos included) to a single
  JSON file, and imports it back on any device. Since data is local-only,
  export a backup now and then!

## Running it

```bash
npm install
npm run dev          # development server
npm run build        # production build into dist/
npm run preview      # serve the production build
```

Open the dev/preview URL on your phone (same Wi-Fi: `npm run dev -- --host`
and use your computer's IP). For daily use, deploy `dist/` to any static host
(Netlify, Vercel, GitHub Pages) and use your browser's **Add to Home Screen** —
the app has a web manifest so it installs like a native app.

## How the code is organized

| Path | What it does |
| --- | --- |
| `src/types.ts` | The data model: `Item`, `Outfit`, `WearEntry`, `PlannedOutfit` |
| `src/db.ts` | Dexie (IndexedDB) database — four tables, one per type |
| `src/App.tsx` | App shell: header, backup menu, bottom tab bar |
| `src/views/` | One file per tab: `Closet`, `Outfits`, `Log`, `Laundry` |
| `src/components/shared.tsx` | Reusable pieces: photo renderer, bottom sheet, item picker |
| `src/lib/image.ts` | Resizes camera photos to ~800px JPEG before storing |
| `src/lib/backup.ts` | JSON export/import with photos encoded as base64 |
| `src/lib/dates.ts` | Local-timezone `YYYY-MM-DD` date helpers |

Key design decisions:

- **Dexie + `useLiveQuery`** — views subscribe to the database, so any write
  (e.g. marking an item dirty) instantly updates every tab. No state
  management library needed.
- **Photos as Blobs** — stored in IndexedDB directly, resized first so
  hundreds of items stay well within browser storage limits.
- **Local dates as strings** — wear logs use `YYYY-MM-DD` keys computed in
  local time, avoiding the classic UTC off-by-one-day bug.
