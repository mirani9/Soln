"""
SENTINEL — Ollama LLM Client
Handles all AI inference via local Ollama server.
Includes smart fallback when Ollama is not available.
"""

import httpx
import json
import re
import logging
from typing import Optional, Dict, Any, List
from collections import deque

logger = logging.getLogger("sentinel.ollama")

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3"

# Context memory — stores last 3 alerts for AI context
context_memory: deque = deque(maxlen=3)

# Vulnerability keywords
VULNERABILITY_KEYWORDS = {
    "child": ["child", "children", "kid", "kids", "baby", "infant", "toddler", "minor", "boy", "girl", "son", "daughter"],
    "elderly": ["elderly", "old", "senior", "grandma", "grandpa", "grandmother", "grandfather", "aged", "elder"],
    "injured": ["injured", "hurt", "wound", "bleeding", "broken", "fracture", "unconscious", "fainted", "collapsed"],
    "disabled": ["disabled", "wheelchair", "blind", "deaf", "handicap", "disability", "crutch"],
    "pregnant": ["pregnant", "pregnancy", "expecting", "labor", "contractions"],
}

# Emergency keywords for fallback
EMERGENCY_KEYWORDS = {
    "fire": ["fire", "burn", "burning", "smoke", "flames", "arson", "blaze", "inferno", "incendio", "fuego", "آگ"],
    "medical": ["medical", "heart", "attack", "bleeding", "unconscious", "fainted", "seizure", "choking", "poison", "overdose", "stroke", "ambulance", "doctor", "hospital", "pain", "injury"],
    "threat": ["threat", "gun", "shoot", "bomb", "attack", "weapon", "stab", "knife", "terrorist", "hostage", "violence", "assault", "robbery", "murder", "kill"],
    "evacuation": ["evacuation", "evacuate", "flood", "earthquake", "tsunami", "tornado", "hurricane", "collapse", "gas leak", "explosion", "landslide"],
}

DISTRESS_KEYWORDS = [
    "help", "emergency", "danger", "scared", "afraid", "trapped", "dying",
    "please", "hurry", "save", "urgent", "sos", "panic", "run", "hide",
    "attack", "blood", "hurt", "pain", "can't breathe", "lost", "alone",
    "madad", "bachao", "sahayata", "socorro", "ayuda", "hilfe", "помогите",
    "مدد", "助けて", "救命", "도와주세요",
]


async def check_ollama_available() -> bool:
    """Check if Ollama server is running."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


def extract_json_from_response(text: str) -> Optional[Dict]:
    """Extract JSON object from LLM response text."""
    # Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find JSON block in markdown code fences
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
        r'\{[\s\S]*\}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                candidate = match.group(1) if match.lastindex else match.group(0)
                return json.loads(candidate.strip())
            except (json.JSONDecodeError, IndexError):
                continue
    return None


def detect_vulnerability(message: str) -> List[str]:
    """Detect vulnerability flags in message."""
    flags = []
    msg_lower = message.lower()
    for category, keywords in VULNERABILITY_KEYWORDS.items():
        if any(kw in msg_lower for kw in keywords):
            flags.append(category)
    return flags


def calculate_false_alarm_score(distress_score: int, message: str) -> float:
    """Calculate false alarm probability (0-100). Lower = more likely real."""
    score = 100.0
    msg_lower = message.lower()

    # More distress keywords = lower false alarm
    keyword_count = sum(1 for kw in DISTRESS_KEYWORDS if kw in msg_lower)
    score -= keyword_count * 12

    # High distress score = lower false alarm
    if distress_score > 80:
        score -= 30
    elif distress_score > 60:
        score -= 20
    elif distress_score > 40:
        score -= 10

    # Very short messages are more likely false alarms
    if len(message.split()) < 3:
        score += 15

    # Multiple exclamation/caps = more urgent
    if message.count("!") >= 2:
        score -= 10
    if sum(1 for c in message if c.isupper()) > len(message) * 0.5 and len(message) > 5:
        score -= 10

    return max(0.0, min(100.0, score))


# ─── Fallback Engine (keyword-based) ─────────────────────────────

def fallback_analyze_distress(message: str) -> Dict:
    """Keyword-based distress analysis when Ollama is unavailable."""
    msg_lower = message.lower()
    score = 0

    # Count distress keywords
    matched = [kw for kw in DISTRESS_KEYWORDS if kw in msg_lower]
    score += len(matched) * 18

    # Check for emergency types
    detected_type = None
    max_matches = 0
    for etype, keywords in EMERGENCY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in msg_lower)
        if matches > max_matches:
            max_matches = matches
            detected_type = etype

    if max_matches > 0:
        score += max_matches * 15

    # Caps and punctuation urgency
    if message.count("!") >= 1:
        score += 8
    if message.count("!") >= 3:
        score += 7
    if sum(1 for c in message if c.isupper()) > len(message) * 0.3 and len(message) > 5:
        score += 12

    # Longer messages with keywords are more credible
    if len(message.split()) > 8 and len(matched) > 0:
        score += 10

    score = min(100, max(0, score))

    return {
        "distress_score": score,
        "reason": f"Matched keywords: {', '.join(matched[:5]) if matched else 'none'} (fallback mode)",
        "emergency_type": detected_type,
    }


def fallback_parse_multilingual(message: str) -> Dict:
    """Fallback multilingual parsing."""
    analysis = fallback_analyze_distress(message)
    severity = "low"
    if analysis["distress_score"] > 80:
        severity = "critical"
    elif analysis["distress_score"] > 60:
        severity = "high"
    elif analysis["distress_score"] > 40:
        severity = "medium"

    staff_map = {
        "fire": "firefighter",
        "medical": "paramedic",
        "threat": "security",
        "evacuation": "emergency_coordinator",
    }

    return {
        "language_detected": "english",
        "emergency_type": analysis["emergency_type"] or "unknown",
        "severity": severity,
        "english_translation": message,
        "recommended_staff_role": staff_map.get(analysis["emergency_type"] or "", "general"),
    }


def fallback_generate_decisions(alert: Dict) -> Dict:
    """Fallback decision generation."""
    etype = alert.get("emergency_type", "unknown")
    actions_map = {
        "fire": [
            "Dispatch fire brigade to location immediately",
            "Evacuate building and nearby areas now",
            "Alert hospitals for burn injury patients"
        ],
        "medical": [
            "Send paramedics to reported location urgently",
            "Prepare nearest hospital emergency ward now",
            "Notify family contacts of the patient"
        ],
        "threat": [
            "Deploy security team to threat location",
            "Lock down facility and alert occupants",
            "Contact law enforcement for armed response"
        ],
        "evacuation": [
            "Activate evacuation sirens and PA system",
            "Open all emergency exits immediately now",
            "Deploy rescue teams to affected zones"
        ],
    }
    return {
        "actions": actions_map.get(etype, [
            "Send first responders to the location",
            "Alert nearby hospitals and authorities now",
            "Establish communication with affected area"
        ])
    }


# ─── Ollama LLM Functions ────────────────────────────────────────

async def analyze_distress(message: str) -> Dict:
    """Analyze message for distress using Ollama LLM."""
    # Build context from memory
    context_str = ""
    if context_memory:
        context_str = "\nRecent alerts for context:\n"
        for i, ctx in enumerate(context_memory):
            context_str += f"- Alert {i+1}: {ctx.get('type', 'unknown')} | severity: {ctx.get('severity', 'unknown')} | score: {ctx.get('distress_score', 0)}\n"

    prompt = f"""You are a crisis detection AI. Analyze the following message for signs of distress, emergency, or danger.
{context_str}
Message: "{message}"

