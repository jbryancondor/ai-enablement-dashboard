#!/usr/bin/env python3
"""
ingest.py — AI Enablement Dashboard data ingestion script.

Usage:
  python scripts/ingest.py <csv_path> [options]
  python scripts/ingest.py --refresh-infra-only

Options:
  --captured-at YYYY-MM-DD   Override the captured-at date (default: max row timestamp)
  --reingest-conflicts        On (email, submittedAt) conflict, replace existing row
  --refresh-infra-only        Skip CSV, only snapshot repos at today's date

Outputs:
  src/data/generated/history.json          — append-only, deduped, sorted
  src/data/generated/infra/<date>.json     — infra snapshot per run
  src/data/generated/manifest.json         — ingest audit trail

Config:
  config/squad.yaml                        — squad id, name, repo paths
"""

import argparse
import csv
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GENERATED = ROOT / "src" / "data" / "generated"
INFRA_DIR = GENERATED / "infra"
HISTORY_FILE = GENERATED / "history.json"
MANIFEST_FILE = GENERATED / "manifest.json"
CONFIG_FILE = ROOT / "config" / "squad.yaml"
MAP_SCRIPT = Path("/Users/bcondor/bcd/dotfiles/scripts/context-engineering-map")

LEVEL_COLS = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"]

# CSV column name patterns (flexible match)
COL_EMAIL = "Email Address"
COL_NAME = "Full name"
COL_TIMESTAMP = "Timestamp"
COL_GAP = "Biggest gap"
COL_ACTIONS = "1"  # prefix match
COL_HACKATHON_TAKEAWAY = "Which takeaway"
COL_HACKATHON_PLAN = "What of them"

# Tier thresholds (mirrors src/data/tiers.ts)
CHAMPION_MIN = 3.5
ADOPTER_MIN = 2.5


# ─── helpers ──────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_yaml_simple(path: Path) -> dict:
    """Minimal YAML parser for our config — only handles simple key:value and lists."""
    result: dict = {}
    current_key = None
    in_list = False
    with open(path, encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.rstrip()
            stripped = line.lstrip()
            if not stripped or stripped.startswith("#"):
                continue
            indent = len(line) - len(stripped)
            if stripped.startswith("- "):
                val = stripped[2:].strip().strip('"').strip("'")
                if not val.startswith("#") and current_key:
                    # Coerce to list on first item regardless of initial type
                    if not isinstance(result.get(current_key), list):
                        result[current_key] = []
                    result[current_key].append(val)
            elif ":" in stripped and not stripped.startswith("-"):
                k, _, v = stripped.partition(":")
                k = k.strip()
                v = v.strip()
                if indent == 0:
                    current_key = k
                    if v == "[]":
                        result[k] = []
                    elif v == "":
                        result[k] = {}  # will be coerced to list if - items follow
                    else:
                        result[k] = v
                else:
                    if isinstance(result.get(current_key), dict):
                        result[current_key][k] = v if v else {}
                    else:
                        result[current_key] = {k: v if v else {}}
    return result


def load_config() -> dict:
    cfg = load_yaml_simple(CONFIG_FILE)
    squad_raw = cfg.get("squad", {})
    repos_raw = cfg.get("repos", [])
    # Handle flat structure
    if isinstance(squad_raw, dict):
        squad = squad_raw
    else:
        squad = {"id": "merchant-engineering", "name": "Merchant Engineering"}
    repos = [r for r in repos_raw if r and not r.startswith("#")]
    return {"squad": squad, "repos": repos}


def parse_timestamp(ts: str) -> str:
    """Parse form timestamp like '5/18/2026 11:06:50' → ISO string."""
    ts = ts.strip()
    for fmt in ("%m/%d/%Y %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.datetime.strptime(ts, fmt)
            return dt.isoformat()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse timestamp: {ts!r}")


def parse_level(val: str) -> int:
    """Parse a level score, returning 0 if empty/invalid."""
    val = val.strip()
    if not val:
        return 0
    try:
        v = int(float(val))
        return max(0, min(5, v))
    except ValueError:
        return 0


def score_to_tier(avg: float) -> str:
    if avg >= CHAMPION_MIN:
        return "champion"
    if avg >= ADOPTER_MIN:
        return "adopter"
    return "explorer"


def find_col(headers: list[str], prefix: str) -> str | None:
    for h in headers:
        if h.strip().lower().startswith(prefix.lower()):
            return h
    return None


def parse_csv(csv_path: str) -> list[dict]:
    """Parse CSV and return list of raw submission dicts."""
    rows = []
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        col_gap = find_col(headers, "Biggest gap") or find_col(headers, "Biggest") or ""
        col_actions = find_col(headers, "1\u20132 actions") or find_col(headers, "1-2 actions") or find_col(headers, "1\u20132") or ""
        col_hackathon_takeaway = find_col(headers, COL_HACKATHON_TAKEAWAY) or ""
        col_hackathon_plan = find_col(headers, COL_HACKATHON_PLAN) or ""
        # Find L1..L7 column names
        level_cols: dict[str, str] = {}
        for lvl in LEVEL_COLS:
            col = find_col(headers, f"{lvl} \u2014") or find_col(headers, f"{lvl} -") or find_col(headers, f"{lvl}:")
            if col:
                level_cols[lvl] = col
        for row in reader:
            email = (row.get(COL_EMAIL) or "").strip().lower()
            name = (row.get(COL_NAME) or "").strip()
            ts_raw = (row.get(COL_TIMESTAMP) or "").strip()
            if not email or not ts_raw:
                continue
            try:
                submitted_at = parse_timestamp(ts_raw)
            except ValueError as e:
                log(f"  WARN: skipping row with bad timestamp ({e})")
                continue
            levels: dict[str, int] = {}
            for lvl in LEVEL_COLS:
                col = level_cols.get(lvl)
                levels[lvl] = parse_level(row.get(col, "0")) if col else 0
            scores = list(levels.values())
            avg = sum(scores) / len(scores) if scores else 0
            rows.append({
                "email": email,
                "name": name,
                "submittedAt": submitted_at,
                "levels": levels,
                "proficiency": round(avg / 5, 4),
                "tier": score_to_tier(avg),
                "biggestGap": (row.get(col_gap) or "").strip() or None,
                "plannedActions": (row.get(col_actions) or "").strip() or None,
                "hackathonTakeaway": (row.get(col_hackathon_takeaway) or "").strip() or None,
                "hackathonPlan": (row.get(col_hackathon_plan) or "").strip() or None,
            })
    return rows


def load_history() -> dict:
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"engineers": [], "submissions": []}


def save_history(history: dict) -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    history["engineers"].sort(key=lambda e: e["email"])
    history["submissions"].sort(key=lambda s: s["submittedAt"])
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


def load_manifest() -> dict:
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"ingests": []}


