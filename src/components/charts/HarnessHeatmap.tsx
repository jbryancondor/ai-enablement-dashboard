import type { HarnessRow } from '../../data/selectors';
import type { HarnessTierId } from '../../data/types';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  data: HarnessRow[];
}

// Same purple sequential scale as CapabilityHeatmap, mapped to 0–3
// Blue sequential scale — same language as CapabilityHeatmap, mapped to 0–3
const SCORE_COLORS: Record<number, { bg: string; fg: string }> = {
  0: { bg: '#f1f5f9', fg: '#94a3b8' },
  1: { bg: '#dbeafe', fg: '#1e40af' },
  2: { bg: '#3b82f6', fg: '#ffffff' },
  3: { bg: '#1e3a8a', fg: '#ffffff' },
};

const SCORE_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Starting (1–5)',
  2: 'Growing (6–10)',
  3: 'Mature (>10)',
};

const TIER_DOTS: Record<HarnessTierId, string> = {
  seed:    'var(--harness-seed)',
  rooted:  'var(--harness-rooted)',
  growing: 'var(--harness-growing)',
  mature:  'var(--harness-mature)',
};

const TIER_LABELS: HarnessTierId[] = ['seed', 'rooted', 'growing', 'mature'];

const DIMS = [
  { key: 'agentsScore' as const, rawKey: 'agentsRaw' as const, label: 'AGENTS.md', short: 'Agents' },
  { key: 'skillsScore' as const, rawKey: 'skillsRaw' as const, label: 'Skills',    short: 'Skills' },
];

/** Return a readable relative path stripped of the common platform root. */
function repoDisplayName(path: string): string {
  // Strip everything up to and including the last occurrence of a known root segment
  const marker = '/platform/';
  const idx = path.lastIndexOf(marker);
  return idx !== -1 ? path.slice(idx + marker.length) : path;
}

export function HarnessHeatmap({ data }: Props) {
  if (data.length === 0) return <EmptyState message="No repos scanned yet." />;

  const CELL_H = 36;
  const TIER_W = 10;
  const NAME_W = 220;
  const GAP = 2;
  const HEAD_H = 40;

  const avgAgents = data.reduce((s, r) => s + r.agentsScore, 0) / data.length;
  const avgSkills = data.reduce((s, r) => s + r.skillsScore, 0) / data.length;
  const overallAvg = (avgAgents + avgSkills) / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend: score scale + tier dots */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Score:</span>
        {[0, 1, 2, 3].map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: 4,
              background: SCORE_COLORS[s].bg, color: SCORE_COLORS[s].fg,
              fontSize: 11, fontWeight: 700,
            }}>{s}</span>
            {s === 0 ? 'none' : s === 1 ? '1–5' : s === 2 ? '6–10' : '>10'}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {TIER_LABELS.map(t => (
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
          gridTemplateColumns: `${TIER_W}px ${NAME_W}px repeat(${DIMS.length + 1}, 1fr)`,
          gap: GAP,
          width: '100%',
        }}>
          {/* Header */}
          <div /> {/* tier dot col */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Repo</span>
          </div>
          {DIMS.map(d => (
            <div key={d.key} style={{
              height: HEAD_H, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{d.short}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>{d.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Avg</span>
          </div>

          {/* Data rows */}
          {data.map((row, rowIdx) => {
            const avgColor = SCORE_COLORS[Math.round(row.avg)];
            const displayName = repoDisplayName(row.path);
            const rowDelay = rowIdx * 50;
            return [
              <div key={`dot-${row.path}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: CELL_H, animation: 'staggerFadeIn 0.45s ease both', animationDelay: `${rowDelay}ms` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: TIER_DOTS[row.tier], display: 'inline-block' }} title={row.tier} />
              </div>,

              <div key={`name-${row.path}`} title={`${row.path} · tier: ${row.tier}`} style={{ height: CELL_H, display: 'flex', alignItems: 'center', paddingRight: 8, overflow: 'hidden', animation: 'staggerFadeIn 0.45s ease both', animationDelay: `${rowDelay}ms` }}>
                <span style={{ fontSize: 11, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </span>
              </div>,

              ...DIMS.map(d => {
                const score = row[d.key];
                const raw = row[d.rawKey];
                const c = SCORE_COLORS[score];
                return (
                  <div
                    key={`${row.path}-${d.key}`}
                    title={`${displayName} · ${d.label}: ${raw} (score ${score} — ${SCORE_LABELS[score]})`}
                    style={{
                      height: CELL_H, borderRadius: 4,
                      background: c.bg, color: c.fg,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 2, cursor: 'default', transition: 'transform 0.1s',
                      animation: 'staggerFadeIn 0.45s ease both',
                      animationDelay: `${rowDelay}ms`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{score === 0 ? '–' : score}</span>
                    <span style={{ fontSize: 9, opacity: 0.8, lineHeight: 1 }}>{raw > 0 ? `×${raw}` : ''}</span>
                  </div>
                );
              }),

              <div key={`avg-${row.path}`} title={`Overall avg: ${row.avg.toFixed(1)}/3`} style={{
                height: CELL_H, borderRadius: 4,
                background: avgColor.bg, color: avgColor.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, opacity: 0.85,
                animation: 'staggerFadeIn 0.45s ease both',
                animationDelay: `${rowDelay}ms`,
              }}>
                {row.avg.toFixed(1)}
              </div>,
            ];
          })}

          {/* Repo avg row */}
          <div />
          <div style={{ height: CELL_H, display: 'flex', alignItems: 'center', paddingRight: 8, borderTop: '2px solid var(--border)', marginTop: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Repo avg</span>
          </div>
          {DIMS.map((d, i) => {
            const avg = i === 0 ? avgAgents : avgSkills;
            const c = SCORE_COLORS[Math.round(avg)];
            return (
              <div key={`avg-dim-${d.key}`} style={{
                height: CELL_H, borderRadius: 4,
                background: c.bg, color: c.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                borderTop: '2px solid var(--border)', marginTop: 2,
              }}>
                {avg.toFixed(1)}
              </div>
            );
          })}
          <div style={{
            height: CELL_H, borderRadius: 4,
            background: SCORE_COLORS[Math.round(overallAvg)].bg,
            color: SCORE_COLORS[Math.round(overallAvg)].fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, opacity: 0.85,
            borderTop: '2px solid var(--border)', marginTop: 2,
          }}>
            {overallAvg.toFixed(1)}
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
        Sorted by avg score · hover for raw count · ×N = raw file count
      </p>
    </div>
  );
}
