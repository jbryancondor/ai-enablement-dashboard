
import { HashRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import type { History, InfraSnapshot } from './data/types';
import { Header } from './components/layout/Header';
import { SquadDashboard } from './routes/SquadDashboard';
import { IndividualDashboard } from './routes/IndividualDashboard';
import './components/tokens.css';
import './App.css';

import historyJson from './data/generated/history.json';

const history = historyJson as History;

// Load all dated infra snapshots at build time
const infraModules = import.meta.glob<{ default: InfraSnapshot }>(
  './data/generated/infra/*.json',
  { eager: true },
);

// Build a sorted list of { date: YYYY-MM-DD, snapshot } from the file names
const infraSnapshots: { date: string; snapshot: InfraSnapshot }[] = Object.entries(infraModules)
  .map(([path, mod]) => {
    const date = path.match(/(\d{4}-\d{2}-\d{2})\.json$/)?.[1] ?? '';
    return { date, snapshot: mod.default };
  })
  .filter(e => e.date && e.snapshot?.repos?.length)
  .sort((a, b) => a.date.localeCompare(b.date));

/** Return the latest snapshot whose capturedAt is ≤ the last day of `month` (YYYY-MM). */
function infraForMonth(month: string | null): InfraSnapshot | null {
  if (!infraSnapshots.length) return null;
  if (!month) return infraSnapshots[infraSnapshots.length - 1].snapshot;
  const cutoff = `${month}-31`; // YYYY-MM-31 is always ≥ any day in the month
  const match = [...infraSnapshots].reverse().find(e => e.date <= cutoff);
  return match?.snapshot ?? infraSnapshots[0].snapshot;
}

function AppShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const month = searchParams.get('month');
  const infra = infraForMonth(month);

  function handleMonthChange(m: string | null) {
    const next = new URLSearchParams(searchParams);
    if (m) next.set('month', m);
    else next.delete('month');
    setSearchParams(next);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-muted)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header history={history} month={month} onMonthChange={handleMonthChange} />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/squads/merchant-engineering" replace />} />
          <Route
            path="/squads/:squadId"
            element={<SquadDashboard history={history} infra={infra} />}
          />
          <Route
            path="/individuals"
            element={<IndividualDashboard history={history} />}
          />
          <Route
            path="/individuals/:engineerId"
            element={<IndividualDashboard history={history} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
