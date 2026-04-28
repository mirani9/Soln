/**
 * SENTINEL — IncidentLog Component
 * Timeline view of all events (detected → decision → resolved).
 */
import { useTimeline } from '../hooks/useAlerts';

const EVENT_CONFIG = {
  detected: { icon: '🔔', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  decision: { icon: '🤖', color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
  acknowledged: { icon: '👁️', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  responding: { icon: '🚀', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  resolved: { icon: '✅', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
};

function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return isoString; }
}

function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export default function IncidentLog() {
  const { timeline, loading } = useTimeline();

  if (loading) {
    return (
      <div className="glass-card p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-sm text-[var(--color-text-muted)]">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">📋</span>
        <h2 className="text-sm font-bold uppercase tracking-wider">Incident Timeline</h2>
        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[var(--color-text-secondary)]">{timeline.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {timeline.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No incidents logged yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[var(--color-border-default)]" />

            <div className="space-y-3">
              {timeline.map((event, idx) => {
                const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.detected;
                return (
                  <div key={event.id || idx} className="flex gap-3 animate-slide-in-right" style={{ animationDelay: `${idx * 30}ms` }}>
                    {/* Dot */}
                    <div className={`w-[30px] h-[30px] rounded-full ${config.bg} border ${config.border} flex items-center justify-center text-xs flex-shrink-0 z-10`}>
                      {config.icon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-[var(--color-border-default)] hover:border-[var(--color-border-glow)] transition">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>{event.event_type}</span>
                        <div className="text-right">
                          <span className="text-[10px] text-[var(--color-text-muted)]">{formatTime(event.time)}</span>
                          <span className="text-[9px] text-[var(--color-text-muted)] ml-1">{formatDate(event.time)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">{event.description}</p>
                      <div className="text-[9px] text-[var(--color-text-muted)] mt-1">ID: {event.alert_id}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
