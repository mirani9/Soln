/**
 * SENTINEL — AlertPanel Component
 * Real-time alert list with color-coded severity and animations.
 */

import { useState } from 'react';
import VulnerabilityBadge from './VulnerabilityBadge';
import ResponseTimer from './ResponseTimer';
import axios from 'axios';
import { database, firebaseEnabled, ref, update } from '../firebase/config';

const API_BASE = 'http://localhost:8000';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'severity-critical',
    dot: 'bg-red-500',
    text: 'text-red-400',
    label: 'CRITICAL',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  },
  high: {
    bg: 'severity-high',
    dot: 'bg-orange-500',
    text: 'text-orange-400',
    label: 'HIGH',
    glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]',
  },
  medium: {
    bg: 'severity-medium',
    dot: 'bg-yellow-500',
    text: 'text-yellow-400',
    label: 'MEDIUM',
    glow: '',
  },
  low: {
    bg: 'severity-low',
    dot: 'bg-green-500',
    text: 'text-green-400',
    label: 'LOW',
    glow: '',
  },
};

const TYPE_ICONS = {
  fire: '🔥',
  medical: '🏥',
  threat: '⚠️',
  evacuation: '🚨',
  unknown: '❓',
};

export default function AlertPanel({ alerts = [], onSelectAlert }) {
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  const handleStatusUpdate = async (alertId, newStatus) => {
    setUpdatingId(alertId);
    try {
      await axios.put(`${API_BASE}/update-alert`, {
        alert_id: alertId,
        status: newStatus,
      }, { timeout: 3000 });
    } catch (err) {
      // Fallback: update directly in Firebase
      if (firebaseEnabled && database) {
        try {
          const alertRef = ref(database, `alerts/${alertId}`);
          await update(alertRef, { status: newStatus });
        } catch (fbErr) {
          console.error('Failed to update alert:', fbErr);
        }
      }
    }
    setUpdatingId(null);
  };

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
            Live Alerts
          </h2>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[var(--color-text-secondary)]">
            {alerts.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {['all', 'critical', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-semibold tracking-wider transition-all cursor-pointer ${
              filter === f
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-muted)]">
            <p className="text-3xl mb-2">🛡️</p>
            <p className="text-sm">No alerts detected</p>
            <p className="text-xs mt-1">System monitoring active</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
            const icon = TYPE_ICONS[alert.type] || TYPE_ICONS.unknown;

            return (
              <div
                key={alert.id}
                id={`alert-${alert.id}`}
                onClick={() => onSelectAlert?.(alert)}
                className={`${config.bg} ${config.glow} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.01] animate-slide-in-right ${
                  alert.severity === 'critical' ? 'animate-severity-pulse' : ''
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-white/60 capitalize">{alert.type}</span>
                        {alert.source === 'camera' && (
                          <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">
                            📹 Camera
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/80 mt-1 line-clamp-2">
                        {alert.english_translation || alert.message || 'Alert detected'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-white/50">📍 {alert.location}</span>
                        <span className="text-[10px] text-white/50">
                          Score: {alert.distress_score}
                        </span>
                        <span className="text-[10px] text-white/50">
                          Conf: {Math.round((alert.confidence || 0) * 100)}%
                        </span>
                      </div>

                      {/* Vulnerability badges */}
                      {alert.vulnerability_flags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {alert.vulnerability_flags.map(flag => (
                            <VulnerabilityBadge key={flag} type={flag} />
                          ))}
                        </div>
                      )}

                      {/* Response timer */}
                      <ResponseTimer timestamp={alert.timestamp} />
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {alert.status === 'new' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(alert.id, 'acknowledged'); }}
                        disabled={updatingId === alert.id}
                        className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30 transition cursor-pointer"
                      >
                        ACK
                      </button>
                    )}
                    {(alert.status === 'new' || alert.status === 'acknowledged') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(alert.id, 'responding'); }}
                        disabled={updatingId === alert.id}
                        className="text-[9px] bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded hover:bg-yellow-500/30 transition cursor-pointer"
                      >
                        RESPOND
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(alert.id, 'resolved'); }}
                        disabled={updatingId === alert.id}
                        className="text-[9px] bg-green-500/20 text-green-300 px-2 py-1 rounded hover:bg-green-500/30 transition cursor-pointer"
                      >
                        RESOLVE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
