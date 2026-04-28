/**
 * SENTINEL — CameraPanel Component
 * Webcam feed + MediaPipe Pose overlay + auto-alert on panic detection.
 * Uses MediaPipe loaded from CDN (window globals) for bundler compatibility.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { analyzePose, drawLandmarks, resetPoseHistory } from '../utils/poseDetection';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export default function CameraPanel() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);
  const [active, setActive] = useState(false);
  const [detection, setDetection] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [error, setError] = useState(null);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const lastAlertTime = useRef(0);

  // Check if MediaPipe is loaded from CDN
  useEffect(() => {
    const check = () => {
      if (window.Pose && window.Camera) {
        setMediapipeReady(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    // Poll until loaded (CDN scripts might still be downloading)
    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sendPoseAlert = useCallback(async (det) => {
    const now = Date.now();
    if (now - lastAlertTime.current < 10000) return; // 10s cooldown
    lastAlertTime.current = now;
    setAlertSent(true);
    try {
      await axios.post(`${API_BASE}/pose-alert`, {
        pose_type: det.type,
        confidence: det.confidence,
        location: 'Camera Feed - Main Entrance',
      });
    } catch (err) { console.error('Pose alert failed:', err); }
    setTimeout(() => setAlertSent(false), 5000);
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!mediapipeReady) {
      setError('MediaPipe is still loading. Please wait...');
      return;
    }
    setError(null);
    resetPoseHistory();
    try {
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults((results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = results.image.width;
        canvas.height = results.image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        if (results.poseLandmarks) {
          drawLandmarks(ctx, results.poseLandmarks, canvas.width, canvas.height);
          const det = analyzePose(results.poseLandmarks);
          if (det && det.confidence >= 0.5) {
            setDetection(det);
            if (det.confidence >= 0.7) sendPoseAlert(det);
          } else {
            setDetection(null);
          }
        }
      });
      poseRef.current = pose;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      await camera.start();
      setActive(true);
    } catch (err) {
      setError('Camera access denied or not available: ' + (err.message || err));
      console.error(err);
    }
  }, [sendPoseAlert, mediapipeReady]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    poseRef.current = null;
    setActive(false);
    setDetection(null);
    resetPoseHistory();
  }, []);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${active ? 'animate-pulse' : ''}`}>📹</span>
          <h2 className="text-sm font-bold uppercase tracking-wider">Pose Detection</h2>
          {active && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          {!mediapipeReady && (
            <span className="text-[10px] text-yellow-400 animate-pulse">Loading MediaPipe...</span>
          )}
        </div>
        <button
          onClick={active ? stopCamera : startCamera}
          disabled={!mediapipeReady && !active}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 ${
            active
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'btn-sentinel'
          }`}
        >
          {active ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 relative rounded-lg overflow-hidden bg-black/50 min-h-[300px]">
        <video ref={videoRef} className="hidden" playsInline />
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl mb-3 opacity-30">📹</span>
            <p className="text-sm text-[var(--color-text-muted)]">Camera inactive</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Click Start to enable pose detection</p>
          </div>
        )}
        {detection && (
          <div
            className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              detection.type === 'falling'
                ? 'bg-red-500/80 text-white animate-shake'
                : detection.type === 'panic'
                ? 'bg-orange-500/80 text-white animate-shake'
                : 'bg-yellow-500/80 text-black'
            }`}
          >
            ⚠ {detection.type} Detected ({Math.round(detection.confidence * 100)}%)
          </div>
        )}
        {alertSent && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-500/90 text-white text-xs text-center py-2 rounded-lg animate-slide-in-up font-semibold">
            🚨 Alert Sent to Command Center
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {['running', 'falling', 'panic'].map((type) => (
          <div
            key={type}
            className={`text-center p-2 rounded-lg border text-xs ${
              detection?.type === type
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-[var(--color-border-default)] bg-white/5 text-[var(--color-text-muted)]'
            }`}
          >
            <div className="text-lg mb-1">
              {type === 'running' ? '🏃' : type === 'falling' ? '⬇️' : '🙆'}
            </div>
            <div className="capitalize font-semibold">{type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
