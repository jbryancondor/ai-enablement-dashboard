import type { Blocker } from '../../data/types';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  blockers: Blocker[];
}

const LANES: Array<{ status: Blocker['status']; label: string; headerBg: string; accent: string }> = [
  { status: 'open',        label: 'Open',        headerBg: '#fee2e2', accent: '#ef4444' },
  { status: 'in-progress', label: 'In Progress',  headerBg: '#fef9c3', accent: '#ca8a04' },
  { status: 'resolved',    label: 'Resolved',     headerBg: '#dcfce7', accent: '#16a34a' },
];

function ageDays(openedAt: string): number {
  const ms = Date.now() - new Date(openedAt).getTime();
  return Math.floor(ms / 86400000);
}

export function BlockerSwimlane({ blockers }: Props) {
  if (blockers.length === 0) return <EmptyState message="No gaps reported this period." />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {LANES.map(lane => {
        const cards = blockers.filter(b => b.status === lane.status);
        return (
          <div key={lane.status}>
            {/* Lane header — colored background here, not on cards */}
            <div style={{
              background: lane.headerBg,
              borderRadius: '6px 6px 0 0',
              padding: '6px 10px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: lane.accent, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12, fontWeight: 700, color: lane.accent,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {lane.label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: lane.accent }}>
                {cards.length}
              </span>
            </div>

            {/* Cards: neutral background, accent left-border */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 48 }}>
              {cards.length === 0 && (
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic',
                  padding: '8px 10px',
                }}>
                  No items
                </div>
              )}
              {cards.map(b => (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${lane.accent}`,
                    borderRadius: 6,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text)',
                    marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {b.ownerName}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                      · {ageDays(b.openedAt)}d ago
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                    {b.description.length > 160
                      ? b.description.slice(0, 160) + '…'
                      : b.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
