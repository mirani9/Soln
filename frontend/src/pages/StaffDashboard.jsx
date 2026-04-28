/**
 * SENTINEL — StaffDashboard Page (MAIN)
 * Layout: Sidebar | Alerts | Map | Decision Panel
 * Real-time alerts, color severity, voice trigger
 */
import { useState, useEffect } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { useVoiceAlert } from '../hooks/useVoiceAlert';
import Sidebar from '../components/Sidebar';
import AlertPanel from '../components/AlertPanel';
import MapPanel from '../components/MapPanel';
import DecisionPanel from '../components/DecisionPanel';
import VoiceAlert from '../components/VoiceAlert';
import ScenarioSwitcher from '../components/ScenarioSwitcher';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export default function StaffDashboard() {
  const { alerts, activeAlerts, loading, lastAlert, criticalCount, highCount } = useAlerts();
  const { voiceEnabled, speaking, supported, speakAlert, stopSpeaking, toggleVoice } = useVoiceAlert();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(false);

  // Check backend health
  useEffect(() => {
    const check = async () => {
      try {
        const resp = await axios.get(`${API_BASE}/health`);
        setOllamaStatus(resp.data.ollama_available);
      } catch { setOllamaStatus(false); }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-speak new critical/high alerts
  useEffect(() => {
    if (lastAlert && (lastAlert.severity === 'critical' || lastAlert.severity === 'high')) {
      speakAlert(lastAlert);
    }
  }, [lastAlert, speakAlert]);

  // Auto-select first alert if none selected
  useEffect(() => {
    if (!selectedAlert && activeAlerts.length > 0) {
      setSelectedAlert(activeAlerts[0]);
    }
  }, [activeAlerts, selectedAlert]);

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar
        criticalCount={criticalCount}
        highCount={highCount}
        alerts={alerts}
        ollamaStatus={ollamaStatus}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              Command Center
            </h1>
            {criticalCount > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-bold animate-severity-pulse">
                🚨 {criticalCount} CRITICAL
              </span>
            )}
            {loading && (
              <span className="text-xs text-[var(--color-text-muted)] animate-pulse">Syncing...</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <VoiceAlert
              voiceEnabled={voiceEnabled}
              speaking={speaking}
              supported={supported}
              onToggle={toggleVoice}
              onStop={stopSpeaking}
            />
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${ollamaStatus ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-[10px] text-[var(--color-text-muted)]">
                AI: {ollamaStatus ? 'Ollama' : 'Fallback'}
              </span>
            </div>
          </div>
        </header>

        {/* Scenario bar */}
        <div className="px-4 pt-3 flex-shrink-0">
          <ScenarioSwitcher />
        </div>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-12 gap-3 p-4 overflow-hidden">
          {/* Alerts - left */}
          <div className="col-span-4 overflow-hidden">
            <AlertPanel
              alerts={activeAlerts}
              onSelectAlert={setSelectedAlert}
            />
          </div>

          {/* Map - center */}
          <div className="col-span-4 overflow-hidden">
            <MapPanel
              alerts={alerts}
              selectedAlert={selectedAlert}
              onSelectAlert={setSelectedAlert}
            />
          </div>

          {/* Decision Panel - right */}
          <div className="col-span-4 overflow-hidden">
            <DecisionPanel alert={selectedAlert} />
          </div>
        </div>
      </main>
    </div>
  );
}
