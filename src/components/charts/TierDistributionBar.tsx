import type { TierDistributionData } from '../../data/selectors';
import { useCountUp } from '../../hooks/useCountUp';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: TierDistributionData | null;
  responseNote?: string | null;
}

const TIERS = [
  { key: 'champion' as const, label: 'Champion', description: 'Leading adoption' },
  { key: 'adopter'  as const, label: 'Adopter',  description: 'Consistent usage'  },
  { key: 'explorer' as const, label: 'Explorer', description: 'Getting started'   },
];

function TierTile({ tierKey, label, description, count, pct, delay }: {
  tierKey: string; label: string; description: string;
  count: number; pct: number; delay: number;
}) {
  const animated = useCountUp(count, 700);
  const fmt = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div style={{
      borderRadius: 10,
      padding: '14px 16px',
      background: `var(--tier-${tierKey})0f`,
      border: `1.5px solid var(--tier-${tierKey})40`,
      display: 'flex', flexDirection: 'column', gap: 4,
      animation: `staggerFadeIn 0.4s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
          background: `var(--tier-${tierKey})`, flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: `var(--tier-${tierKey})`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{animated}</span>
        <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>{fmt(pct)}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
      <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          background: `var(--tier-${tierKey})`,
          borderRadius: 2,
          transformOrigin: 'left',
          animation: `scaleInX 0.7s ease both`,
          animationDelay: `${delay + 100}ms`,
        }} />
      </div>
    </div>
  );
}

export function TierDistributionBar({ data, responseNote }: Props) {
  if (!data) return <EmptyState />;

  const total = data.total;
  const fmt = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 3 stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {TIERS.map((t, i) => (
          <TierTile
            key={t.key}
            tierKey={t.key}
            label={t.label}
            description={t.description}
            count={data[t.key]}
            pct={total > 0 ? data[t.key] / total : 0}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Full distribution bar at bottom */}
      <div>
        <div style={{
          height: 10, borderRadius: 5, overflow: 'hidden',
          display: 'flex',
        }}>
          {TIERS.map((t, i) => {
            const pct = total > 0 ? (data[t.key] / total) * 100 : 0;
            return (
              <div
                key={t.key}
                title={`${t.label}: ${data[t.key]} (${fmt(data[t.key] / total)})`}
                style={{
                  width: `${pct}%`,
                  background: `var(--tier-${t.key})`,
                  borderRadius: i === 0 ? '5px 0 0 5px' : i === TIERS.length - 1 ? '0 5px 5px 0' : 0,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            {total} engineers · latest submission per engineer
          </p>
          {responseNote && (
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '2px 8px',
              whiteSpace: 'nowrap',
            }}>
              {responseNote}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