def save_manifest(manifest: dict) -> None:
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


def merge_submissions(
    history: dict,
    new_rows: list[dict],
    reingest_conflicts: bool,
) -> tuple[int, int, int]:
    """Merge new rows into history. Returns (added, skipped, conflicted)."""
    existing_map: dict[str, int] = {}  # (email, submittedAt) → index in submissions
    for i, s in enumerate(history["submissions"]):
        eng = next((e for e in history["engineers"] if e["id"] == s["engineerId"]), None)
        if eng:
            key = f"{eng['email']}|{s['submittedAt']}"
            existing_map[key] = i

    engineer_map: dict[str, dict] = {e["email"]: e for e in history["engineers"]}

    added = skipped = conflicted = 0

    for row in new_rows:
        email = row["email"]
        submitted_at = row["submittedAt"]
        key = f"{email}|{submitted_at}"

        # Ensure engineer record exists
        if email not in engineer_map:
            eng_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"engineer:{email}"))
            engineer_map[email] = {"id": eng_id, "name": row["name"], "email": email}
            history["engineers"].append(engineer_map[email])
        else:
            # Update name if it was missing
            if not engineer_map[email].get("name") and row["name"]:
                engineer_map[email]["name"] = row["name"]

        eng_id = engineer_map[email]["id"]

        sub = {
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"submission:{email}:{submitted_at}")),
            "engineerId": eng_id,
            "submittedAt": submitted_at,
            "levels": row["levels"],
            "proficiency": row["proficiency"],
            "tier": row["tier"],
            "biggestGap": row["biggestGap"],
            "plannedActions": row["plannedActions"],
            "hackathonTakeaway": row["hackathonTakeaway"],
            "hackathonPlan": row["hackathonPlan"],
        }

        if key not in existing_map:
            history["submissions"].append(sub)
            added += 1
        else:
            existing = history["submissions"][existing_map[key]]
            if existing == sub:
                skipped += 1
            else:
                conflicted += 1
                if reingest_conflicts:
                    history["submissions"][existing_map[key]] = sub
                    log(f"  CONFLICT replaced: {email} @ {submitted_at}")
                else:
                    log(f"  CONFLICT kept first: {email} @ {submitted_at} (use --reingest-conflicts to replace)")

    return added, skipped, conflicted


# ─── infra snapshot ───────────────────────────────────────────────────────────

def run_map_script(repo_path: str) -> str:
    """Run context-engineering-map for a repo and return its stdout."""
    if not MAP_SCRIPT.exists():
        log(f"  WARN: map script not found at {MAP_SCRIPT}, skipping {repo_path}")
        return ""
    try:
        result = subprocess.run(
            [str(MAP_SCRIPT), repo_path],
            capture_output=True, text=True, timeout=30,
        )
        return result.stdout
    except subprocess.TimeoutExpired:
        log(f"  WARN: map script timed out for {repo_path}")
        return ""
    except Exception as e:
        log(f"  WARN: map script error for {repo_path}: {e}")
        return ""


