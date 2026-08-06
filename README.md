# Fashionista

A private wardrobe journal, designed as an editorial object — Caslon type on
bone paper, one accent color, and an architecture that starts with the only
question that matters each morning: *what am I wearing today?*

All data — including photos — lives **on your device** in the browser's
IndexedDB. No account, no server, fully private.

## Screens

- **Today** — the home screen: your planned look with one-tap **"Wore it"**
  logging, a care summary, tomorrow's plan with readiness, and the journal
  of logged days.
- **Closet** — the catalog. Search, category chips, and cards showing each
  piece's photo (or an elegant color-derived gradient), status badge, brand,
  and wear count.
- **Looks** — saved outfits plus a visual week-strip planner. Day cards show
  mini thumbnails and an amber dot when a planned look has pieces that
  aren't fresh — you find out on Monday that Thursday's shirt needs washing.
- **Care** — everything out of rotation, grouped by where it is (to wash,
  in the wash, at the cleaner, in repair) with one-tap moves and batch
  actions ("All washed").
- **Insights** — closet value, average cost-per-wear, most-worn with bars,
  and a "not yet worn" list of donation candidates.
- **Settings** (⋮) — accent color picker (Plum, Burgundy, Forest, Navy) and
  the Data section with backup export/import.

## Running it

```bash
npm install
npm run dev          # development server
npm run build        # production build into dist/
npm run preview      # serve the production build
```

Deployed to a static host, the web manifest lets phones **Add to Home
Screen** and run it like a native app.

## How the code is organized

| Path | What it does |
| --- | --- |
| `src/types.ts` | Data model + status labels/colors + accent options |
| `src/db.ts` | Dexie (IndexedDB) database — items, outfits (looks), wears, plans |
| `src/lib/logic.ts` | Domain actions: wear/plan/delete (transactional), readiness, stats |
| `src/lib/colors.ts` | Color-name → gradient tiles for photo-less pieces |
| `src/lib/backup.ts` | JSON export/import with photos as base64 (v1 & v2 compatible) |
| `src/lib/image.ts` | Resizes camera photos to ~800px JPEG before storing |
| `src/lib/dates.ts` | Local-timezone date keys and friendly labels |
| `src/ui.tsx` | App-wide toast + confirm dialog (replaces browser alert/confirm) |
| `src/components/` | Sheets, swatches, picker grid, icons, double-tap guard |
| `src/views/` | One file per tab: Today, Closet, Looks, Care, Insights |
| `src/styles.css` | Design tokens + component styles; fonts bundled in `public/fonts` |

Key design decisions:

- **Dexie + `useLiveQuery`** — views subscribe to the database, so any write
  updates every tab instantly. Multi-step writes run in transactions.
- **Photos as Blobs**, resized before storing; pieces without photos render
  a two-tone gradient derived from their color name.
- **Every mutating button is re-entry guarded** so double-taps can't create
  duplicate records.
- **Local dates as `YYYY-MM-DD` strings**, avoiding UTC off-by-one bugs.
