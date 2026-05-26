import type { TierId } from './types';

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
