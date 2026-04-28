/**
 * SENTINEL — DecisionPanel Component
 * Shows AI-generated actions, false alarm score, and confidence.
 */
import { useState } from 'react';
import axios from 'axios';
import SeverityMeter from './SeverityMeter';
import { generateDecisions as localDecisions } from '../utils/localAnalyzer';

const API_BASE = 'http://localhost:8000';

export default function DecisionPanel({ alert }) {
  const [actions, setActions] = useState(alert?.actions || []);
  const [loading, setLoading] = useState(false);

  const generateDecisions = async () => {
    if (!alert) return;
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/decision`, {
        alert_id: alert.id, emergency_type: alert.type,
        severity: alert.severity, distress_score: alert.distress_score || 0,
        location: alert.location, context: alert.message || alert.english_translation,
      }, { timeout: 3000 });
      setActions(resp.data.actions || []);
    } catch (err) {
      // Fallback to local decisions
      setActions(localDecisions(alert.type));
    }
    setLoading(false);
  };

  if (!alert) {
    return (
      <div className="glass-card p-4 h-full flex flex-col items-center justify-center">
        <span className="text-4xl mb-3 opacity-50">🤖</span>
        <p className="text-sm text-[var(--color-text-muted)] text-center">Select an alert to view AI decisions</p>
      </div>
    );
  }

  const displayActions = actions.length > 0 ? actions : alert.actions || [];
  const falseAlarm = alert.false_alarm_score ?? 0;
  const confidence = alert.confidence ?? 0;

  return (
    <div className="glass-card p-4 h-full flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-sm font-bold uppercase tracking-wider">AI Decisions</h2>
        </div>
        <button onClick={generateDecisions} disabled={loading} className="btn-sentinel text-xs px-3 py-1.5">
          {loading ? '⏳...' : '🔄 Regen'}
        </button>
      </div>

      <div className="bg-white/5 rounded-lg p-3 mb-3 border border-[var(--color-border-default)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm capitalize font-semibold">{alert.type} Alert</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase severity-${alert.severity}`}>{alert.severity}</span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{alert.english_translation || alert.message || 'No description'}</p>
        <div className="text-[10px] text-[var(--color-text-muted)] mt-1">📍 {alert.location} | 👤 {alert.recommended_staff_role || 'general'}</div>
      </div>

      <SeverityMeter score={alert.distress_score || 0} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/5 rounded-lg p-2 text-center border border-[var(--color-border-default)]">
          <div className={`text-lg font-bold ${confidence > 0.7 ? 'text-green-400' : confidence > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(confidence * 100)}%</div>
          <div className="text-[9px] text-[var(--color-text-muted)] uppercase">Confidence</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center border border-[var(--color-border-default)]">
          <div className={`text-lg font-bold ${falseAlarm < 30 ? 'text-green-400' : falseAlarm < 60 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(falseAlarm)}%</div>
          <div className="text-[9px] text-[var(--color-text-muted)] uppercase">False Alarm</div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2">Response Actions</h3>
        {displayActions.length > 0 ? (
          <div className="space-y-2">
            {displayActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg p-2.5 border border-[var(--color-border-default)] animate-slide-in-up hover:border-[var(--color-border-glow)] transition" style={{ animationDelay: `${i * 100}ms` }}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i === 0 ? 'bg-red-500/20 text-red-400' : i === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{i + 1}</span>
                <p className="text-xs text-[var(--color-text-primary)]">{action}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-[var(--color-text-muted)]">No actions yet</p>
            <button onClick={generateDecisions} className="btn-sentinel text-xs mt-2 px-4 py-1.5">Generate</button>
          </div>
        )}
      </div>

      {alert.language_detected && alert.language_detected !== 'english' && (
        <div className="mt-3 bg-indigo-500/10 rounded-lg p-2 border border-indigo-500/20">
          <div className="text-[10px] text-indigo-300 font-semibold uppercase">Translated from {alert.language_detected}</div>
          <p className="text-xs text-indigo-200 mt-0.5">{alert.english_translation}</p>
        </div>
      )}
    </div>
  );
}
