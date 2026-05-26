import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import type { TrendPoint } from '../../data/selectors';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: TrendPoint[];
  baseline?: number;
}

export function ResponseTrendLine({ data, baseline = 1 }: Props) {
  const fmt = (v: number) => `${Math.round(v * 100)}%`;

  if (data.length === 0) {
    return <EmptyState message="No survey data yet. Run ingest with a CSV to populate this chart." />;
  }

  // Single wave: show a big current value instead of a misleading flat line
  if (data.length === 1) {
    const point = data[0];
    return (
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {fmt(point.value)}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>response rate</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {point.label} responded · wave {point.month}
        </div>
        <div style={{
          marginTop: 4, fontSize: 12, color: 'var(--text-muted)',
          background: 'var(--surface-muted)', borderRadius: 6, padding: '8px 10px',
        }}>
          Trend will appear after the next survey wave is ingested.
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          />
          <Tooltip
            formatter={(v: unknown, _: unknown, props: { payload?: { label?: string } }) => [
              `${fmt(v as number)} (${props.payload?.label ?? ''})`,
              'Response Rate',
            ]}
          />
          <ReferenceLine y={baseline} stroke="var(--tier-champion)" strokeDasharray="4 4" label={{ value: 'Target', fill: 'var(--text-muted)', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-l2)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--color-l2)' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
