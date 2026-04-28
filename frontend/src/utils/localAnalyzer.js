/**
 * SENTINEL — Local AI Analyzer (Browser-side)
 * Replicates the backend's keyword-based distress analysis entirely in JavaScript.
 * Used as fallback when the backend API is unreachable (e.g., deployed site).
 */

// ─── Keyword Databases ─────────────────────────────────────────

const EMERGENCY_KEYWORDS = {
  fire: ['fire', 'burning', 'smoke', 'flames', 'blaze', 'arson', 'inferno', 'combustion', 'wildfire'],
  medical: ['medical', 'injured', 'bleeding', 'unconscious', 'heart attack', 'stroke', 'ambulance', 'hospital', 'collapsed', 'breathing', 'seizure', 'allergic', 'poison', 'overdose', 'wound'],
  threat: ['threat', 'weapon', 'gun', 'bomb', 'attack', 'shooter', 'hostage', 'intruder', 'terrorist', 'explosive', 'knife', 'armed', 'violent'],
  evacuation: ['evacuate', 'flood', 'earthquake', 'tsunami', 'tornado', 'hurricane', 'gas leak', 'chemical spill', 'collapse', 'landslide'],
};

const DISTRESS_KEYWORDS = {
  critical: ['help', 'emergency', 'dying', 'dead', 'killed', 'murder', 'trapped', 'suffocating', 'choking', 'drowning', 'critical', 'fatal', 'severe'],
  high: ['danger', 'urgent', 'hurry', 'please', 'save', 'rescue', 'serious', 'worst', 'terrible', 'horrible'],
  medium: ['accident', 'hurt', 'pain', 'problem', 'issue', 'worried', 'scared', 'afraid', 'concern'],
  low: ['minor', 'small', 'slight', 'possible', 'maybe', 'check', 'inspect'],
};

const VULNERABILITY_KEYWORDS = {
  child: ['child', 'children', 'kids', 'baby', 'infant', 'toddler', 'minor', 'young', 'boy', 'girl', 'daycare', 'school'],
  elderly: ['elderly', 'old', 'senior', 'aged', 'grandfather', 'grandmother', 'grandma', 'grandpa'],
  injured: ['injured', 'wounded', 'bleeding', 'broken', 'fracture', 'trauma', 'unconscious', 'collapsed'],
  disabled: ['disabled', 'wheelchair', 'blind', 'deaf', 'mobility', 'handicap'],
  pregnant: ['pregnant', 'pregnancy', 'expecting', 'labor', 'contractions'],
};

const STAFF_ROLES = {
  fire: 'firefighter',
  medical: 'paramedic',
  threat: 'security',
  evacuation: 'emergency_coordinator',
  unknown: 'general',
};

const SCENARIO_MESSAGES = {
  fire: "HELP! There's a massive fire on the 3rd floor! People are trapped and smoke is everywhere! Children are inside!",
  medical: "Emergency! An elderly person has collapsed and is not breathing! They hit their head and there is bleeding! Please send ambulance immediately!",
  threat: "DANGER! Armed intruder spotted near the entrance! He has a weapon and is threatening people! Everyone is running and hiding! Children in the daycare!",
};

const SCENARIO_LOCATIONS = {
  fire: { location: 'Building A, 3rd Floor', lat: 28.6139, lng: 77.2090 },
  medical: { location: 'Main Lobby, Ground Floor', lat: 28.6145, lng: 77.2095 },
  threat: { location: 'Main Entrance Gate', lat: 28.6130, lng: 77.2085 },
};

const DECISION_TEMPLATES = {
  fire: [
    'Dispatch fire brigade to location immediately',
    'Evacuate building and nearby areas now',
    'Alert hospitals for burn injury patients',
  ],
  medical: [
    'Send paramedics to reported location urgently',
    'Prepare nearest hospital emergency ward now',
    'Notify family contacts of the patient',
  ],
  threat: [
    'Deploy security team to threat location',
    'Lock down facility and alert occupants',
    'Contact law enforcement for armed response',
  ],
  evacuation: [
    'Sound evacuation alarms immediately',
    'Guide evacuees to designated safe zones',
    'Deploy rescue teams for trapped individuals',
  ],
  unknown: [
    'Dispatch closest available response team',
    'Establish communication with affected area',
    'Prepare emergency medical response on standby',
  ],
};

