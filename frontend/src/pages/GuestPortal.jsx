/**
 * SENTINEL — GuestPortal Page
 * Public-facing emergency message input form.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SeverityMeter from '../components/SeverityMeter';
import ScenarioSwitcher from '../components/ScenarioSwitcher';
import { analyzeText } from '../utils/localAnalyzer';
import { database, firebaseEnabled, ref, set, push } from '../firebase/config';

const API_BASE = 'http://localhost:8000';

export default function GuestPortal() {
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Try backend first
      const resp = await axios.post(`${API_BASE}/analyze-text`, {
        message: message.trim(),
        location: location.trim() || 'Guest Portal',
      }, { timeout: 3000 });
      setResult(resp.data);
    } catch (err) {
      // Backend unavailable — use local analyzer
      try {
        const localResult = analyzeText(message.trim(), location.trim() || 'Guest Portal');
        localResult.reason = `Analyzed locally (browser-side AI): detected ${localResult.emergency_type} emergency`;
        
        // Store in Firebase if alert triggered
        if (localResult.alert_triggered && firebaseEnabled && database) {
          const alertRef = ref(database, `alerts/${localResult.alert_id}`);
          await set(alertRef, localResult);
          const timelineRef = ref(database, 'timeline');
          const eventRef = push(timelineRef);
          await set(eventRef, {
            alert_id: localResult.alert_id,
            event_type: 'detected',
            description: `Alert detected: ${message.trim().substring(0, 80)}...`,
            time: localResult.timestamp,
          });
        }
        
        setResult(localResult);
      } catch (localErr) {
        setError('Analysis failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Navigation Bar */}
      <nav className="w-full bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-red-500 flex items-center justify-center text-sm font-bold">S</div>
            <span className="text-sm font-bold gradient-text tracking-wider">SENTINEL</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/dashboard" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-white transition font-medium">🛡️ Dashboard</Link>
            <Link to="/camera" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-white transition font-medium">📹 Camera</Link>
            <Link to="/incidents" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-white transition font-medium">📋 Incidents</Link>
            <Link to="/guest" className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white font-medium">🆘 Report</Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-red-500 flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-500/30">S</div>
            <h1 className="text-2xl font-bold gradient-text mb-2">SENTINEL</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">AI Crisis Intelligence System</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Report an emergency in ANY language</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 mb-4 animate-slide-in-up">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span className="text-red-500">🆘</span> Emergency Report
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-1 block">Message *</label>
              <textarea
                id="guest-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the emergency... (any language)"
                rows={4}
                className="input-sentinel resize-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-1 block">Location (optional)</label>
              <input
                id="guest-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building, floor, room..."
                className="input-sentinel"
              />
            </div>
            <button
              id="guest-submit"
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full btn-danger py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50 rounded-lg"
            >
              {loading ? '⏳ Analyzing...' : '🚨 Send Emergency Report'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 mb-4 border-red-500/30 bg-red-500/10 animate-shake">
            <p className="text-sm text-red-400">❌ {error}</p>
            <p className="text-xs text-red-400/60 mt-1">Make sure the backend server is running on port 8000</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="glass-card p-5 mb-4 animate-slide-in-up">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              {result.alert_triggered ? <span className="text-red-400 animate-pulse">🚨 ALERT TRIGGERED</span> : <span className="text-green-400">✅ Analysis Complete</span>}
            </h3>

            <SeverityMeter score={result.distress_score} />

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/5 rounded-lg p-2 text-center border border-[var(--color-border-default)]">
                <div className="text-xl font-bold text-[var(--color-text-primary)]">{result.distress_score}</div>
                <div className="text-[9px] text-[var(--color-text-muted)] uppercase">Distress Score</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center border border-[var(--color-border-default)]">
                <div className={`text-sm font-bold uppercase severity-${result.severity} px-2 py-0.5 rounded-full inline-block`}>{result.severity}</div>
                <div className="text-[9px] text-[var(--color-text-muted)] uppercase mt-1">Severity</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {result.emergency_type && (
                <div className="flex justify-between bg-white/5 rounded-lg p-2">
                  <span className="text-[var(--color-text-muted)]">Emergency Type</span>
                  <span className="font-semibold capitalize">{result.emergency_type}</span>
                </div>
              )}
              <div className="flex justify-between bg-white/5 rounded-lg p-2">
                <span className="text-[var(--color-text-muted)]">Language</span>
                <span className="font-semibold capitalize">{result.language_detected}</span>
              </div>
              <div className="flex justify-between bg-white/5 rounded-lg p-2">
                <span className="text-[var(--color-text-muted)]">Confidence</span>
                <span className="font-semibold">{Math.round((result.confidence || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between bg-white/5 rounded-lg p-2">
                <span className="text-[var(--color-text-muted)]">False Alarm</span>
                <span className="font-semibold">{Math.round(result.false_alarm_score || 0)}%</span>
              </div>
              <div className="flex justify-between bg-white/5 rounded-lg p-2">
                <span className="text-[var(--color-text-muted)]">Staff Role</span>
                <span className="font-semibold capitalize">{result.recommended_staff_role}</span>
              </div>
              {result.vulnerability_flags?.length > 0 && (
                <div className="flex justify-between bg-white/5 rounded-lg p-2">
                  <span className="text-[var(--color-text-muted)]">Vulnerable</span>
                  <span className="font-semibold capitalize">{result.vulnerability_flags.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="mt-3 bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase">Reason</span>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{result.reason}</p>
            </div>

            {result.english_translation && result.language_detected !== 'english' && (
              <div className="mt-2 bg-indigo-500/10 rounded-lg p-2 border border-indigo-500/20">
                <span className="text-[10px] text-indigo-300 uppercase font-semibold">English Translation</span>
                <p className="text-xs text-indigo-200 mt-0.5">{result.english_translation}</p>
              </div>
            )}
          </div>
        )}

        {/* Scenario Switcher */}
        <ScenarioSwitcher />

        <p className="text-center text-[9px] text-[var(--color-text-muted)] mt-6">
          SENTINEL v1.0 — AI-Powered Crisis Response • All data processed locally
        </p>
      </div>
      </div>
    </div>
  );
}
