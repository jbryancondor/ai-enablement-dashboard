import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SubmissionPoint } from '../../data/selectors';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: SubmissionPoint[];
}

export function SubmissionSparkline({ data }: Props) {
  if (data.length === 0) return <EmptyState message="No submission history yet." />;

  if (data.length === 1) {
    return (
      <div style={{ padding: '16px 0', fontSize: 13, color: 'var(--text-muted)' }}>
        <strong style={{ fontSize: 24, color: 'var(--text)' }}>{data[0].avgScore.toFixed(1)}</strong>
        <span> / 5 — first submission on {data[0].submittedAt.slice(0, 10)}</span>
        <p style={{ margin: '8px 0 0' }}>Trend will appear after the next survey wave.</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: d.submittedAt.slice(0, 10),
    score: d.avgScore,
    tier: d.tier,
  }));

  return (
    <div style={{ height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
          <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
          <Tooltip formatter={(v: unknown) => [`${v} / 5`, 'Avg Score']} />
          <ReferenceLine y={2.5} stroke="var(--border)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-l2)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
