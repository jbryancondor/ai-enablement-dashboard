/**
 * Pure selector functions: History + InfraSnapshots → graph-ready data.
 * All functions are referentially transparent — no side effects.
 */

import type { History, Submission, InfraSnapshot, Blocker, TierId } from './types';
import { getTierDef, getNextTier } from './tiers';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Return the latest submission per engineer for a given month (YYYY-MM). */
export function latestSubmissionsForMonth(
  history: History,
  month: string | null,
): Submission[] {
  const cutoff = month ? `${month}-31T23:59:59` : null;
  const byEngineer = new Map<string, Submission>();

  const sorted = [...history.submissions].sort(
    (a, b) => a.submittedAt.localeCompare(b.submittedAt),
  );

  for (const sub of sorted) {
    if (cutoff && sub.submittedAt > cutoff) continue;
    byEngineer.set(sub.engineerId, sub);
  }

  return [...byEngineer.values()];
}

/** Find an engineer's display name by id. Falls back to email, then id. */
export function engineerName(history: History, engineerId: string): string {
  const eng = history.engineers.find(e => e.id === engineerId);
  return eng?.name?.trim() || eng?.email || engineerId;
}

/** Find an engineer's email by id. */
export function engineerEmail(history: History, engineerId: string): string {
  return history.engineers.find(e => e.id === engineerId)?.email ?? '';
}

// ─── S1: Tier Distribution ────────────────────────────────────────────────────

export interface TierDistributionData {
  explorer: number;
  adopter: number;
  champion: number;
  total: number;
}

export function selectTierDistribution(
  history: History,
  month: string | null,
): TierDistributionData | null {
  const subs = latestSubmissionsForMonth(history, month);
  if (subs.length === 0) return null;

  const counts = { explorer: 0, adopter: 0, champion: 0 };
  for (const sub of subs) {
    counts[sub.tier]++;
  }

  return { ...counts, total: subs.length };
}

// ─── S2: Survey Response Trend ────────────────────────────────────────────────

export interface TrendPoint {
  month: string; // YYYY-MM
  value: number; // 0..1
  label: string;
}

/**
 * Bucket submissions by month, compute response rate (unique respondents / total engineers).
 */
export function selectResponseTrend(history: History): TrendPoint[] {
  const totalEngineers = history.engineers.length;
  if (totalEngineers === 0) return [];

  const byMonth = new Map<string, Set<string>>();

  for (const sub of history.submissions) {
    const month = sub.submittedAt.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, new Set());
    byMonth.get(month)!.add(sub.engineerId);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, respondents]) => ({
      month,
      value: respondents.size / totalEngineers,
      label: `${respondents.size}/${totalEngineers}`,
    }));
}

// ─── S3: Capability Reach L1–L7 ──────────────────────────────────────────────

export interface CapabilityReachBar {
  level: string;       // 'L1' .. 'L7'
  levelLabel: string;
  explorer: number;    // count of engineers in this tier with this level score
  adopter: number;
  champion: number;
}

const LEVEL_LABELS: Record<string, string> = {
  L1: 'L1 Agentic IDE',
  L2: 'L2 Single CLI',
  L3: 'L3 Spec-driven',
  L4: 'L4 Compound Eng.',
  L5: 'L5 Multi-agentic',
  L6: 'L6 Background Agents',
  L7: 'L7 Orchestrate',
};

export function selectCapabilityReach(
  history: History,
  month: string | null,
): CapabilityReachBar[] {
  const subs = latestSubmissionsForMonth(history, month);

  return (['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'] as const).map(level => {
    const counts = { explorer: 0, adopter: 0, champion: 0 };
    for (const sub of subs) {
      const score = sub.levels[level] ?? 0;
      if (score >= 1) {
        counts[sub.tier]++;
      }
    }
    return {
      level,
      levelLabel: LEVEL_LABELS[level],
      ...counts,
    };
  });
}

// ─── S3 (v2): Capability Heatmap — engineers × L1–L7 ─────────────────────────

export interface HeatmapRow {
  engineerId: string;
  name: string;
  email: string;
  tier: TierId;
  proficiency: number;
  scores: Record<string, number>; // L1..L7 → 0..5
}

export const LEVEL_KEYS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'] as const;

export const LEVEL_FULL_LABELS: Record<string, string> = {
  L1: 'Agentic IDE',
  L2: 'Single CLI',
  L3: 'Spec-driven',
  L4: 'Compound Eng.',
  L5: 'Multi-agentic CLIs',
  L6: 'Background Agents',
  L7: 'Orchestrate Teams',
};

export function selectCapabilityHeatmap(
  history: History,
  month: string | null,
): HeatmapRow[] {
  const subs = latestSubmissionsForMonth(history, month);
  return subs
    .map(sub => {
      const eng = history.engineers.find(e => e.id === sub.engineerId);
      return {
        engineerId: sub.engineerId,
        name: eng?.name?.trim() || eng?.email || sub.engineerId,
        email: eng?.email || '',
        tier: sub.tier,
        proficiency: sub.proficiency,
        scores: { ...sub.levels } as Record<string, number>,
      };
    })
    .sort((a, b) => b.proficiency - a.proficiency);
}

// ─── S5: Agentic Infra Coverage (Bullet) ─────────────────────────────────────

export interface BulletData {
  value: number;   // 0..1
  target: number;  // 0..1
  poorMax: number;
  okMax: number;
}

export function selectInfraCoverage(
  infra: InfraSnapshot | null,
  target: number,
  poorMax: number,
  okMax: number,
): BulletData {
  return {
    value: infra?.coverage ?? 0,
    target,
    poorMax,
    okMax,
  };
}

// ─── S7: Blocker Swimlane ─────────────────────────────────────────────────────

