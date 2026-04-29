"""
SENTINEL — FastAPI Backend Server
AI Crisis Intelligence & Autonomous Response System
"""

import logging
import os
import time
from datetime import datetime
from typing import Optional

from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from models import (
    TextAnalysisRequest, TextAnalysisResponse,
    DecisionRequest, DecisionResponse,
    PoseAlertRequest, PoseAlertResponse,
    UpdateAlertRequest, HealthResponse
)
from ollama_client import (
    analyze_distress, parse_multilingual, generate_decisions,
    check_ollama_available, detect_vulnerability,
    calculate_false_alarm_score, add_to_context_memory
)
from firebase_client import (
    push_alert, update_alert_status, update_alert_actions,
    get_all_alerts, get_all_timeline, is_connected as firebase_connected,
    push_timeline_event
)

# ─── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("sentinel")

# ─── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(application):
    ollama_ok = await check_ollama_available()
    logger.info("SENTINEL API starting...")
    logger.info(f"   Ollama: {'Connected' if ollama_ok else 'Not available (using fallback)'}")
    logger.info(f"   Firebase: {'Connected' if firebase_connected() else 'Not configured (using local store)'}")
    logger.info("   Server ready at http://localhost:8000")
    yield

# ─── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(
    title="SENTINEL API",
    description="AI Crisis Intelligence & Autonomous Response System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend (configurable via CORS_ORIGINS env var)
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ─────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health_check():
    ollama_ok = await check_ollama_available()
    return HealthResponse(
        status="operational",
        ollama_available=ollama_ok,
        firebase_connected=firebase_connected(),
        timestamp=datetime.utcnow().isoformat(),
    )


# ─── POST /analyze-text ──────────────────────────────────────────

@app.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(req: TextAnalysisRequest):
    """
    Analyze a message for distress signals.
    Uses Ollama LLM with keyword-based fallback.
    """
    start_time = time.time()
    logger.info(f"Analyzing text: {req.message[:80]}...")

    # Step 1: Distress analysis
    distress_result = await analyze_distress(req.message)
    distress_score = int(distress_result.get("distress_score", 0))
    emergency_type = distress_result.get("emergency_type")
    reason = distress_result.get("reason", "Analysis complete")

    # Step 2: Multilingual parsing
    multilingual = await parse_multilingual(req.message)
    language = multilingual.get("language_detected", "english")
    translation = multilingual.get("english_translation", req.message)
    severity = multilingual.get("severity", "low")
    staff_role = multilingual.get("recommended_staff_role", "general")

    # Override emergency_type from multilingual if not detected
    if not emergency_type and multilingual.get("emergency_type") not in [None, "unknown"]:
        emergency_type = multilingual["emergency_type"]

    # Step 3: Vulnerability detection
    vuln_flags = detect_vulnerability(req.message)

    # Step 4: False alarm scoring
    false_alarm = calculate_false_alarm_score(distress_score, req.message)

    # Step 5: Confidence score (inverse of false alarm)
    confidence = round((100 - false_alarm) / 100, 2)

    # Step 6: Trigger alert if score > 60
    alert_triggered = distress_score > 60
    alert_id = None

    if alert_triggered:
        alert_data = {
            "type": emergency_type or "unknown",
            "severity": severity,
            "location": req.location or "Unknown",
            "latitude": req.latitude or 28.6139,
            "longitude": req.longitude or 77.2090,
            "confidence": confidence,
            "false_alarm_score": false_alarm,
            "distress_score": distress_score,
            "actions": [],
            "status": "new",
            "source": "text",
            "message": req.message,
            "vulnerability_flags": vuln_flags,
            "language_detected": language,
            "english_translation": translation,
            "recommended_staff_role": staff_role,
            "response_time": round(time.time() - start_time, 2),
        }
        alert_id = push_alert(alert_data)

        # Add to AI context memory
        add_to_context_memory({
            "type": emergency_type,
            "severity": severity,
            "distress_score": distress_score,
        })

        # Auto-generate decisions for high severity
        if severity in ["critical", "high"]:
            decision_result = await generate_decisions({
                "emergency_type": emergency_type,
                "severity": severity,
                "distress_score": distress_score,
                "location": req.location or "Unknown",
                "context": req.message,
            })
            update_alert_actions(alert_id, decision_result.get("actions", []))

        logger.info(f"Alert triggered: {alert_id} | type={emergency_type} | severity={severity}")

    return TextAnalysisResponse(
        distress_score=distress_score,
        reason=reason,
        emergency_type=emergency_type,
        language_detected=language,
        english_translation=translation,
        severity=severity,
        recommended_staff_role=staff_role,
        confidence=confidence,
        false_alarm_score=false_alarm,
        vulnerability_flags=vuln_flags,
        alert_triggered=alert_triggered,
        alert_id=alert_id,
    )


# ─── POST /decision ──────────────────────────────────────────────

