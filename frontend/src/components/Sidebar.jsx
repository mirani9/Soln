/**
 * SENTINEL — Sidebar Component
 * Navigation + system status + alert counts
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '🛡️' },
  { path: '/camera', label: 'Camera', icon: '📹' },
  { path: '/incidents', label: 'Incidents', icon: '📋' },
  { path: '/guest', label: 'Guest Portal', icon: '🆘' },
];

export default function Sidebar({ criticalCount = 0, highCount = 0, alerts = [], ollamaStatus = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const totalActive = alerts.filter(a => a.status !== 'resolved').length;

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] ${
        collapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--color-border-default)]">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-red-500 flex items-center justify-center text-xl font-bold flex-shrink-0 ${criticalCount > 0 ? 'animate-pulse-glow' : ''}`}>
          S
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold gradient-text tracking-wider">SENTINEL</h1>
            <p className="text-[10px] text-[var(--color-text-muted)]">Crisis Intelligence</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              id={`nav-${item.path.slice(1)}`}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer ${
                active
                  ? 'bg-[var(--color-accent)] bg-opacity-20 text-[var(--color-accent-bright)] border border-[var(--color-border-glow)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] border border-transparent'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.path === '/dashboard' && totalActive > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  {totalActive}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      <div className={`px-3 pb-4 border-t border-[var(--color-border-default)] pt-3 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed && (
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">System Status</h3>

            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${ollamaStatus ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-[var(--color-text-secondary)]">
                AI Engine {ollamaStatus ? 'Online' : 'Fallback'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[var(--color-text-secondary)]">Backend Active</span>
            </div>

            {/* Alert counts */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
                <div className="text-lg font-bold text-red-400">{criticalCount}</div>
                <div className="text-[9px] text-red-400/70 uppercase">Critical</div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-2 text-center border border-orange-500/20">
                <div className="text-lg font-bold text-orange-400">{highCount}</div>
                <div className="text-[9px] text-orange-400/70 uppercase">High</div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-3 w-full text-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition text-sm cursor-pointer"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </aside>
  );
}