// ─── Analysis Functions ─────────────────────────────────────────

/**
 * Analyze a text message for distress level and emergency type.
 */
export function analyzeText(message, location = 'Unknown Location') {
  const lower = message.toLowerCase();

  // Detect emergency type
  let emergencyType = 'unknown';
  let maxTypeMatches = 0;
  for (const [type, keywords] of Object.entries(EMERGENCY_KEYWORDS)) {
    const matches = keywords.filter(k => lower.includes(k)).length;
    if (matches > maxTypeMatches) {
      maxTypeMatches = matches;
      emergencyType = type;
    }
  }

  // Calculate distress score
  let distressScore = 20; // base
  for (const [level, keywords] of Object.entries(DISTRESS_KEYWORDS)) {
    const matches = keywords.filter(k => lower.includes(k)).length;
    if (level === 'critical') distressScore += matches * 20;
    else if (level === 'high') distressScore += matches * 15;
    else if (level === 'medium') distressScore += matches * 10;
    else distressScore += matches * 5;
  }

  // Urgency markers
  const exclamationCount = (message.match(/!/g) || []).length;
  const capsRatio = (message.match(/[A-Z]/g) || []).length / Math.max(message.length, 1);
  distressScore += Math.min(exclamationCount * 5, 15);
  if (capsRatio > 0.4) distressScore += 15;

  distressScore = Math.min(100, Math.max(0, distressScore));

  // Severity
  let severity = 'low';
  if (distressScore >= 80) severity = 'critical';
  else if (distressScore >= 60) severity = 'high';
  else if (distressScore >= 40) severity = 'medium';

  // Vulnerability flags
  const vulnerabilityFlags = [];
  for (const [flag, keywords] of Object.entries(VULNERABILITY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      vulnerabilityFlags.push(flag);
    }
  }

  // Confidence and false alarm
  const confidence = Math.min(0.95, 0.3 + (maxTypeMatches * 0.15) + (distressScore / 200));
  const falseAlarmScore = Math.max(5, 100 - distressScore - (maxTypeMatches * 10));

  // Staff role
  const staffRole = STAFF_ROLES[emergencyType] || STAFF_ROLES.unknown;

  // Actions
  const actions = DECISION_TEMPLATES[emergencyType] || DECISION_TEMPLATES.unknown;

  // Location with coords
  const coords = SCENARIO_LOCATIONS[emergencyType] || { lat: 28.6139 + (Math.random() - 0.5) * 0.01, lng: 77.2090 + (Math.random() - 0.5) * 0.01 };

  const alertId = `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    distress_score: distressScore,
    emergency_type: emergencyType,
    language_detected: 'english',
    english_translation: message,
    severity,
    recommended_staff_role: staffRole,
    confidence,
    false_alarm_score: falseAlarmScore,
    vulnerability_flags: vulnerabilityFlags,
    alert_triggered: distressScore >= 60,
    alert_id: alertId,
    actions,
    location: location,
    latitude: coords.lat,
    longitude: coords.lng,
    timestamp: new Date().toISOString(),
    status: 'new',
    source: 'text',
    message,
    response_time: (Math.random() * 3 + 2).toFixed(2),
  };
}

/**
 * Generate decisions for an alert.
 */
export function generateDecisions(emergencyType) {
  return DECISION_TEMPLATES[emergencyType] || DECISION_TEMPLATES.unknown;
}

/**
 * Generate a scenario alert.
 */
export function generateScenario(type) {
  const message = SCENARIO_MESSAGES[type] || SCENARIO_MESSAGES.fire;
  const loc = SCENARIO_LOCATIONS[type] || SCENARIO_LOCATIONS.fire;
  return analyzeText(message, loc.location);
}
