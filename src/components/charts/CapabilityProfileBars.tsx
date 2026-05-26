import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { LevelScores } from '../../data/types';

interface Props {
  levels: LevelScores;
}

const LEVEL_META: Array<{ key: keyof LevelScores; label: string; color: string }> = [
  { key: 'L1', label: 'L1 Agentic IDE',        color: 'var(--color-l1)' },
  { key: 'L2', label: 'L2 Single CLI',          color: 'var(--color-l2)' },
  { key: 'L3', label: 'L3 Spec-driven',         color: 'var(--color-l3)' },
  { key: 'L4', label: 'L4 Compound',            color: 'var(--color-l4)' },
  { key: 'L5', label: 'L5 Multi-agentic',       color: 'var(--color-l5)' },
  { key: 'L6', label: 'L6 Background Agents',   color: 'var(--color-l6)' },
  { key: 'L7', label: 'L7 Orchestrate Teams',   color: 'var(--color-l7)' },
];

export function CapabilityProfileBars({ levels }: Props) {
  const data = LEVEL_META.map(m => ({ label: m.label, score: levels[m.key], color: m.color }));

  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 120, bottom: 0 }}>
          <XAxis type="number" domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={120} />
          <Tooltip formatter={(v: unknown) => [`${v} / 5`, 'Self-rating']} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12, fill: 'var(--text-muted)' }}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
