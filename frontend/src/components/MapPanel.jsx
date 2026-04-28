/**
 * SENTINEL — MapPanel Component
 * Leaflet map showing alert locations with colored markers.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const TYPE_ICONS = {
  fire: '🔥',
  medical: '🏥',
  threat: '⚠️',
  evacuation: '🚨',
  unknown: '❓',
};

// Component to fly to selected alert
function FlyToAlert({ selectedAlert }) {
  const map = useMap();

  useEffect(() => {
    if (selectedAlert && selectedAlert.latitude && selectedAlert.longitude) {
      map.flyTo([selectedAlert.latitude, selectedAlert.longitude], 15, {
        duration: 1.5,
      });
    }
  }, [selectedAlert, map]);

  return null;
}

export default function MapPanel({ alerts = [], selectedAlert = null, onSelectAlert }) {
  const defaultCenter = [28.6139, 77.2090]; // New Delhi
  const defaultZoom = 12;

  return (
    <div className="glass-card p-3 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🗺️</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
          Incident Map
        </h2>
        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[var(--color-text-secondary)]">
          {alerts.length} markers
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-2">
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-[var(--color-text-muted)] capitalize">{sev}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg overflow-hidden relative" style={{ minHeight: '250px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="w-full h-full"
          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <FlyToAlert selectedAlert={selectedAlert} />

          {alerts.map(alert => {
            if (!alert.latitude || !alert.longitude) return null;
            const color = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low;
            const isSelected = selectedAlert?.id === alert.id;

            return (
              <CircleMarker
                key={alert.id}
                center={[alert.latitude, alert.longitude]}
                radius={isSelected ? 14 : alert.severity === 'critical' ? 10 : 7}
                fillColor={color}
                fillOpacity={isSelected ? 0.9 : 0.7}
                color={isSelected ? '#ffffff' : color}
                weight={isSelected ? 3 : 1.5}
                eventHandlers={{
                  click: () => onSelectAlert?.(alert),
                }}
              >
                <Popup>
                  <div className="text-xs" style={{ minWidth: '180px' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <span>{TYPE_ICONS[alert.type] || '❓'}</span>
                      <strong className="uppercase text-xs">{alert.type}</strong>
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                        backgroundColor: `${color}33`,
                        color: color,
                      }}>
                        {alert.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-1">{alert.english_translation || alert.message || 'Alert'}</p>
                    <div className="text-gray-400 text-[10px] space-y-0.5">
                      <div>📍 {alert.location}</div>
                      <div>Score: {alert.distress_score} | Conf: {Math.round((alert.confidence || 0) * 100)}%</div>
                      <div>Status: {alert.status}</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
