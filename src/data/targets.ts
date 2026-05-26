export interface Target {
  key: string;
  label: string;
  value: number;       // goal value
  poorMax: number;     // below this = poor
  okMax: number;       // below this = ok, above = good
  unit?: string;
}

// Static quarterly targets — edit here when targets change
export const TARGETS: Record<string, Target> = {
  infraCoverage: {
    key: 'infraCoverage',
    label: 'Agentic Infra Coverage',
    value: 0.80,
    poorMax: 0.40,
    okMax: 0.65,
    unit: '%',
  },
  responseRate: {
    key: 'responseRate',
    label: 'Survey Response Rate',
    value: 1.00,
    poorMax: 0.50,
    okMax: 0.75,
    unit: '%',
  },
  championPct: {
    key: 'championPct',
    label: 'Champions',
    value: 0.30,
    poorMax: 0.10,
    okMax: 0.20,
    unit: '%',
  },
};
