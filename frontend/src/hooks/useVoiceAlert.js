/**
 * SENTINEL — useVoiceAlert Hook
 * Uses Web Speech API to speak alerts automatically.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useVoiceAlert() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const spokenAlertsRef = useRef(new Set());

  useEffect(() => {
    setSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text, urgency = 'normal') => {
    if (!supported || !voiceEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Adjust voice parameters based on urgency
    switch (urgency) {
      case 'critical':
        utterance.rate = 1.2;
        utterance.pitch = 1.3;
        utterance.volume = 1.0;
        break;
      case 'high':
        utterance.rate = 1.1;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
    }

    // Try to use a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v =>
      v.lang.startsWith('en') && v.name.includes('Google')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported, voiceEnabled]);

  const speakAlert = useCallback((alert) => {
    if (!alert || !alert.id) return;

    // Don't repeat alerts
    if (spokenAlertsRef.current.has(alert.id)) return;
    spokenAlertsRef.current.add(alert.id);

    const severityText = alert.severity === 'critical' ? 'CRITICAL' :
                          alert.severity === 'high' ? 'HIGH PRIORITY' :
                          alert.severity === 'medium' ? 'MEDIUM' : 'LOW';

    const typeText = alert.type || 'unknown';
    const locationText = alert.location || 'unknown location';

    const message = `Attention! ${severityText} ${typeText} alert detected at ${locationText}. Distress score: ${alert.distress_score || 'unknown'}. Immediate response required.`;

    speak(message, alert.severity === 'critical' ? 'critical' :
                    alert.severity === 'high' ? 'high' : 'normal');
  }, [speak]);

  const stopSpeaking = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
    if (speaking) {
      stopSpeaking();
    }
  }, [speaking, stopSpeaking]);

  return {
    voiceEnabled,
    speaking,
    supported,
    speak,
    speakAlert,
    stopSpeaking,
    toggleVoice,
  };
}
