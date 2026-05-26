import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import type { TableRow } from '../../data/selectors';
import { rowsToCSV } from '../../data/selectors';
import { EmptyState } from '../layout/EmptyState';

interface Props {
  rows: TableRow[];
  month?: string | null;
}

type SortKey = keyof TableRow;

const COLUMNS: Array<{ key: SortKey; label: string; width?: number }> = [
  { key: 'name',        label: 'Name',        width: 160 },
  { key: 'tier',        label: 'Tier',         width: 90  },
  { key: 'proficiency', label: 'Score',        width: 70  },
  { key: 'L1',          label: 'L1',           width: 40  },
  { key: 'L2',          label: 'L2',           width: 40  },
  { key: 'L3',          label: 'L3',           width: 40  },
  { key: 'L4',          label: 'L4',           width: 40  },
  { key: 'L5',          label: 'L5',           width: 40  },
  { key: 'L6',          label: 'L6',           width: 40  },
  { key: 'L7',          label: 'L7',           width: 40  },
  { key: 'biggestGap',  label: 'Gap',          width: 220 },
];

const TIER_COLORS: Record<string, string> = {
  explorer: 'var(--tier-explorer)',
  adopter:  'var(--tier-adopter)',
  champion: 'var(--tier-champion)',
};

export function FlatDataTable({ rows, month }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (rows.length === 0) return <EmptyState />;

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  function exportCSV() {
    const csv = rowsToCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchant-engineering-ai-capability.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const thBase: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', fontSize: 12,
    fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer',
    whiteSpace: 'nowrap', userSelect: 'none',
    borderBottom: '2px solid var(--border)',
    background: 'var(--surface-muted)',
    transition: 'background 0.12s, color 0.12s',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: 13, color: 'var(--text)',
    borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              {COLUMNS.map(col => {
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{
                      ...thBase, width: col.width,
                      color: isActive ? 'var(--text)' : 'var(--text-muted)',
                      background: isActive ? '#f1f5f9' : 'var(--surface-muted)',
                    }}
                    onClick={() => handleSort(col.key)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleSort(col.key)}
                    title={`Sort by ${col.label}`}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {isActive
                        ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <ChevronUp size={12} style={{ opacity: 0.2 }} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => {
              const profileHref = `/individuals/${row.engineerId}${month ? `?month=${month}` : ''}`;
              const isHovered = hoveredRow === row.engineerId;
              return (
                <tr
                  key={row.engineerId}
                  style={{
                    background: isHovered ? '#f8fafc' : 'var(--surface)',
                    cursor: 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setHoveredRow(row.engineerId)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Name cell with drill-down link */}
                  <td style={tdStyle}>
                    <Link
                      to={profileHref}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: 'var(--text)', textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      title="View individual profile"
                    >
                      {row.name || row.email}
                      <ExternalLink
                        size={11}
                        style={{ opacity: isHovered ? 0.6 : 0, transition: 'opacity 0.1s', flexShrink: 0 }}
                      />
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: TIER_COLORS[row.tier] + '22',
                      color: TIER_COLORS[row.tier],
                      textTransform: 'capitalize',
                    }}>
                      {row.tier}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{(row.proficiency * 5).toFixed(1)}</td>
                  {(['L1','L2','L3','L4','L5','L6','L7'] as const).map(l => (
                    <td key={l} style={{ ...tdStyle, textAlign: 'center' }}>{row[l]}</td>
                  ))}
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', maxWidth: 220, whiteSpace: 'normal' }}>
                    {row.biggestGap
                      ? row.biggestGap.slice(0, 100) + (row.biggestGap.length > 100 ? '…' : '')
                      : '—'}
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