Return ONLY a valid JSON object with NO extra text:
{{
  "distress_score": <number 0-100>,
  "reason": "<brief explanation>",
  "emergency_type": "<fire|medical|threat|evacuation|null>"
}}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3}
            })
            if resp.status_code == 200:
                data = resp.json()
                result = extract_json_from_response(data.get("response", ""))
                if result and "distress_score" in result:
                    return result
    except Exception as e:
        logger.warning(f"Ollama unavailable: {e}")

    # Fallback
    logger.info("Using fallback distress analysis")
    return fallback_analyze_distress(message)


async def parse_multilingual(message: str) -> Dict:
    """Parse multilingual emergency message using Ollama LLM."""
    prompt = f"""You are a multilingual emergency interpreter AI. Analyze this message which may be in ANY language.

Message: "{message}"

Return ONLY a valid JSON object with NO extra text:
{{
  "language_detected": "<detected language>",
  "emergency_type": "<fire|medical|threat|evacuation|unknown>",
  "severity": "<critical|high|medium|low>",
  "english_translation": "<full english translation>",
  "recommended_staff_role": "<firefighter|paramedic|security|emergency_coordinator|general>"
}}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3}
            })
            if resp.status_code == 200:
                data = resp.json()
                result = extract_json_from_response(data.get("response", ""))
                if result and "language_detected" in result:
                    return result
    except Exception as e:
        logger.warning(f"Ollama unavailable for multilingual: {e}")

    return fallback_parse_multilingual(message)


async def generate_decisions(alert: Dict) -> Dict:
    """Generate 3 response actions using Ollama LLM."""
    context_str = ""
    if context_memory:
        context_str = "\nRecent alert history:\n"
        for i, ctx in enumerate(context_memory):
            context_str += f"- {ctx.get('type', 'unknown')} ({ctx.get('severity', 'unknown')})\n"

    prompt = f"""You are an AI crisis decision engine. Based on the alert below, generate EXACTLY 3 specific response actions.
Each action must be under 12 words.
{context_str}
Alert Details:
- Type: {alert.get('emergency_type', 'unknown')}
- Severity: {alert.get('severity', 'unknown')}
- Distress Score: {alert.get('distress_score', 0)}
- Location: {alert.get('location', 'Unknown')}
- Context: {alert.get('context', 'None')}

Return ONLY a valid JSON object with NO extra text:
{{
  "actions": ["<action 1>", "<action 2>", "<action 3>"]
}}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.5}
            })
            if resp.status_code == 200:
                data = resp.json()
                result = extract_json_from_response(data.get("response", ""))
                if result and "actions" in result and len(result["actions"]) >= 3:
                    # Ensure exactly 3 actions, each under 12 words
                    actions = [a[:80] for a in result["actions"][:3]]
                    return {"actions": actions}
    except Exception as e:
        logger.warning(f"Ollama unavailable for decisions: {e}")

    return fallback_generate_decisions(alert)


def add_to_context_memory(alert_summary: Dict):
    """Add alert to context memory for future AI prompts."""
    context_memory.append(alert_summary)
