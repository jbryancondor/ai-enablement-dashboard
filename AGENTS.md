# AI Enablement Dashboard

## Project Purpose
Frontend-only dashboard for tracking AI-native capability across the **Merchant Engineering** squad. Data comes from two real sources:
- A Google Form CSV self-assessment (L1–L7 capability levels, 0–5 scale)
- `context-engineering-map` script that scans repos for AGENTS.md files and skills

Deployed at: https://jbryancondor.github.io/ai-enablement-dashboard/

---

## Tech Stack
* **React 18** — Core UI library
* **Vite** — Build tool and dev server
* **TypeScript** — Strict types throughout
* **react-router-dom** — HashRouter (3 routes: `/`, `/squads/:squadId`, `/individuals/:engineerId`)
* **Recharts** — Data visualization (line, bar charts)
* **Lucide React** — Iconography
* **Standard CSS** — Custom layouts, CSS variables for tokens, no CSS framework

---

## Architecture

### Data flow
```
Google Form CSV  →  scripts/ingest.py  →  src/data/generated/history.json
Repo scan        →  scripts/ingest.py  →  src/data/generated/latest-infra.json
                                       →  src/data/generated/manifest.json
```
Generated JSON files are **committed to the repo** — there is no backend or API. The app imports them statically at build time.

### Key directories
```
config/squad.yaml          # repo paths for infra scanning
scripts/ingest.py          # idempotent Python 3 ingest pipeline
src/data/
  types.ts                 # all TypeScript interfaces
  tiers.ts                 # Individual + Harness tier definitions and scoring
  targets.ts               # static quarterly targets
  selectors.ts             # pure functions: JSON → chart-ready data shapes
  generated/               # output of ingest.py (committed, no PII)
src/components/
  tokens.css               # CSS custom properties (colors, spacing, shadows)
  layout/                  # Card, Header, EmptyState, InfoModal
  charts/                  # all chart components
src/routes/
  SquadDashboard.tsx        # main view: Individual + Harness 2-column layout
  IndividualDashboard.tsx   # per-engineer profile view
```

---

## Scoring Systems

### Individual Capability (L1–L7)
- Engineers self-assess each level 0–5
- **Avg score** = mean of L1..L7
- Tiers (from `src/data/tiers.ts`):
  - **Explorer** — avg < 2.5
  - **Adopter** — avg 2.5–3.5
  - **Champion** — avg ≥ 3.5

### Harness Capability (repos)
- Each repo is scanned for AGENTS.md count and skill count
- **Score per dimension** (0–3): 0=none, 1=1–5 files, 2=6–10 files, 3=>10 files
- **Avg** = (AGENTS score + Skills score) / 2
- Tiers:
  - **Seed** — avg < 0.5
  - **Rooted** — avg 0.5–1.5
  - **Growing** — avg 1.5–2.5
  - **Mature** — avg ≥ 2.5

---

## Color System

All colors are defined as CSS custom properties in `src/components/tokens.css`.

### Individual tier colors
- `--tier-explorer`, `--tier-adopter`, `--tier-champion`

### Harness tier colors
- `--harness-seed`, `--harness-rooted`, `--harness-growing`, `--harness-mature`

### Heatmap scale
Both `CapabilityHeatmap` and `HarnessHeatmap` use a **blue sequential scale** (`#f1f5f9 → #1e3a8a`) — intentionally distinct from all tier colors to avoid visual conflict.

### Rule: no hue collision
Individual tiers, Harness tiers, and the heatmap sequential scale must all use clearly different parts of the color wheel. When adding new colors, verify they don't clash with existing tokens.

---

## Implemented Charts

| Component | Location | Description |
|---|---|---|
| `TierDistributionBar` | charts/ | 3 stat tiles (Explorer/Adopter/Champion) + distribution strip |
| `CapabilityHeatmap` | charts/ | Engineers × L1-L7, blue sequential scale, squad avg row |
| `HarnessTierDistribution` | charts/ | 4 stat tiles (Seed/Rooted/Growing/Mature) + distribution strip |
| `HarnessHeatmap` | charts/ | Repos × (Agents/Skills), blue sequential scale, repo avg row |
| `GapsTable` | charts/ | Full-text gaps + planned actions, sortable, CSV export |
| `TierBadge` | charts/ | Individual tier badge with radial SVG gauge |
| `CapabilityProfileBars` | charts/ | Individual L1-L7 horizontal bar chart |
| `SubmissionSparkline` | charts/ | Individual score over time, single-point stat card fallback |
| `NextTierProgress` | charts/ | Progress bar + next-tier checklist + planned actions |
| `InfraCoverageBullet` | charts/ | Bullet graph with gradient track (unused in main layout) |

---

## Ingest Pipeline (`scripts/ingest.py`)

- **Idempotent**: deduplicates by `(email, submittedAt)` — safe to run multiple times
- **Conflict handling**: keeps first submission by default; use `--reingest-conflicts` to replace
- **Repo scanning**: runs `context-engineering-map` on each path in `config/squad.yaml`
- **Output**: `history.json` (submissions), `latest-infra.json` (repo scan), `manifest.json` (audit trail)
- **PII protection**: CSV input files must never be committed; `docs/input/` is gitignored

To update with a new survey wave:
```bash
python3 scripts/ingest.py "path/to/responses.csv" --captured-at YYYY-MM-DD
git add src/data/generated/
git commit -m "data: ingest wave YYYY-MM"
git push
```

---

## Deployment

- Hosted on **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`)
- Workflow triggers on every push to `master`
- Uses **HashRouter** (`/#/`) — required for GitHub Pages static hosting (no server-side fallback)
- `vite.config.ts` sets `base: '/ai-enablement-dashboard/'`
- `public/404.html` redirects unknown paths into the hash for direct URL reloads

---

## Coding Conventions

- **Selectors are pure functions** — all data transformation lives in `src/data/selectors.ts`, components only receive chart-ready props
- **No inline data** — hardcoded values belong in `tiers.ts` or `targets.ts`, not in components
- **CSS tokens only** — never hardcode color hex values in components; always use `var(--token-name)` except for the heatmap sequential scale which is self-contained
- **TypeScript strict** — no `any` except where Recharts formatter types require it (annotated with eslint-disable)
- **Component naming**: chart components are PascalCase nouns describing what they show, not how they look
