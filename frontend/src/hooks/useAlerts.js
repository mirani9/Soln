/**
 * SENTINEL — useAlerts Hook
 * Hybrid data source: tries backend API first, falls back to Firebase RTDB.
 * When backend is unreachable (deployed site), uses Firebase as primary store.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { database, firebaseEnabled, ref, onValue, set, update } from '../firebase/config';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// Check if backend is reachable
async function isBackendAvailable() {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastAlert, setLastAlert] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const prevCountRef = useRef(0);
  const backendCheckedRef = useRef(false);

  useEffect(() => {
    let interval;
    let unsubscribe;

    const init = async () => {
      // Check backend availability once
      if (!backendCheckedRef.current) {
        const available = await isBackendAvailable();
        setBackendOnline(available);
        backendCheckedRef.current = true;

        if (available) {
          // Backend mode: poll API + sync to Firebase
          const fetchAlerts = async () => {
            try {
              const resp = await axios.get(`${API_BASE}/alerts`);
              const data = resp.data;
              if (data && typeof data === 'object') {
                const alertList = Object.entries(data).map(([id, alert]) => ({
                  id, ...alert,
                }));
                alertList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setAlerts(alertList);

                if (alertList.length > prevCountRef.current && prevCountRef.current > 0) {
                  setLastAlert(alertList[0]);
                }
                prevCountRef.current = alertList.length;

                // Sync to Firebase for deployed site
                if (firebaseEnabled && database) {
                  try {
                    const alertsRef = ref(database, 'alerts');
                    set(alertsRef, data);
                  } catch (e) { /* silent */ }
                }
              }
            } catch (err) {
              console.warn('Backend fetch failed:', err.message);
            }
            setLoading(false);
          };

          fetchAlerts();
          interval = setInterval(fetchAlerts, 3000);
        } else {
          // Firebase-only mode (deployed site)
          if (firebaseEnabled && database) {
            const alertsRef = ref(database, 'alerts');
            unsubscribe = onValue(alertsRef, (snapshot) => {
              const data = snapshot.val();
              if (data) {
                const alertList = Object.entries(data).map(([id, alert]) => ({
                  id, ...alert,
                }));
                alertList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setAlerts(alertList);

                if (alertList.length > prevCountRef.current && prevCountRef.current > 0) {
                  setLastAlert(alertList[0]);
                }
                prevCountRef.current = alertList.length;
              } else {
                setAlerts([]);
              }
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getAlertsByStatus = useCallback((status) => {
    return alerts.filter(a => a.status === status);
  }, [alerts]);

  const getAlertsBySeverity = useCallback((severity) => {
    return alerts.filter(a => a.severity === severity);
  }, [alerts]);

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return {
    alerts,
    activeAlerts,
    loading,
    lastAlert,
    criticalCount,
    highCount,
    backendOnline,
    getAlertsByStatus,
    getAlertsBySeverity,
  };
}

export function useTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;
    let unsubscribe;

    const init = async () => {
      const available = await isBackendAvailable();

      if (available) {
        const fetchTimeline = async () => {
          try {
            const resp = await axios.get(`${API_BASE}/timeline`);
            const data = resp.data;
            if (data && typeof data === 'object') {
              const events = Object.entries(data).map(([id, event]) => ({
                id, ...event,
              }));
              events.sort((a, b) => new Date(b.time) - new Date(a.time));
              setTimeline(events);

              if (firebaseEnabled && database) {
                try {
                  const timelineRef = ref(database, 'timeline');
                  set(timelineRef, data);
                } catch (e) { /* silent */ }
              }
            }
          } catch (err) {
            console.warn('Timeline fetch failed:', err.message);
          }
          setLoading(false);
        };

        fetchTimeline();
        interval = setInterval(fetchTimeline, 5000);
      } else if (firebaseEnabled && database) {
        const timelineRef = ref(database, 'timeline');
        unsubscribe = onValue(timelineRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const events = Object.entries(data).map(([id, event]) => ({
              id, ...event,
            }));
            events.sort((a, b) => new Date(b.time) - new Date(a.time));
            setTimeline(events);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { timeline, loading };
}
