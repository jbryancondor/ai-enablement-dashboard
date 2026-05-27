import { CheckCircle, Circle } from 'lucide-react';
import type { EngineerProfile } from '../../data/selectors';
import { getTierDef, getNextTier } from '../../data/tiers';
import type { TierId } from '../../data/types';

interface Props {
  profile: EngineerProfile;
}

export function NextTierProgress({ profile }: Props) {
  const tier = profile.tier as TierId;
  const currentDef = getTierDef(tier);
  const nextDef = getNextTier(tier);
  const avgScore = profile.proficiency * 5;

  const baseMin = currentDef.minAvgScore;
  const targetMin = nextDef?.minAvgScore ?? currentDef.minAvgScore;
  const progressPct = nextDef
    ? Math.min(1, Math.max(0, (avgScore - baseMin) / (targetMin - baseMin)))
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>
            {currentDef.label} → {nextDef ? nextDef.label : '(Champion — max tier)'}
          </span>
          <span>{(avgScore).toFixed(1)} / {targetMin.toFixed(1)}</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct * 100}%`,
            background: nextDef ? `var(--tier-${nextDef.id})` : 'var(--tier-champion)',
            borderRadius: 5,
            transformOrigin: 'left',
            animation: 'scaleInX 0.8s ease both',
            animationDelay: '100ms',
          }} />
        </div>
      </div>

      {/* Next tier criteria */}
      {nextDef && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {nextDef.label} criteria
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nextDef.criteria.map((c, i) => {
              const met = avgScore >= nextDef.minAvgScore;
              return (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                  {met
                    ? <CheckCircle size={16} color="var(--tier-champion)" style={{ flexShrink: 0, marginTop: 1 }} />
                    : <Circle     size={16} color="var(--border)"         style={{ flexShrink: 0, marginTop: 1 }} />
                  }
                  <span style={{ color: met ? 'var(--text)' : 'var(--text-muted)' }}>{c}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Planned actions from self-assessment */}
      {profile.plannedActions && (
        <div style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your planned actions
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {profile.plannedActions}
          </p>
        </div>
      )}
    </div>
  );
}
