<div align="center">

# 🛡️ SENTINEL

### AI Crisis Intelligence & Autonomous Response System

Real-time AI-powered crisis detection and response platform with local LLM,  
pose detection, multilingual support, and autonomous decision-making.

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Feature Highlights

| Feature | Description |
|:--------|:------------|
| 🆘 **Silent SOS Detection** | Analyzes messages for hidden distress signals (score 0–100) |
| 🌍 **Multilingual Interpreter** | Detects language, translates, and classifies emergency type |
| 🤖 **AI Decision Engine** | Generates exactly 3 response actions per alert via Ollama LLM |
| 📹 **Pose-Based Panic Detection** | MediaPipe detects running, falling, and panic movements in real time |
| 📊 **Live Command Dashboard** | Real-time alerts with color-coded severity and interactive map |
| 🗺️ **Incident Map** | Leaflet map with alert markers, fly-to, and dark tiles |
| 📝 **Timeline Logger** | Full event log: detected → decision → resolved |
| 🔊 **Voice Alerts** | Web Speech API auto-announces critical alerts |
| 🎯 **False Alarm Score** | Confidence percentage reduces noise from false positives |
| 🧠 **Context Memory** | Last 3 alerts passed to AI for smarter decisions |
| 🔥 **Severity Escalation** | Dynamic gauge with color gradient (green → red) |
| 🛡️ **Vulnerability Detection** | Flags child, elderly, injured, disabled, pregnant persons |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Guest Portal   │────▶│   FastAPI Server  │────▶│   Ollama LLM     │
│   (React + Vite) │     │   (Python)        │     │   (llama3)       │
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

---

## ⚙️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 4 |
| **Backend** | Python FastAPI + Uvicorn |
| **AI** | Ollama (local LLM, llama3) + Keyword Fallback |
| **Maps** | Leaflet + React-Leaflet (dark tiles) |
| **Vision** | MediaPipe Pose (browser, CDN) |
| **Voice** | Web Speech API |
| **Database** | Firebase RTDB / In-Memory fallback |
| **Auth** | Firebase Auth / Skip mode |

---

## 📦 Folder Structure

```
SENTINEL/
├── .env.example              # Environment variable template
├── LICENSE                    # MIT License
├── CONTRIBUTING.md            # Contribution guidelines
├── SECURITY.md                # Security policy
├── README.md
├── firebase.json              # Firebase Hosting config
│
├── backend/
│   ├── main.py                # FastAPI server (7 endpoints)
│   ├── models.py              # Pydantic request/response schemas
│   ├── ollama_client.py       # Ollama LLM + fallback engine
│   ├── firebase_client.py     # Firebase Admin + local store
│   └── requirements.txt       # Python dependencies
│
└── frontend/
    ├── index.html             # HTML entry + MediaPipe CDN
    ├── vite.config.js         # Vite + Tailwind + proxy
    ├── package.json           # NPM dependencies
    ├── public/
    │   └── sentinel-logo.svg  # App favicon
    └── src/
        ├── main.jsx           # React entry
        ├── App.jsx            # Router
        ├── index.css          # Dark theme + animations
        ├── firebase/
        │   └── config.js      # Firebase SDK config (via env vars)
        ├── hooks/
        │   ├── useAlerts.js   # Real-time alert listener
        │   └── useVoiceAlert.js # Web Speech API
        ├── utils/
        │   ├── localAnalyzer.js # Browser-side distress analyzer
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

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Required |
|:-----|:--------|:---------|
| **Node.js** | 18+ | ✅ Yes |
| **Python** | 3.9+ | ✅ Yes |
| **Ollama** | latest | ⚡ Optional (fallback works without it) |

### 1. Clone the Repository

```bash
git clone https://github.com/mirani9/Soln.git
cd Soln
```

### 2. Setup Environment Variables

```bash
# Copy the template
cp .env.example frontend/.env

# Edit frontend/.env and add your Firebase credentials
```

> [!NOTE]
> The system works **without Firebase** — it falls back to an in-memory store automatically.

### 3. Install & Start Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The server starts at `http://localhost:8000`:

```
SENTINEL API starting...
   Ollama: Not available (using fallback)
   Firebase: Not configured (using local store)
   Server ready at http://localhost:8000
```

### 4. Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

### 5. Open in Browser

| Page | URL |
|:-----|:----|
| 🆘 Guest Portal | http://localhost:5173/guest |
| 🛡️ Staff Dashboard | http://localhost:5173/dashboard |
| 📹 Camera Page | http://localhost:5173/camera |
| 📋 Incident Log | http://localhost:5173/incidents |

---

## 🔧 Optional Setup

### Enable Ollama (Local AI)

1. Install [Ollama](https://ollama.ai)
2. Pull the model:
   ```bash
   ollama pull llama3
   ```
3. Start Ollama server (runs on port 11434 by default)
4. Restart the backend — it will auto-detect Ollama

### Enable Firebase

<details>
<summary><strong>Backend (Firebase Admin SDK)</strong></summary>

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Project Settings → Service Accounts
3. Generate a new private key (JSON)
4. Save as `backend/serviceAccountKey.json`
5. Restart the backend

</details>

<details>
<summary><strong>Frontend (Firebase Client SDK)</strong></summary>

1. Firebase Console → Project Settings → General → Your apps → Add web app
2. Copy the config values
3. Paste into `frontend/.env` (see `.env.example` for the variable names)
4. Enable Authentication (Email/Password + Google) in Firebase Console
5. Create a Realtime Database (start in test mode)

</details>

---

## 📡 API Reference

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/health` | `GET` | System health check |
| `/analyze-text` | `POST` | Analyze message for distress |
| `/decision` | `POST` | Generate 3 AI response actions |
| `/pose-alert` | `POST` | Trigger alert from camera |
| `/update-alert` | `PUT` | Update alert status |
| `/alerts` | `GET` | Get all alerts |
| `/timeline` | `GET` | Get all timeline events |
| `/scenario/{type}` | `POST` | Trigger test scenario (`fire` / `medical` / `threat`) |

### Example

```bash
curl -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"message": "Help! There is a fire on the 3rd floor!", "location": "Building A"}'
```

<details>
<summary><strong>Response</strong></summary>

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

</details>

---

## 🎨 UI Design

- **Dark theme** with glassmorphism and indigo accents
- **Color-coded severity**: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low
- **Smooth animations**: slide-in, pulse, shake, gradient shift
- **Real-time updates**: 3-second polling / Firebase listener
- **Inter font** from Google Fonts
- **Responsive layout** with collapsible sidebar

---

## 🔄 System Flow

```
1. Guest submits message      →  Backend analyzes with Ollama / Fallback
2. distress_score > 60        →  Alert created in database
3. Dashboard polls / listens  →  Shows alert in real-time
4. AI generates 3 actions     →  Response actions auto-generated
5. Voice alert speaks         →  Critical alerts announced via TTS
6. Map updates                →  Colored marker at alert location
7. Staff responds             →  ACK → RESPOND → RESOLVE
8. Timeline logs everything   →  Full audit trail
```

---

## 🔒 Security

- All credentials are loaded from **environment variables** (`.env`)
- No API keys are hardcoded in source code
- Firebase service account keys are **gitignored**
- See [SECURITY.md](SECURITY.md) for the full security policy

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) first.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ for crisis response — All AI processing runs locally</sub>
</div>
