import { BarChart2 } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'No data for this period.' }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: '48px 24px',
      color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <BarChart2 size={36} strokeWidth={1.5} />
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  );
}
