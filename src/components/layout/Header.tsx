import { useNavigate, useLocation } from 'react-router-dom';
import type { History } from '../../data/types';

interface HeaderProps {
  history: History;
  month: string | null;
  onMonthChange: (month: string | null) => void;
}

function availableMonths(history: History): string[] {
  const months = new Set<string>();
  for (const sub of history.submissions) {
    months.add(sub.submittedAt.slice(0, 7));
  }
  return [...months].sort().reverse();
}

export function Header({ history, month, onMonthChange }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSquad = location.pathname.startsWith('/squads');
  const isIndividual = location.pathname.startsWith('/individuals');
  const months = availableMonths(history);

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', whiteSpace: 'nowrap' }}>
        AI Enablement
      </span>

      <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        <NavTab
          label="Squad"
          active={isSquad}
          onClick={() => navigate('/squads/merchant-engineering')}
        />
        <NavTab
          label="Individual"
          active={isIndividual}
          onClick={() => navigate('/individuals')}
        />
      </nav>

      <div style={{ flex: 1 }} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        Period
        <select
          value={month ?? ''}
          onChange={e => onMonthChange(e.target.value || null)}
          style={{
            fontSize: 13, border: '1px solid var(--border)', borderRadius: 6,
            padding: '4px 8px', background: 'var(--surface)', color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <option value="">Latest {months.length > 0 ? `(${months[0]})` : ''}</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        Merchant Engineering
      </span>
    </header>
  );
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        background: active ? '#eff6ff' : 'transparent',
        color: active ? '#1d4ed8' : 'var(--text-muted)',
        transition: 'background 0.15s',
      }}
    >
      {label}
    </button>
  );
}
