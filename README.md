# SENTINEL — AI Crisis Intelligence & Autonomous Response System

Real-time AI-powered crisis detection and response platform with local LLM, pose detection, multilingual support, and autonomous decision-making.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Guest Portal   │────▶│   FastAPI Server  │────▶│  Ollama LLM      │
│   (React)        │     │   (Python)        │     │  (llama3)        │
└─────────────────┘     └──────┬───────────┘     └──────────────────┘
                               │                          │
┌─────────────────┐            │                   ┌──────▼──────────┐
│   Camera Panel   │───────────┤                   │  Fallback AI    │
│   (MediaPipe)    │           │                   │  (keyword-based)│
└─────────────────┘            │                   └─────────────────┘
                               │
┌─────────────────┐     ┌──────▼───────────┐
│ Staff Dashboard  │◀───│ Firebase RTDB /   │
│ (Real-time)      │    │ In-Memory Store   │
└─────────────────┘     └──────────────────┘
```

## 🧠 Core Features

| Feature | Description |
|---------|-------------|
| **Silent SOS Detection** | Analyzes messages for hidden distress (score 0-100) |
| **Multilingual Interpreter** | Detects language, translates, classifies emergency type |
| **AI Decision Engine** | Generates exactly 3 response actions per alert |
| **Pose-Based Panic Detection** | MediaPipe detects running, falling, panic movements |
| **Live Dashboard** | Real-time alerts with color-coded severity |
| **Incident Map** | Leaflet map with alert markers and fly-to feature |
| **Timeline Logger** | Complete event log: detected → decision → resolved |
| **Voice Alerts** | Web Speech API auto-announces critical alerts |

## 🔥 Advanced Features

- **False Alarm Score** — Confidence percentage for each alert
- **Context Memory** — Last 3 alerts passed to AI for better decisions
- **Severity Escalation Meter** — Dynamic gauge with color gradient
- **Vulnerability Detection** — Flags child, elderly, injured, disabled, pregnant
- **Response Time Tracker** — Live elapsed time since detection
- **Scenario Switching** — Fire / Medical / Threat test buttons

## ⚙️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Python FastAPI + Uvicorn |
| AI | Ollama (local LLM, llama3) + Keyword Fallback |
| Maps | Leaflet + React-Leaflet (dark tiles) |
| Vision | MediaPipe Pose (browser, CDN) |
| Voice | Web Speech API |
| Database | Firebase RTDB / In-Memory fallback |
| Auth | Firebase Auth / Skip mode |

## 📦 Folder Structure

```
GOOGLE SOLUTION/
├── README.md
├── backend/
│   ├── main.py              # FastAPI server (7 endpoints)
│   ├── models.py            # Pydantic schemas
│   ├── ollama_client.py     # Ollama LLM + fallback engine
│   ├── firebase_client.py   # Firebase Admin + local store
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── index.html            # HTML + MediaPipe CDN
    ├── vite.config.js        # Vite + Tailwind + proxy
    ├── package.json          # NPM dependencies
    ├── public/
    │   └── sentinel-logo.svg # App favicon
    └── src/
        ├── main.jsx          # React entry
        ├── App.jsx           # Router
        ├── index.css         # Dark theme + animations
        ├── firebase/
        │   └── config.js     # Firebase SDK config
        ├── hooks/
        │   ├── useAlerts.js  # Real-time alert listener
        │   └── useVoiceAlert.js # Web Speech API
        ├── utils/
        │   └── poseDetection.js # Pose analysis algorithms
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── AlertPanel.jsx
        │   ├── MapPanel.jsx
        │   ├── DecisionPanel.jsx
        │   ├── CameraPanel.jsx
        │   ├── IncidentLog.jsx
        │   ├── ScenarioSwitcher.jsx
        │   ├── SeverityMeter.jsx
        │   ├── VoiceAlert.jsx
        │   ├── ResponseTimer.jsx
        │   └── VulnerabilityBadge.jsx
        └── pages/
            ├── GuestPortal.jsx
            ├── StaffDashboard.jsx
            ├── CameraPage.jsx
            ├── IncidentsPage.jsx
            └── Login.jsx
```

## 🚀 Step-by-Step Run Instructions

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **Ollama** (optional, for local AI — works without it via fallback)

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Start the Backend Server

```bash
cd backend
python main.py
```

The server starts at `http://localhost:8000`. You'll see:
```
SENTINEL API starting...
   Ollama: Not available (using fallback)
   Firebase: Not configured (using local store)
   Server ready at http://localhost:8000
```

### Step 4: Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend starts at `http://localhost:5173`

### Step 5: Open in Browser

- **Guest Portal**: http://localhost:5173/guest
- **Staff Dashboard**: http://localhost:5173/dashboard
- **Camera Page**: http://localhost:5173/camera
- **Incident Log**: http://localhost:5173/incidents

## 🔧 Optional Setup

### Enable Ollama (Local AI)

1. Install Ollama: https://ollama.ai
2. Pull the model:
   ```bash
   ollama pull llama3
   ```
3. Start Ollama server (runs on port 11434 by default)
4. Restart the backend — it will auto-detect Ollama

### Enable Firebase

#### Backend (Firebase Admin SDK):
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Project Settings → Service Accounts
3. Generate a new private key (JSON)
4. Save as `backend/serviceAccountKey.json`
5. Restart the backend

#### Frontend (Firebase Client SDK):
1. Firebase Console → Project Settings → General → Your apps → Add web app
2. Copy the config object
3. Paste into `frontend/src/firebase/config.js` (replace the placeholder values)
4. Enable Authentication (Email/Password + Google) in Firebase Console
5. Create a Realtime Database (start in test mode)

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System health check |
| `/analyze-text` | POST | Analyze message for distress |
| `/decision` | POST | Generate 3 AI response actions |
| `/pose-alert` | POST | Trigger alert from camera |
| `/update-alert` | PUT | Update alert status |
| `/alerts` | GET | Get all alerts |
| `/timeline` | GET | Get all timeline events |
| `/scenario/{type}` | POST | Trigger test scenario (fire/medical/threat) |

### Example API Call

```bash
curl -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"message": "Help! There is a fire on the 3rd floor!", "location": "Building A"}'
```

Response:
```json
{
  "distress_score": 91,
  "emergency_type": "fire",
  "severity": "critical",
  "confidence": 0.64,
  "alert_triggered": true,
  "vulnerability_flags": ["child"],
  "recommended_staff_role": "firefighter"
}
```

## 🎨 UI Design

- **Dark theme** with glassmorphism
- **Red = critical**, Orange = high, Yellow = medium, Green = low
- **Smooth animations** (slide-in, pulse, shake)
- **Real-time updates** (3-second polling / Firebase listener)
- **Inter font** from Google Fonts
- **Responsive layout** with sidebar collapse

## 🔄 System Flow

```
1. Guest submits message → Backend analyzes with Ollama/Fallback
2. If distress_score > 60 → Alert created in database
3. Dashboard polls/listens → Shows alert in real-time
4. AI generates 3 response actions automatically
5. Voice alert speaks the alert details
6. Alert appears on map with colored marker
7. Staff can ACK → RESPOND → RESOLVE
8. Everything logged in timeline
```

## 📝 License

Built for hackathon demonstration purposes. All AI processing runs locally.
