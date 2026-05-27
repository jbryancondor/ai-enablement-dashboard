import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import type { History, TierId, LevelScores } from '../data/types';
import {
  selectEngineerProfile,
  selectEngineerSubmissionHistory,
  latestSubmissionsForMonth,
} from '../data/selectors';
import { Card } from '../components/layout/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { TierBadge } from '../components/charts/TierBadge';
import { CapabilityProfileBars } from '../components/charts/CapabilityProfileBars';
import { SubmissionSparkline } from '../components/charts/SubmissionSparkline';
import { NextTierProgress } from '../components/charts/NextTierProgress';

interface Props {
  history: History;
}

export function IndividualDashboard({ history }: Props) {
  const { engineerId } = useParams<{ engineerId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const month = params.get('month');

  // Engineer list (for the selector dropdown and the /individuals index)
  const latestSubs = latestSubmissionsForMonth(history, month);
  const engList = history.engineers
    .filter(e => latestSubs.some(s => s.engineerId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const profile = engineerId
    ? selectEngineerProfile(history, engineerId, month)
    : null;

  const sparkData = engineerId
    ? selectEngineerSubmissionHistory(history, engineerId)
    : [];

  function handleEngineerSelect(id: string) {
    navigate(`/individuals/${id}${month ? `?month=${month}` : ''}`);
  }

  return (
    <div className="anim-fade-in" style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Engineer selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Engineer</label>
        <select
          value={engineerId ?? ''}
          onChange={e => handleEngineerSelect(e.target.value)}
          style={{
            fontSize: 14, fontWeight: 500, border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', background: 'var(--surface)',
            color: 'var(--text)', cursor: 'pointer', minWidth: 220,
          }}
        >
          <option value="" disabled>Select engineer…</option>
          {engList.map(e => (
            <option key={e.id} value={e.id}>{e.name || e.email}</option>
          ))}
        </select>
      </div>

      {!engineerId && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {engList.map((eng, i) => {
            const sub = latestSubs.find(s => s.engineerId === eng.id);
            const tier = sub?.tier ?? 'explorer';
            const score = sub ? (sub.proficiency * 5).toFixed(1) : '—';
            return (
              <Link
                key={eng.id}
                to={`/individuals/${eng.id}${month ? `?month=${month}` : ''}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  padding: '16px', borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow)',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  animation: 'staggerFadeIn 0.45s ease both',
                  animationDelay: `${i * 55}ms`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--tier-adopter)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow)';
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {eng.name || eng.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                    fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                    background: `var(--tier-${tier})22`,
                    color: `var(--tier-${tier})`,
                  }}>
                    {tier}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{score} / 5</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {engineerId && !profile && (
        <EmptyState message="No data for this engineer in the selected period." />
      )}

      {profile && (
        <>
          {/* I1: Tier + Proficiency */}
          <Card title="I1 — Tier & Proficiency">
            <TierBadge tier={profile.tier as TierId} proficiency={profile.proficiency} />
          </Card>

          {/* I2: Capability Profile */}
          <Card title="I2 — Capability Profile (L1–L7 Self-Assessment)">
            <CapabilityProfileBars levels={profile.levels as unknown as LevelScores} />
          </Card>

          {/* I3: Submission History sparkline */}
          <Card title="I3 — Submission History">
            <SubmissionSparkline data={sparkData} />
          </Card>

          {/* I7: Next Tier Progress */}
          <Card title="I7 — Growth Path to Next Tier">
            <NextTierProgress profile={profile} />
          </Card>
        </>
      )}
    </div>
  );
}