def parse_map_output(output: str) -> tuple[int, list[dict]]:
    """
    Parse context-engineering-map output to extract AGENTS.md count and skills.
    Returns (agents_md_count, [{ name, description }]).
    """
    agents_count = output.count("AGENTS.md")
    skills = []
    skill_re = re.compile(r"(?:├──|└──)\s+([\w\-]+)/\s{2,}(.+)")
    for line in output.splitlines():
        m = skill_re.search(line)
        if m:
            name = m.group(1).strip()
            desc = m.group(2).strip()
            if name.lower() not in ("agents", ".agents"):
                skills.append({"name": name, "description": desc})
    return agents_count, skills


def build_infra_snapshot(repos: list[str], squad_id: str, captured_at: str) -> dict:
    repo_entries = []
    for repo_path in repos:
        if not os.path.isdir(repo_path):
            log(f"  WARN: repo path not found, skipping: {repo_path}")
            continue
        log(f"  scanning {repo_path} …")
        output = run_map_script(repo_path)
        agents_count, skills = parse_map_output(output)
        repo_entries.append({
            "path": repo_path,
            "name": os.path.basename(repo_path),
            "agentsMdCount": agents_count,
            "skillCount": len(skills),
            "skills": skills,
        })

    repo_entries.sort(key=lambda r: r["path"])
    total = len(repo_entries)
    covered = sum(1 for r in repo_entries if r["agentsMdCount"] > 0)
    coverage = round(covered / total, 4) if total > 0 else 0.0

    return {
        "capturedAt": captured_at,
        "squadId": squad_id,
        "repos": repo_entries,
        "coverage": coverage,
    }


def save_infra_snapshot(snapshot: dict) -> Path:
    INFRA_DIR.mkdir(parents=True, exist_ok=True)
    path = INFRA_DIR / f"{snapshot['capturedAt']}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    # Always overwrite latest-infra.json for easy static import in Vite
    latest_path = GENERATED / "latest-infra.json"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    return path


# ─── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest AI Enablement dashboard data.")
    parser.add_argument("csv_path", nargs="?", help="Path to the CSV form responses.")
    parser.add_argument("--captured-at", metavar="YYYY-MM-DD", help="Override captured-at date.")
    parser.add_argument("--reingest-conflicts", action="store_true", help="Replace conflicting rows.")
    parser.add_argument("--refresh-infra-only", action="store_true", help="Skip CSV, only snapshot repos.")
    args = parser.parse_args()

    if not args.refresh_infra_only and not args.csv_path:
        parser.error("csv_path is required unless --refresh-infra-only is set.")

    cfg = load_config()
    squad_id = cfg["squad"].get("id", "merchant-engineering")
    repos = cfg["repos"]

    history = load_history()
    manifest = load_manifest()

    added = skipped = conflicted = 0
    csv_sha = ""
    csv_path_str = ""

    if not args.refresh_infra_only:
        csv_path_str = os.path.abspath(args.csv_path)
        log(f"Parsing CSV: {csv_path_str}")
        csv_sha = sha256_file(csv_path_str)
        rows = parse_csv(csv_path_str)
        log(f"  found {len(rows)} rows")

        # Derive captured-at from CSV max timestamp if not overridden
        if args.captured_at:
            captured_at = args.captured_at
        else:
            timestamps = [r["submittedAt"] for r in rows if r.get("submittedAt")]
            if timestamps:
                max_ts = max(timestamps)
                captured_at = max_ts[:10]
            else:
                captured_at = datetime.date.today().isoformat()

        added, skipped, conflicted = merge_submissions(history, rows, args.reingest_conflicts)
        log(f"  added={added} skipped={skipped} conflicted={conflicted}")
    else:
        captured_at = args.captured_at or datetime.date.today().isoformat()

    # Infra snapshot
    log(f"Snapshotting {len(repos)} repo(s) at {captured_at} …")
    infra = build_infra_snapshot(repos, squad_id, captured_at)
    infra_path = save_infra_snapshot(infra)
    log(f"  infra coverage: {infra['coverage']:.0%}  → {infra_path.relative_to(ROOT)}")

    save_history(history)

    entry: dict = {
        "ingestedAt": datetime.datetime.utcnow().isoformat() + "Z",
        "csvPath": csv_path_str,
        "csvSha256": csv_sha,
        "capturedAt": captured_at,
        "rowsAdded": added,
        "rowsSkipped": skipped,
        "rowsConflicted": conflicted,
        "infraSnapshot": str(infra_path.relative_to(ROOT)),
    }
    manifest["ingests"].append(entry)
    save_manifest(manifest)

    log("Done.")
    log(f"  history:  {HISTORY_FILE.relative_to(ROOT)}")
    log(f"  manifest: {MANIFEST_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
