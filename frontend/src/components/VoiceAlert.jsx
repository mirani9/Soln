/**
 * SENTINEL — VoiceAlert Component
 * Controls for the voice alert system.
 */
export default function VoiceAlert({ voiceEnabled, speaking, supported, onToggle, onStop }) {
  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
          voiceEnabled
            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
            : 'bg-white/5 text-[var(--color-text-muted)] border border-[var(--color-border-default)] hover:bg-white/10'
        }`}
      >
        {voiceEnabled ? '🔊' : '🔇'} Voice {voiceEnabled ? 'ON' : 'OFF'}
      </button>
      {speaking && (
        <button
          onClick={onStop}
          className="text-xs px-2 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition cursor-pointer animate-pulse"
        >
          ⏹ Stop
        </button>
      )}
      {speaking && (
        <span className="text-xs text-[var(--color-text-muted)] animate-pulse">Speaking...</span>
      )}
    </div>
  );
}
