import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Info, X } from 'lucide-react';

interface Props {
  title: string;
  children: ReactNode;
}

export function InfoModal({ title, children }: Props) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onOutside(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [open]);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`How ${title} is scored`}
        title={`How ${title} is scored`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: '50%',
          border: '1px solid var(--border)',
          background: 'var(--surface-muted)',
          color: 'var(--text-muted)',
          cursor: 'pointer', padding: 0,
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
          (e.currentTarget as HTMLButtonElement).style.color = '#1d4ed8';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
        }}
      >
        <Info size={12} />
      </button>

      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{
            position: 'absolute',
            top: 28,
            left: 0,
            zIndex: 100,
            width: 320,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {children}
          </div>
        </div>
      )}
    </span>
  );
}
