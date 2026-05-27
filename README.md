# AI Enablement Dashboard — Merchant Engineering

Live at: **https://jbryancondor.github.io/ai-enablement-dashboard/**

Tracks individual and harness capability for the Merchant Engineering squad, populated from the AI-Native Engineering self-assessment survey (Google Form) and automated repo scanning (`context-engineering-map`).

---

## How to update the dashboard with new data

Each wave of the survey produces a new CSV export. Follow these steps to ingest it and publish the updated dashboard.

### 1. Prerequisites

- Python 3.10+
- Node.js 20+
- `context-engineering-map` script available at `~/addi/project/context-engineering-map/map.sh`
- Access to this repository

### 2. Export the new survey CSV

1. Open the Google Form responses sheet.
2. **File → Download → CSV**.
3. Save the file anywhere — you will pass the path to the ingest script.

> The CSV must **not** be committed to the repo. `docs/input/` is in `.gitignore` to prevent PII leaks.

### 3. Run the ingest pipeline

```bash
# From the project root
python3 scripts/ingest.py "path/to/your-responses.csv" --captured-at YYYY-MM-DD
```

Replace `YYYY-MM-DD` with today's date (e.g. `2026-08-01`). The script is **idempotent** — running it twice with the same CSV is safe and will skip already-ingested rows.

What the script does:
- Parses the CSV and deduplicates by `(email, submittedAt)`
- Scans each repo listed in `config/squad.yaml` using `context-engineering-map`
- Writes `src/data/generated/history.json`, `src/data/generated/latest-infra.json`, and an audit entry in `src/data/generated/manifest.json`

### 4. Add a new engineer or repo (optional)

**New engineer** — no action needed. Engineers are derived automatically from survey responses.

**New repo** — add the absolute path to `config/squad.yaml`:

```yaml
squad_id: merchant-engineering
repos:
  - /Users/you/addi/project/platform/your-new-repo
  # ... existing repos
```

### 5. Verify locally

```bash
npm install          # only needed once
npm run dev          # open http://localhost:5173/ai-enablement-dashboard/
```

Check that the new wave appears and the charts look correct.

### 6. Commit and deploy

```bash
git add src/data/generated/
git commit -m "data: ingest wave YYYY-MM"
git push
```

Pushing to `master` automatically triggers the GitHub Actions workflow which builds and publishes to GitHub Pages. The live URL updates within ~1 minute.

You can monitor the deployment at:
**https://github.com/jbryancondor/ai-enablement-dashboard/actions**

---

## Project structure

```
config/
  squad.yaml               # repo paths for infra scanning

scripts/
  ingest.py                # data ingestion pipeline

src/
  data/
    generated/             # output of ingest.py (committed, no PII)
      history.json         # all survey submissions
      latest-infra.json    # latest repo scan snapshot
      manifest.json        # ingest audit trail
    types.ts               # TypeScript interfaces
    tiers.ts               # tier definitions and scoring logic
    selectors.ts           # pure functions: data → chart-ready shapes
  components/
    charts/                # chart components (heatmaps, tiles, table)
    layout/                # Card, Header, EmptyState, InfoModal
  routes/
    SquadDashboard.tsx     # main squad view (Individual + Harness columns)
    IndividualDashboard.tsx # per-engineer profile view

docs/
  input/                   # survey CSVs (gitignored — never committed)
```

---

## Local development

```bash
npm install
npm run dev      # dev server at http://localhost:5173/ai-enablement-dashboard/
npm run build    # production build
npm run lint     # ESLint
```
