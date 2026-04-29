"""
SENTINEL — Firebase Admin Client
Handles all Firebase Realtime Database operations.

Environment Variables (optional):
  FIREBASE_SERVICE_ACCOUNT_PATH — Path to service account JSON
  FIREBASE_DATABASE_URL — Override the Realtime Database URL
"""

import json
import logging
import os
from datetime import datetime
from typing import Optional, Dict, Any

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sentinel.firebase")

# Firebase Admin SDK
firebase_initialized = False
db = None

try:
    import firebase_admin
    from firebase_admin import credentials, db as firebase_db

    # Support env var override for service account path
    service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        os.path.join(os.path.dirname(__file__), "serviceAccountKey.json"),
    )

    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        # Read the service account to get the project ID for RTDB URL
        with open(service_account_path, "r") as f:
            sa_data = json.load(f)
        project_id = sa_data.get("project_id", "sentinel-crisis")

        database_url = os.getenv(
            "FIREBASE_DATABASE_URL",
            f"https://{project_id}-default-rtdb.firebaseio.com",
        )

        firebase_admin.initialize_app(cred, {"databaseURL": database_url})
        db = firebase_db
        firebase_initialized = True
        logger.info("Firebase Admin initialized successfully")
    else:
        logger.warning(
            f"Firebase service account key not found at: {service_account_path}. "
            "Firebase features will be disabled. "
            "Download your serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts."
        )
except ImportError:
    logger.warning("firebase-admin package not installed. Firebase features disabled.")
except Exception as e:
    logger.warning(f"Firebase initialization failed: {e}")


# ─── In-memory fallback store ────────────────────────────────────
# Used when Firebase is not configured
_local_alerts: Dict[str, Dict] = {}
_local_timeline: Dict[str, Dict] = {}
_alert_counter = 0


def is_connected() -> bool:
    """Check if Firebase is connected."""
    return firebase_initialized


def _generate_alert_id() -> str:
    """Generate a unique alert ID."""
    global _alert_counter
    _alert_counter += 1
    return f"alert_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{_alert_counter}"


def _generate_event_id() -> str:
    """Generate a unique event ID."""
    return f"event_{datetime.utcnow().strftime('%Y%m%d_%H%M%S%f')}"


def push_alert(alert_data: Dict) -> str:
    """Push a new alert to Firebase RTDB (or local store)."""
    alert_id = _generate_alert_id()
    alert_data["id"] = alert_id
    alert_data["timestamp"] = alert_data.get("timestamp", datetime.utcnow().isoformat())

    if firebase_initialized and db:
        try:
            ref = db.reference(f"alerts/{alert_id}")
            ref.set(alert_data)
            logger.info(f"Alert pushed to Firebase: {alert_id}")

            # Also push a timeline event
            push_timeline_event(alert_id, "detected", f"Alert detected: {alert_data.get('type', 'unknown')}")
            return alert_id
        except Exception as e:
            logger.error(f"Firebase push failed: {e}")

    # Fallback to local store
    _local_alerts[alert_id] = alert_data
    push_timeline_event(alert_id, "detected", f"Alert detected: {alert_data.get('type', 'unknown')}")
    logger.info(f"Alert stored locally: {alert_id}")
    return alert_id


def update_alert_status(alert_id: str, status: str) -> bool:
    """Update the status of an existing alert."""
    if firebase_initialized and db:
        try:
            ref = db.reference(f"alerts/{alert_id}/status")
            ref.set(status)
            push_timeline_event(alert_id, status, f"Alert status changed to: {status}")
            return True
        except Exception as e:
            logger.error(f"Firebase update failed: {e}")

    # Fallback
    if alert_id in _local_alerts:
        _local_alerts[alert_id]["status"] = status
        push_timeline_event(alert_id, status, f"Alert status changed to: {status}")
        return True
    return False


def update_alert_actions(alert_id: str, actions: list) -> bool:
    """Update the actions for an alert."""
    if firebase_initialized and db:
        try:
            ref = db.reference(f"alerts/{alert_id}/actions")
            ref.set(actions)
            push_timeline_event(alert_id, "decision", f"AI decided {len(actions)} actions")
            return True
        except Exception as e:
            logger.error(f"Firebase actions update failed: {e}")

    if alert_id in _local_alerts:
        _local_alerts[alert_id]["actions"] = actions
        push_timeline_event(alert_id, "decision", f"AI decided {len(actions)} actions")
        return True
    return False


def push_timeline_event(alert_id: str, event_type: str, description: str = "") -> str:
    """Push a timeline event for an alert."""
    event_id = _generate_event_id()
    event_data = {
        "alert_id": alert_id,
        "event_type": event_type,
        "description": description,
        "time": datetime.utcnow().isoformat(),
    }

    if firebase_initialized and db:
        try:
            ref = db.reference(f"timeline/{event_id}")
            ref.set(event_data)
            return event_id
        except Exception as e:
            logger.error(f"Firebase timeline push failed: {e}")

    _local_timeline[event_id] = event_data
    return event_id


def get_all_alerts() -> Dict:
    """Get all alerts (from Firebase or local store)."""
    if firebase_initialized and db:
        try:
            ref = db.reference("alerts")
            data = ref.get()
            return data or {}
        except Exception as e:
            logger.error(f"Firebase read failed: {e}")

    return _local_alerts.copy()


def get_all_timeline() -> Dict:
    """Get all timeline events."""
    if firebase_initialized and db:
        try:
            ref = db.reference("timeline")
            data = ref.get()
            return data or {}
        except Exception as e:
            logger.error(f"Firebase timeline read failed: {e}")

    return _local_timeline.copy()
