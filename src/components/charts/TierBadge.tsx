import { Star, TrendingUp, Compass } from 'lucide-react';
import type { TierId } from '../../data/types';

interface Props {
  tier: TierId;
  proficiency: number; // 0..1
}

const TIER_CONFIG = {
  explorer: { label: 'Explorer', icon: Compass,    color: 'var(--tier-explorer)' },
  adopter:  { label: 'Adopter',  icon: TrendingUp,  color: 'var(--tier-adopter)'  },
  champion: { label: 'Champion', icon: Star,         color: 'var(--tier-champion)' },
};

export function TierBadge({ tier, proficiency }: Props) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  const avgScore = (proficiency * 5).toFixed(1);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 20px',
        borderRadius: 12,
        border: `2px solid ${cfg.color}`,
        background: cfg.color + '18',
      }}>
        <Icon size={28} color={cfg.color} strokeWidth={2} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg score {avgScore} / 5</div>
        </div>
      </div>

      {/* Radial progress */}
      <RadialProgress value={proficiency} color={cfg.color} />
    </div>
  );
}

function RadialProgress({ value, color }: { value: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;

  return (
    <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
      <circle
        cx={36} cy={36} r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
      <text
        x={36} y={40}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--text)"
        style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}
      >
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}
