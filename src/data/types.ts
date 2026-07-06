export type TierId = 'explorer' | 'adopter' | 'champion';

export interface Engineer {
  id: string;
  name: string;
  email: string;
}

export interface LevelScores {
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  L5: number;
  L6: number;
  L7: number;
}

export interface Submission {
  id: string;
  engineerId: string;
  submittedAt: string; // ISO string — dedup key part 2
  levels: LevelScores;
  proficiency: number; // avg(L1..L7)/5, 0..1
  tier: TierId;
  biggestGap?: string;
  plannedActions?: string;
  hackathonTakeaway?: string;
  hackathonPlan?: string;
}

export interface History {
  engineers: Engineer[];
  submissions: Submission[];
}

export type HarnessTierId = 'seed' | 'rooted' | 'growing' | 'mature';

export interface Repo {
  path: string;
  name: string;
  agentsMdCount: number;
  skillCount: number;
  skills: Array<{ name: string; description: string }>;
}

export interface InfraSnapshot {
  capturedAt: string; // YYYY-MM-DD
  squadId: string;
  repos: Repo[];
  coverage: number; // repos_with_AGENTS / total_repos
}

export interface IngestEntry {
  ingestedAt: string;
  csvPath: string;
  csvSha256: string;
  capturedAt: string;
  rowsAdded: number;
  rowsSkipped: number;
  rowsConflicted: number;
  infraSnapshot: string;
}

export interface Manifest {
  ingests: IngestEntry[];
}

export interface Blocker {
  id: string;
  ownerEngineerId: string;
  ownerName: string;
  description: string;
  openedAt: string;
  status: 'open' | 'in-progress' | 'resolved';
}
