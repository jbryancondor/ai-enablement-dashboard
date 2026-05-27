import type { HeatmapRow } from '../../data/selectors';
import { LEVEL_KEYS, LEVEL_FULL_LABELS } from '../../data/selectors';
import type { TierId } from '../../data/types';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: HeatmapRow[];
}

// Blue sequential scale — distinct from Harness tier colors (violet/cyan/green)
const SCORE_COLORS: Record<number, { bg: string; fg: string }> = {
  0: { bg: '#f1f5f9', fg: '#94a3b8' },
  1: { bg: '#dbeafe', fg: '#1e40af' },
  2: { bg: '#93c5fd', fg: '#1e3a8a' },
  3: { bg: '#3b82f6', fg: '#ffffff' },
  4: { bg: '#1d4ed8', fg: '#ffffff' },
  5: { bg: '#1e3a8a', fg: '#ffffff' },
};

const TIER_DOTS: Record<TierId, string> = {
  explorer: 'var(--tier-explorer)',
  adopter:  'var(--tier-adopter)',
  champion: 'var(--tier-champion)',
};

function shortName(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function CapabilityHeatmap({ data }: Props) {
  if (data.length === 0) return <EmptyState />;

  const CELL_H = 36;
  const NAME_W = 120;
  const TIER_W = 10;
  const GAP = 2;
  const HEAD_H = 36;

  // Squad averages per level
  const avgScores = Object.fromEntries(
    LEVEL_KEYS.map(l => [
      l,
      data.reduce((s, r) => s + (r.scores[l] ?? 0), 0) / data.length,
    ]),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>Score:</span>
        {[0, 1, 2, 3, 4, 5].map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 4,
              background: SCORE_COLORS[s].bg,
              color: SCORE_COLORS[s].fg,
              fontSize: 11, fontWeight: 700,
            }}>{s}</span>
            {s === 0 ? 'none' : s === 5 ? 'expert' : ''}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {(['champion', 'adopter', 'explorer'] as TierId[]).map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_DOTS[t], display: 'inline-block' }} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
        </span>
      </div>

      {/* Grid — data columns stretch to fill card width */}
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${TIER_W}px ${NAME_W}px repeat(${LEVEL_KEYS.length + 1}, 1fr)`,
          gap: GAP,
          width: '100%',
        }}>

          {/* Header row */}
          <div /> {/* tier dot col */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Engineer</span>
          </div>
          {LEVEL_KEYS.map(l => (
            <div
              key={l}
              title={LEVEL_FULL_LABELS[l]}
              style={{
                height: HEAD_H, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4,
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{l}</span>
              <span style={{
                fontSize: 9, color: 'var(--text-muted)', textAlign: 'center',
                lineHeight: 1.1, maxWidth: CELL_H,
              }}>
                {LEVEL_FULL_LABELS[l].split(' ')[0]}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Avg</span>
          </div>

          {/* Data rows */}
          {data.map((row, rowIdx) => {
            const rowAvg = LEVEL_KEYS.reduce((s, l) => s + (row.scores[l] ?? 0), 0) / LEVEL_KEYS.length;
            const avgColor = SCORE_COLORS[Math.round(rowAvg)];
            const rowDelay = rowIdx * 45;
            return [
              // Tier dot
              <div
                key={`dot-${row.engineerId}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: CELL_H,
                  animation: 'staggerFadeIn 0.45s ease both',
                  animationDelay: `${rowDelay}ms`,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: TIER_DOTS[row.tier],
                  display: 'inline-block',
                }} title={row.tier} />
              </div>,

              // Name
              <div
                key={`name-${row.engineerId}`}
                title={row.name}
                style={{
                  height: CELL_H, display: 'flex', alignItems: 'center',
                  paddingRight: 8, overflow: 'hidden',
                  animation: 'staggerFadeIn 0.45s ease both',
                  animationDelay: `${rowDelay}ms`,
                }}
              >
                <span style={{
                  fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {shortName(row.name)}
                </span>
              </div>,

              // Level cells
              ...LEVEL_KEYS.map(l => {
                const score = row.scores[l] ?? 0;
                const c = SCORE_COLORS[score];
                return (
                  <div
                    key={`${row.engineerId}-${l}`}
                    title={`${shortName(row.name)} · ${l} (${LEVEL_FULL_LABELS[l]}): ${score}/5`}
                    style={{
                      height: CELL_H, borderRadius: 4,
                      background: c.bg, color: c.fg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      cursor: 'default',
                      transition: 'transform 0.1s',
                      animation: 'staggerFadeIn 0.45s ease both',
                      animationDelay: `${rowDelay}ms`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                  >
                    {score === 0 ? '–' : score}
                  </div>
                );
              }),

              // Row average
              <div
                key={`avg-${row.engineerId}`}
                title={`Overall avg: ${rowAvg.toFixed(1)}/5`}
                style={{
                  height: CELL_H, borderRadius: 4,
                  background: avgColor.bg, color: avgColor.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  opacity: 0.85,
                }}
              >
                {rowAvg.toFixed(1)}
              </div>,
            ];
          })}

          {/* Squad average row */}
          <div />
          <div style={{
            height: CELL_H, display: 'flex', alignItems: 'center', paddingRight: 8,
            borderTop: `2px solid var(--border)`, marginTop: 2,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Squad avg</span>
          </div>
          {LEVEL_KEYS.map(l => {
            const avg = avgScores[l];
            const c = SCORE_COLORS[Math.round(avg)];
            return (
              <div
                key={`avg-${l}`}
                title={`Squad average ${l}: ${avg.toFixed(1)}/5`}
                style={{
                  height: CELL_H, borderRadius: 4,
                  background: c.bg, color: c.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  borderTop: `2px solid var(--border)`, marginTop: 2,
                }}
              >
                {avg.toFixed(1)}
              </div>
            );
          })}
          <div style={{ borderTop: `2px solid var(--border)`, marginTop: 2 }} />
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
        Sorted by overall avg score · hover any cell for details · dot = tier
      </p>
    </div>
  );
}
