import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LabelList,
} from 'recharts';
import type { CapabilityReachBar as CapabilityReachData } from '../../data/selectors';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: CapabilityReachData[];
}

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  'L1 Agentic IDE':        'Agentic IDE usage',
  'L2 Single CLI':         'Single agentic CLI',
  'L3 Spec-driven':        'Spec-driven development',
  'L4 Compound Eng.':      'Compound engineering',
  'L5 Multi-agentic':      'Multi-agentic CLIs',
  'L6 Background Agents':  'Long-running background agents',
  'L7 Orchestrate':        'Orchestrate autonomous teams',
};

const LEGEND = [
  { key: 'champion', label: 'Champion', color: 'var(--tier-champion)' },
  { key: 'adopter',  label: 'Adopter',  color: 'var(--tier-adopter)'  },
  { key: 'explorer', label: 'Explorer', color: 'var(--tier-explorer)' },
];

export function CapabilityReachBar({ data }: Props) {
  if (data.length === 0 || data.every(d => d.explorer + d.adopter + d.champion === 0)) {
    return <EmptyState />;
  }

  // Vertical chart: use short "L1"…"L7" x-axis labels, full name in tooltip
  const chartData = data.map(d => ({
    ...d,
    shortLabel: d.level, // "L1", "L2" … — never wraps
    total: d.champion + d.adopter + d.explorer,
  }));

  const maxTotal = Math.max(...chartData.map(d => d.total));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {LEGEND.map(l => (
          <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Vertical stacked bar — L1…L7 on X axis, count on Y axis */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 8, left: -16, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text)' }}
            />
            <YAxis
              domain={[0, maxTotal]}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <Tooltip
              labelFormatter={(label: unknown) => {
                const row = chartData.find(d => d.shortLabel === String(label));
                return LEVEL_DESCRIPTIONS[row?.levelLabel ?? ''] ?? String(label);
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: unknown, name: unknown) => [`${v} engineers`, String(name ?? '')]) as any}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Bar dataKey="champion" stackId="tier" fill="var(--tier-champion)" name="Champion" />
            <Bar dataKey="adopter"  stackId="tier" fill="var(--tier-adopter)"  name="Adopter" />
            <Bar dataKey="explorer" stackId="tier" fill="var(--tier-explorer)" name="Explorer" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="total"
                position="top"
                style={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
        Count of engineers with score ≥ 1 at each level · hover for level description
      </p>
    </div>
  );
}
