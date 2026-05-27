import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import type { TableRow } from '../../data/selectors';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  rows: TableRow[];
  month?: string | null;
}

type SortKey = 'name' | 'tier' | 'proficiency';

const TIER_COLORS: Record<string, string> = {
  explorer: 'var(--tier-explorer)',
  adopter:  'var(--tier-adopter)',
  champion: 'var(--tier-champion)',
};

function SortTh({ col, label, sortKey, sortAsc, onSort }: {
  col: SortKey; label: string;
  sortKey: SortKey; sortAsc: boolean;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSort(col)}
      title={`Sort by ${label}`}
      style={{
        padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        background: active ? '#f1f5f9' : 'var(--surface-muted)',
        borderBottom: '2px solid var(--border)',
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          : <ChevronUp size={12} style={{ opacity: 0.2 }} />}
      </span>
    </th>
  );
}

export function GapsTable({ rows, month }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('proficiency');
  const [sortAsc, setSortAsc] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (rows.length === 0) return <EmptyState />;

  const TIER_RANK: Record<string, number> = { explorer: 0, adopter: 1, champion: 2 };

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  }

  const sorted = [...rows].sort((a, b) => {
    const cmp =
      sortKey === 'proficiency' ? a.proficiency - b.proficiency :
      sortKey === 'tier'        ? (TIER_RANK[a.tier] ?? 0) - (TIER_RANK[b.tier] ?? 0) :
                                  (a.name || a.email).localeCompare(b.name || b.email);
    return sortAsc ? cmp : -cmp;
  });

  function exportCSV() {
    const headers = ['Name', 'Email', 'Tier', 'Avg Score', 'Biggest Gap', 'Planned Actions', 'Submitted At'];
    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const lines = [
      headers.join(','),
      ...sorted.map(r => [
        r.name, r.email, r.tier,
        (r.proficiency * 5).toFixed(1),
        r.biggestGap, r.plannedActions, r.submittedAt,
      ].map(escape).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merchant-engineering-gaps-actions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const tdBase: React.CSSProperties = {
    padding: '12px 14px', fontSize: 13, color: 'var(--text)',
    borderBottom: '1px solid var(--border)', verticalAlign: 'top',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', fontSize: 12, fontWeight: 500,
            border: '1px solid var(--border)', borderRadius: 6,
            background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 150 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: '50%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <thead>
            <tr>
              <SortTh col="name"        label="Engineer"  sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
              <SortTh col="tier"        label="Tier"      sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
              <SortTh col="proficiency" label="Score"     sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
              <th style={{
                padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                color: 'var(--text-muted)', background: 'var(--surface-muted)',
                borderBottom: '2px solid var(--border)',
              }}>
                Biggest Gap
              </th>
              <th style={{
                padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                color: 'var(--text-muted)', background: 'var(--surface-muted)',
                borderBottom: '2px solid var(--border)',
              }}>
                Planned Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => {
              const profileHref = `/individuals/${row.engineerId}${month ? `?month=${month}` : ''}`;
              const isHovered = hoveredRow === row.engineerId;
              return (
                <tr
                  key={row.engineerId}
                  style={{ background: isHovered ? '#f8fafc' : 'var(--surface)', transition: 'background 0.1s' }}
                  onMouseEnter={() => setHoveredRow(row.engineerId)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Name */}
                  <td style={tdBase}>
                    <Link
                      to={profileHref}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {row.name || row.email}
                      </span>
                      <ExternalLink size={11} style={{ opacity: isHovered ? 0.5 : 0, transition: 'opacity 0.1s', flexShrink: 0 }} />
                    </Link>
                  </td>

                  {/* Tier */}
                  <td style={tdBase}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                      background: TIER_COLORS[row.tier] + '22',
                      color: TIER_COLORS[row.tier],
                    }}>
                      {row.tier}
                    </span>
                  </td>

                  {/* Avg score */}
                  <td style={{ ...tdBase, fontWeight: 700, color: 'var(--text)' }}>
                    {(row.proficiency * 5).toFixed(1)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/5</span>
                  </td>

                  {/* Biggest gap — full text */}
                  <td style={{ ...tdBase, color: row.biggestGap ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.5 }}>
                    {row.biggestGap || '—'}
                  </td>

                  {/* Planned actions — full text */}
                  <td style={{ ...tdBase, color: row.plannedActions ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {row.plannedActions || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
