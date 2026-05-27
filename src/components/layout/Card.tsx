import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}

export function Card({ title, children, action, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
