/**
 * SENTINEL — Camera Page (full-page camera panel with sidebar)
 */
import Sidebar from '../components/Sidebar';
import CameraPanel from '../components/CameraPanel';
import { useAlerts } from '../hooks/useAlerts';

export default function CameraPage() {
  const { alerts, criticalCount, highCount } = useAlerts();

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar criticalCount={criticalCount} highCount={highCount} alerts={alerts} />
      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📹</span> Pose-Based Panic Detection
          </h1>
          <CameraPanel />
        </div>
      </main>
    </div>
  );
}
