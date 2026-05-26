import type { BulletData } from '../../data/selectors';

interface Props {
  data: BulletData;
  label?: string;
}

export function InfraCoverageBullet({ data, label = 'Agentic Infra Coverage' }: Props) {
  const { value, target, poorMax, okMax } = data;
  const fmt = (v: number) => `${Math.round(v * 100)}%`;

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    background: `linear-gradient(to right,
      #fca5a5 0%,
      #fde68a ${poorMax * 100}%,
      #86efac ${okMax * 100}%,
      #4ade80 100%
    )`,
  };

  const valueBarStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: `${Math.min(value, 1) * 100}%`,
    height: '40%',
    top: '30%',
    background: '#1e3a8a',
    borderRadius: 3,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  };

  const targetTickStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${Math.min(target, 1) * 100}%`,
    top: '10%',
    height: '80%',
    width: 3,
    background: '#0f172a',
    borderRadius: 1,
    transform: 'translateX(-50%)',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(value)}</span>
      </div>
      <div style={trackStyle}>
        <div style={valueBarStyle} />
        <div style={targetTickStyle} title={`Target: ${fmt(target)}`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>0%</span>
        <span style={{ color: '#dc2626' }}>Poor ≤{fmt(poorMax)}</span>
        <span style={{ color: '#ca8a04' }}>OK ≤{fmt(okMax)}</span>
        <span style={{ color: '#16a34a' }}>Good</span>
        <span>Target: {fmt(target)}</span>
      </div>
    </div>
  );
}