export function selectBlockers(history: History, month: string | null): Blocker[] {
  const subs = latestSubmissionsForMonth(history, month);
  const blockers: Blocker[] = [];

  for (const sub of subs) {
    const gap = sub.biggestGap?.trim();
    if (!gap || /^none\.?$/i.test(gap)) continue;
    const eng = history.engineers.find(e => e.id === sub.engineerId);
    const displayName = eng?.name?.trim() || eng?.email || sub.engineerId;
    blockers.push({
      id: `blocker-${sub.id}`,
      ownerEngineerId: sub.engineerId,
      ownerName: displayName,
      description: gap,
      openedAt: sub.submittedAt,
      status: 'open',
    });
  }

  return blockers.sort((a, b) => a.openedAt.localeCompare(b.openedAt));
}

// ─── S11: Flat Data Table ─────────────────────────────────────────────────────

export interface TableRow {
  engineerId: string;
  name: string;
  email: string;
  tier: string;
  proficiency: number;
  L1: number; L2: number; L3: number; L4: number;
  L5: number; L6: number; L7: number;
  biggestGap: string;
  plannedActions: string;
  submittedAt: string;
}

export function selectTableRows(
  history: History,
  month: string | null,
): TableRow[] {
  const subs = latestSubmissionsForMonth(history, month);
  return subs
    .map(sub => {
      const eng = history.engineers.find(e => e.id === sub.engineerId);
      return {
        engineerId: sub.engineerId,
        name: eng?.name ?? '',
        email: eng?.email ?? '',
        tier: sub.tier,
        proficiency: sub.proficiency,
        L1: sub.levels.L1, L2: sub.levels.L2, L3: sub.levels.L3,
        L4: sub.levels.L4, L5: sub.levels.L5, L6: sub.levels.L6,
        L7: sub.levels.L7,
        biggestGap: sub.biggestGap ?? '',
        plannedActions: sub.plannedActions ?? '',
        submittedAt: sub.submittedAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── I1: Engineer profile ─────────────────────────────────────────────────────

export interface EngineerProfile {
  id: string;
  name: string;
  email: string;
  tier: string;
  proficiency: number;
  levels: Record<string, number>;
  biggestGap?: string;
  plannedActions?: string;
  submittedAt: string;
}

export function selectEngineerProfile(
  history: History,
  engineerId: string,
  month: string | null,
): EngineerProfile | null {
  const subs = latestSubmissionsForMonth(history, month);
  const sub = subs.find(s => s.engineerId === engineerId);
  if (!sub) return null;

  const eng = history.engineers.find(e => e.id === engineerId);
  return {
    id: engineerId,
    name: eng?.name ?? '',
    email: eng?.email ?? '',
    tier: sub.tier,
    proficiency: sub.proficiency,
    levels: { ...sub.levels },
    biggestGap: sub.biggestGap ?? undefined,
    plannedActions: sub.plannedActions ?? undefined,
    submittedAt: sub.submittedAt,
  };
}

// ─── I3: Submission history (sparkline) ──────────────────────────────────────

export interface SubmissionPoint {
  submittedAt: string;
  proficiency: number;
  tier: string;
  avgScore: number; // 1..5 scale for display
}

export function selectEngineerSubmissionHistory(
  history: History,
  engineerId: string,
): SubmissionPoint[] {
  return history.submissions
    .filter(s => s.engineerId === engineerId)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map(s => ({
      submittedAt: s.submittedAt,
      proficiency: s.proficiency,
      tier: s.tier,
      avgScore: parseFloat((s.proficiency * 5).toFixed(2)),
    }));
}

// ─── I7: Next tier progress ───────────────────────────────────────────────────

export interface NextTierProgress {
  currentTier: string;
  nextTierLabel: string | null;
  progressPct: number; // 0..1 toward next tier minAvgScore
  currentAvg: number;
  targetAvg: number | null;
  criteria: Array<{ label: string; met: boolean; current?: string }>;
}

export function selectNextTierProgress(
  history: History,
  engineerId: string,
  month: string | null,
): NextTierProgress | null {
  const profile = selectEngineerProfile(history, engineerId, month);
  if (!profile) return null;

  const currentDef = getTierDef(profile.tier as TierId);
  const nextDef = getNextTier(profile.tier as TierId);
  const avgScore = profile.proficiency * 5;

  if (!nextDef) {
    return {
      currentTier: profile.tier,
      nextTierLabel: null,
      progressPct: 1,
      currentAvg: avgScore,
      targetAvg: null,
      criteria: currentDef.criteria.map(c => ({ label: c, met: true })),
    };
  }

  const progressPct = Math.min(
    1,
    Math.max(0, (avgScore - currentDef.minAvgScore) / (nextDef.minAvgScore - currentDef.minAvgScore)),
  );

  return {
    currentTier: profile.tier,
    nextTierLabel: nextDef.label,
    progressPct,
    currentAvg: avgScore,
    targetAvg: nextDef.minAvgScore,
    criteria: nextDef.criteria.map(c => ({
      label: c,
      met: avgScore >= nextDef.minAvgScore,
    })),
  };
}

// ─── CSV export helper ────────────────────────────────────────────────────────

export function rowsToCSV(rows: TableRow[]): string {
  const headers = [
    'Name', 'Email', 'Tier', 'Proficiency',
    'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7',
    'Biggest Gap', 'Planned Actions', 'Submitted At',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      [r.name, r.email, r.tier, r.proficiency,
       r.L1, r.L2, r.L3, r.L4, r.L5, r.L6, r.L7,
       r.biggestGap, r.plannedActions, r.submittedAt]
        .map(escape).join(','),
    ),
  ];
  return lines.join('\n');
}
