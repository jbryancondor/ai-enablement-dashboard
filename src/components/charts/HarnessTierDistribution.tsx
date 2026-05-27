import type { HarnessTierDistData } from '../../data/selectors';
import { HARNESS_TIERS } from '../../data/tiers';
import { useCountUp } from '../../hooks/useCountUp';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: HarnessTierDistData | null;
  scanNote?: string | null;
}

function HarnessTile({ t, count, pct, delay, fmt }: {
  t: { id: string; label: string; color: string; description: string };
  count: number; pct: number; delay: number;
  fmt: (v: number) => string;
}) {
  const animated = useCountUp(count, 900);
  return (
    <div style={{
      borderRadius: 10, padding: '12px 14px',
      background: `${t.color}0f`, border: `1.5px solid ${t.color}40`,
      display: 'flex', flexDirection: 'column', gap: 4,
      animation: 'staggerFadeIn 0.5s ease both',
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: t.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{animated}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{fmt(pct)}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{t.description}</div>
      <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`, background: t.color, borderRadius: 2,
          transformOrigin: 'left',
          animation: 'scaleInX 0.9s ease both',
          animationDelay: `${delay + 100}ms`,
        }} />
      </div>
    </div>
  );
}

export function HarnessTierDistribution({ data, scanNote }: Props) {
  if (!data) return <EmptyState message="No infra scan data. Add repo paths to config/squad.yaml and re-run ingest." />;

  const total = data.total;
  const fmt = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {HARNESS_TIERS.map((t, i) => {
          const count = data[t.id];
          const pct = total > 0 ? count / total : 0;
          return <HarnessTile key={t.id} t={t} count={count} pct={pct} delay={i * 100} fmt={fmt} />;
        })}
      </div>

      {/* Distribution strip */}
      <div>
        <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          {HARNESS_TIERS.map((t, i) => {
            const pct = total > 0 ? (data[t.id] / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={t.id}
                title={`${t.label}: ${data[t.id]} (${fmt(data[t.id] / total)})`}
                style={{
                  width: `${pct}%`,
                  background: t.color,
                  borderRadius: i === 0 ? '5px 0 0 5px' : i === HARNESS_TIERS.length - 1 ? '0 5px 5px 0' : 0,
                  minWidth: pct > 0 ? 2 : 0,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            {total} repos · avg = (AGENTS score + Skills score) / 2
          </p>
          {scanNote && (
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--surface-muted)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '2px 8px', whiteSpace: 'nowrap',
            }}>
              {scanNote}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
