/**
 * SENTINEL — ScenarioSwitcher Component
 * Buttons to trigger Fire / Medical / Threat test scenarios.
 * Works with backend API (localhost) or local analyzer + Firebase (deployed).
 */
import { useState } from 'react';
import axios from 'axios';
import { generateScenario } from '../utils/localAnalyzer';
import { database, firebaseEnabled, ref, set, push } from '../firebase/config';

const API_BASE = 'http://localhost:8000';

const SCENARIOS = [
  { type: 'fire', icon: '🔥', label: 'Fire', color: 'from-red-600 to-orange-600', border: 'border-red-500/40' },
  { type: 'medical', icon: '🏥', label: 'Medical', color: 'from-blue-600 to-cyan-600', border: 'border-blue-500/40' },
  { type: 'threat', icon: '⚠️', label: 'Threat', color: 'from-yellow-600 to-red-600', border: 'border-yellow-500/40' },
];

export default function ScenarioSwitcher() {
  const [loading, setLoading] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const triggerScenario = async (type) => {
    setLoading(type);
    setLastResult(null);
    try {
      // Try backend first
      const resp = await axios.post(`${API_BASE}/scenario/${type}`, {}, { timeout: 3000 });
      setLastResult({ type, success: true, data: resp.data });
    } catch (err) {
      // Backend unavailable — use local analyzer + Firebase
      try {
        const result = generateScenario(type);
        
        if (firebaseEnabled && database) {
          // Store alert in Firebase
          const alertRef = ref(database, `alerts/${result.alert_id}`);
          await set(alertRef, result);

          // Store timeline event
          const timelineRef = ref(database, 'timeline');
          const eventRef = push(timelineRef);
          await set(eventRef, {
            alert_id: result.alert_id,
            event_type: 'detected',
            description: `${type.toUpperCase()} alert detected: ${result.message.substring(0, 80)}...`,
            time: result.timestamp,
          });

          // Store decision timeline event
          const decisionRef = push(timelineRef);
          await set(decisionRef, {
            alert_id: result.alert_id,
            event_type: 'decision',
            description: `AI generated ${result.actions.length} response actions for ${type} emergency`,
            time: new Date(Date.now() + 1000).toISOString(),
          });
        }

        setLastResult({ type, success: true, data: result });
      } catch (fbErr) {
        setLastResult({ type, success: false, error: 'Backend offline & Firebase unavailable' });
      }
    }
    setLoading(null);
  };

  return (
    <div className="glass-card p-3">
      <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">⚡ Scenario Simulation</h3>
      <div className="flex gap-2">
        {SCENARIOS.map(s => (
          <button
            key={s.type}
            onClick={() => triggerScenario(s.type)}
            disabled={loading !== null}
            className={`flex-1 py-2 px-3 rounded-lg bg-gradient-to-r ${s.color} border ${s.border} text-white text-xs font-bold transition-all hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50`}
          >
            {loading === s.type ? '⏳' : s.icon} {s.label}
          </button>
        ))}
      </div>
      {lastResult && (
        <div className={`mt-2 text-[10px] px-2 py-1 rounded ${lastResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {lastResult.success ? `✅ ${lastResult.type} scenario triggered — Score: ${lastResult.data?.distress_score}` : `❌ Failed: ${lastResult.error}`}
        </div>
      )}
    </div>
  );
}
