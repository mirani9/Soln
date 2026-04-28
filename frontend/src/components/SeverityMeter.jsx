/**
 * SENTINEL — SeverityMeter Component
 * Dynamic gauge showing distress score level.
 */
export default function SeverityMeter({ score = 0 }) {
  const percentage = Math.min(100, Math.max(0, score));
  const color = percentage > 80 ? '#ef4444' : percentage > 60 ? '#f97316' : percentage > 40 ? '#eab308' : '#22c55e';
  const label = percentage > 80 ? 'CRITICAL' : percentage > 60 ? 'HIGH' : percentage > 40 ? 'MEDIUM' : 'LOW';

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Severity Escalation</span>
        <span className="text-xs font-bold" style={{ color }}>{label} — {percentage}</span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444)`,
            backgroundSize: '400% 100%',
            backgroundPosition: `${percentage}% 0%`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}