@app.post("/decision", response_model=DecisionResponse)
async def decision_endpoint(req: DecisionRequest):
    """Generate 3 AI-powered response actions for an alert."""
    logger.info(f"Generating decisions for alert: {req.alert_id}")

    result = await generate_decisions({
        "emergency_type": req.emergency_type,
        "severity": req.severity,
        "distress_score": req.distress_score,
        "location": req.location or "Unknown",
        "context": req.context or "",
    })

    actions = result.get("actions", [])

    # Update alert with actions
    update_alert_actions(req.alert_id, actions)

    return DecisionResponse(
        actions=actions,
        alert_id=req.alert_id,
        reasoning=f"Generated {len(actions)} actions for {req.emergency_type} ({req.severity})",
    )


# ─── POST /pose-alert ────────────────────────────────────────────

@app.post("/pose-alert", response_model=PoseAlertResponse)
async def pose_alert(req: PoseAlertRequest):
    """Handle pose-based panic detection alerts from camera."""
    logger.info(f"Pose alert received: {req.pose_type} (confidence: {req.confidence})")

    # Map pose types to severity
    severity_map = {
        "falling": "critical",
        "panic": "high",
        "running": "medium",
    }
    severity = severity_map.get(req.pose_type, "medium")

    # Map to emergency type
    etype_map = {
        "falling": "medical",
        "panic": "threat",
        "running": "evacuation",
    }
    emergency_type = etype_map.get(req.pose_type, "unknown")

    alert_data = {
        "type": emergency_type,
        "severity": severity,
        "location": req.location or "Camera Feed",
        "latitude": req.latitude or 28.6139,
        "longitude": req.longitude or 77.2090,
        "confidence": req.confidence,
        "false_alarm_score": round((1 - req.confidence) * 100, 1),
        "distress_score": int(req.confidence * 100),
        "actions": [],
        "status": "new",
        "source": "camera",
        "message": f"Pose detection: {req.pose_type} detected with {req.confidence:.0%} confidence",
        "vulnerability_flags": [],
        "language_detected": "visual",
        "english_translation": f"{req.pose_type} detected via camera",
        "recommended_staff_role": "security" if req.pose_type == "panic" else "paramedic",
    }

    alert_id = push_alert(alert_data)

    # Add to context memory
    add_to_context_memory({
        "type": emergency_type,
        "severity": severity,
        "distress_score": int(req.confidence * 100),
    })

    # Generate decisions
    decision_result = await generate_decisions({
        "emergency_type": emergency_type,
        "severity": severity,
        "distress_score": int(req.confidence * 100),
        "location": req.location or "Camera Feed",
        "context": f"Visual detection: {req.pose_type}",
    })
    update_alert_actions(alert_id, decision_result.get("actions", []))

    return PoseAlertResponse(
        alert_id=alert_id,
        status="new",
        emergency_type=emergency_type,
        severity=severity,
    )


# ─── PUT /update-alert ───────────────────────────────────────────

@app.put("/update-alert")
async def update_alert(req: UpdateAlertRequest):
    """Update alert status."""
    success = update_alert_status(req.alert_id, req.status)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "updated", "alert_id": req.alert_id, "new_status": req.status}


# ─── GET /alerts ──────────────────────────────────────────────────

@app.get("/alerts")
async def get_alerts():
    """Get all current alerts."""
    return get_all_alerts()


# ─── GET /timeline ────────────────────────────────────────────────

@app.get("/timeline")
async def get_timeline():
    """Get all timeline events."""
    return get_all_timeline()


# ─── Scenario Endpoints ──────────────────────────────────────────

@app.post("/scenario/{scenario_type}")
async def trigger_scenario(scenario_type: str):
    """Trigger a test scenario (fire, medical, threat)."""
    scenarios = {
        "fire": {
            "message": "HELP! There's a massive fire on the 3rd floor! People are trapped and smoke is everywhere! Children are inside!",
            "location": "Building A, 3rd Floor",
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
        "medical": {
            "message": "Emergency! An elderly person has collapsed and is not breathing! They hit their head and there is bleeding! Please send ambulance immediately!",
            "location": "Main Lobby, Ground Floor",
            "latitude": 28.6145,
            "longitude": 77.2095,
        },
        "threat": {
            "message": "DANGER! Armed intruder spotted near the entrance! He has a weapon and is threatening people! Everyone is running and hiding! Children in the daycare!",
            "location": "Main Entrance Gate",
            "latitude": 28.6130,
            "longitude": 77.2085,
        },
    }

    if scenario_type not in scenarios:
        raise HTTPException(status_code=400, detail=f"Unknown scenario: {scenario_type}. Use: fire, medical, threat")

    scenario = scenarios[scenario_type]
    # Route through analyze-text
    req = TextAnalysisRequest(**scenario)
    return await analyze_text(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
