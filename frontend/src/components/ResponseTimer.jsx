/**
 * SENTINEL — ResponseTimer Component
 * Shows elapsed time since alert detection.
 */
import { useState, useEffect } from 'react';

export default function ResponseTimer({ timestamp }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!timestamp) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      if (diff < 0) { setElapsed('just now'); return; }
      if (diff < 60) { setElapsed(`${diff}s ago`); return; }
      if (diff < 3600) { setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s ago`); return; }
      setElapsed(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ago`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[9px] text-[var(--color-text-muted)]">⏱️ {elapsed}</span>
    </div>
  );
}
