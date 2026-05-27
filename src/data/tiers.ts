import type { TierId, HarnessTierId } from './types';

export interface TierDef {
  id: TierId;
  label: string;
  minAvgScore: number; // inclusive lower bound (avg of L1..L7, 1..5 scale)
  color: string;       // CSS var reference
  description: string;
  criteria: string[];
}

export const TIERS: TierDef[] = [
  {
    id: 'explorer',
    label: 'Explorer',
    minAvgScore: 0,
    color: 'var(--tier-explorer)',
    description: 'Getting started with AI-native tooling.',
    criteria: [
      'Average capability score ≥ 1',
      'Using at least one agentic tool (L1 ≥ 1)',
    ],
  },
  {
    id: 'adopter',
    label: 'Adopter',
    minAvgScore: 2.5,
    color: 'var(--tier-adopter)',
    description: 'Consistently integrating AI tools in daily workflow.',
    criteria: [
      'Average capability score ≥ 2.5',
      'L1 (Agentic IDE) ≥ 3',
      'L2 (Single CLI) ≥ 3',
    ],
  },
  {
    id: 'champion',
    label: 'Champion',
    minAvgScore: 3.5,
    color: 'var(--tier-champion)',
    description: 'Advanced practitioner elevating the team.',
    criteria: [
      'Average capability score ≥ 3.5',
      'L1 (Agentic IDE) ≥ 4',
      'L2 (Single CLI) ≥ 4',
      'L3 (Spec-driven) ≥ 3',
      'Sharing learnings with the team',
    ],
  },
];

export function getTierForScore(avgScore: number): TierId {
  if (avgScore >= TIERS[2].minAvgScore) return 'champion';
  if (avgScore >= TIERS[1].minAvgScore) return 'adopter';
  return 'explorer';
}

export function getTierDef(id: TierId): TierDef {
  return TIERS.find(t => t.id === id)!;
}

export function getNextTier(id: TierId): TierDef | null {
  const idx = TIERS.findIndex(t => t.id === id);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// ─── Harness scoring ──────────────────────────────────────────────────────────
// Symmetry: Individual 0–5, Harness 0–3. Same avg-based tier logic.

export interface HarnessTierDef {
  id: HarnessTierId;
  label: string;
  minAvg: number;  // inclusive lower bound of (AGENTS score + Skills score) / 2
  color: string;
  description: string;
}

export const HARNESS_TIERS: HarnessTierDef[] = [
  { id: 'seed',    label: 'Seed',    minAvg: 0,   color: 'var(--harness-seed)',    description: 'No agent files yet' },
  { id: 'rooted',  label: 'Rooted',  minAvg: 0.5, color: 'var(--harness-rooted)',  description: 'Context set up, no skills' },
  { id: 'growing', label: 'Growing', minAvg: 1.5, color: 'var(--harness-growing)', description: 'Agents and skills in progress' },
  { id: 'mature',  label: 'Mature',  minAvg: 2.5, color: 'var(--harness-mature)',  description: 'Well-equipped repo' },
];

/** Convert raw count to 0–3 score using the shared band thresholds. */
export function harnessScoreFromCount(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count <= 5)  return 1;
  if (count <= 10) return 2;
  return 3;
}

/** Derive harness tier from the average of AGENTS score and Skills score. */
export function harnessTierForAvg(avg: number): HarnessTierId {
  if (avg >= 2.5) return 'mature';
  if (avg >= 1.5) return 'growing';
  if (avg >= 0.5) return 'rooted';
  return 'seed';
}

export function getHarnessTierDef(id: HarnessTierId): HarnessTierDef {
  return HARNESS_TIERS.find(t => t.id === id)!;
}
