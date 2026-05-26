
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import type { History, InfraSnapshot } from './data/types';
import { Header } from './components/layout/Header';
import { SquadDashboard } from './routes/SquadDashboard';
import { IndividualDashboard } from './routes/IndividualDashboard';
import './components/tokens.css';
import './App.css';

// Generated at ingest time — always present after running: npm run ingest
import historyJson from './data/generated/history.json';
import latestInfraJson from './data/generated/latest-infra.json';

const history = historyJson as History;
const latestInfra = latestInfraJson.repos?.length ? (latestInfraJson as InfraSnapshot) : null;

function AppShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const month = searchParams.get('month');

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
            element={<SquadDashboard history={history} infra={latestInfra} />}
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
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
