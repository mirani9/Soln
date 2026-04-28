/**
 * SENTINEL — Incidents Page (full-page timeline with sidebar)
 */
import Sidebar from '../components/Sidebar';
import IncidentLog from '../components/IncidentLog';
import { useAlerts } from '../hooks/useAlerts';

export default function IncidentsPage() {
  const { alerts, criticalCount, highCount } = useAlerts();

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar criticalCount={criticalCount} highCount={highCount} alerts={alerts} />
      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📋</span> Incident Timeline
          </h1>
          <IncidentLog />
        </div>
      </main>
    </div>
  );
}
