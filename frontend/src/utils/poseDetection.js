/**
 * SENTINEL — Pose Detection Utility
 * Uses MediaPipe Pose to detect running, falling, and panic movements.
 */

// Landmark indices for MediaPipe Pose
const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// Store previous frames for motion analysis
let previousFrames = [];
const MAX_FRAMES = 10;

/**
 * Analyze pose landmarks and detect emergency poses.
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @returns {Object|null} Detection result with type and confidence
 */
export function analyzePose(landmarks) {
  if (!landmarks || landmarks.length < 33) return null;

  // Store frame for motion analysis
  const currentFrame = {
    timestamp: Date.now(),
    landmarks: landmarks.map(l => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility })),
  };
  previousFrames.push(currentFrame);
  if (previousFrames.length > MAX_FRAMES) {
    previousFrames.shift();
  }

  // Check each pose type
  const falling = detectFalling(landmarks);
  const panic = detectPanic(landmarks);
  const running = detectRunning(landmarks);

  // Return the highest confidence detection
  const detections = [
    falling && { type: 'falling', ...falling },
    panic && { type: 'panic', ...panic },
    running && { type: 'running', ...running },
  ].filter(Boolean);

  if (detections.length === 0) return null;

  // Return highest confidence
  detections.sort((a, b) => b.confidence - a.confidence);
  return detections[0];
}

/**
 * Detect falling pose.
 * Indicators: shoulder level close to hip level, rapid vertical movement.
 */
function detectFalling(landmarks) {
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
  const nose = landmarks[LANDMARKS.NOSE];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;

  // In MediaPipe, y increases downward
  // If shoulders are at or below hip level, person might be falling
  const shoulderHipDiff = hipY - shoulderY;

  // Normal standing: shoulder well above hip (shoulderHipDiff > 0.15)
  // Falling: shoulder close to or below hip level
  let confidence = 0;

  if (shoulderHipDiff < 0.05) {
    confidence = 0.8;
  } else if (shoulderHipDiff < 0.10) {
    confidence = 0.6;
  } else if (shoulderHipDiff < 0.12) {
    confidence = 0.4;
  }

  // Check for rapid vertical change
  if (previousFrames.length >= 3) {
    const prevFrame = previousFrames[previousFrames.length - 3];
    const prevShoulderY = (prevFrame.landmarks[LANDMARKS.LEFT_SHOULDER].y + prevFrame.landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
    const verticalSpeed = Math.abs(shoulderY - prevShoulderY);
    if (verticalSpeed > 0.08) {
      confidence = Math.min(1.0, confidence + 0.3);
    }
  }

  return confidence >= 0.5 ? { confidence } : null;
}

/**
 * Detect panic movement.
 * Indicators: hands raised above head, rapid arm movement.
 */
function detectPanic(landmarks) {
  const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
  const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const nose = landmarks[LANDMARKS.NOSE];

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !nose) return null;

  let confidence = 0;

  // Hands above head (wrist Y < nose Y in MediaPipe coords)
  const handsAboveHead =
    (leftWrist.y < nose.y && leftWrist.visibility > 0.5) ||
    (rightWrist.y < nose.y && rightWrist.visibility > 0.5);

  if (handsAboveHead) {
    confidence += 0.4;
  }

  // Both hands up = more panic-like
  if (leftWrist.y < nose.y && rightWrist.y < nose.y &&
      leftWrist.visibility > 0.5 && rightWrist.visibility > 0.5) {
    confidence += 0.3;
  }

  // Check for rapid arm movement
  if (previousFrames.length >= 2) {
    const prevFrame = previousFrames[previousFrames.length - 2];
    const prevLeftWrist = prevFrame.landmarks[LANDMARKS.LEFT_WRIST];
    const prevRightWrist = prevFrame.landmarks[LANDMARKS.RIGHT_WRIST];

    const leftArmSpeed = Math.sqrt(
      Math.pow(leftWrist.x - prevLeftWrist.x, 2) +
      Math.pow(leftWrist.y - prevLeftWrist.y, 2)
    );
    const rightArmSpeed = Math.sqrt(
      Math.pow(rightWrist.x - prevRightWrist.x, 2) +
      Math.pow(rightWrist.y - prevRightWrist.y, 2)
    );

    if (leftArmSpeed > 0.06 || rightArmSpeed > 0.06) {
      confidence += 0.3;
    }
  }

  return confidence >= 0.5 ? { confidence: Math.min(1.0, confidence) } : null;
}

/**
 * Detect running pose.
 * Indicators: large stride (ankle separation), rapid horizontal movement.
 */
function detectRunning(landmarks) {
  const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
  const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

  if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee) return null;

  let confidence = 0;

  // Large stride (ankle horizontal separation)
  const ankleSeparation = Math.abs(leftAnkle.x - rightAnkle.x);
  if (ankleSeparation > 0.2) {
    confidence += 0.3;
  }

  // One knee significantly higher than the other (running stride)
  const kneeDiff = Math.abs(leftKnee.y - rightKnee.y);
  if (kneeDiff > 0.08) {
    confidence += 0.3;
  }

  // Rapid horizontal movement
  if (previousFrames.length >= 3) {
    const prevFrame = previousFrames[previousFrames.length - 3];
    const prevHipX = (prevFrame.landmarks[LANDMARKS.LEFT_HIP].x + prevFrame.landmarks[LANDMARKS.RIGHT_HIP].x) / 2;
    const currentHipX = (leftHip.x + rightHip.x) / 2;
    const horizontalSpeed = Math.abs(currentHipX - prevHipX);

    if (horizontalSpeed > 0.05) {
      confidence += 0.4;
    }
  }

  return confidence >= 0.5 ? { confidence: Math.min(1.0, confidence) } : null;
}

/**
 * Reset the frame buffer.
 */
export function resetPoseHistory() {
  previousFrames = [];
}

/**
 * Draw landmarks on canvas.
 */
export function drawLandmarks(ctx, landmarks, width, height) {
  if (!landmarks || !ctx) return;

  // Draw connections
  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28],
  ];

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;

  connections.forEach(([i, j]) => {
    const a = landmarks[i];
    const b = landmarks[j];
    if (a && b && a.visibility > 0.3 && b.visibility > 0.3) {
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }
  });

  // Draw points
  landmarks.forEach((landmark, idx) => {
    if (landmark.visibility > 0.3) {
      ctx.fillStyle = idx < 11 ? '#ef4444' : '#22c55e';
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
