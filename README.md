# ⚽ Soccer Agent AI — World Cup 2026 Content Machine

An autonomous AI agent that runs a faceless YouTube channel dedicated to viral soccer and World Cup 2026 content. Paste any video URL and it downloads, re-edits, scripts, and packages it professionally. Also runs an autonomous loop every 6 hours to discover, process, and queue viral soccer content.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python 3.8+
- yt-dlp (`pip install yt-dlp`)
- FFmpeg (`brew install ffmpeg` / `sudo apt install ffmpeg`)

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — add your API keys (all optional for basic use)
```

### 3. Start Backend
```bash
cd backend
npm start
# → http://localhost:5000
```

### 4. Start Frontend
```bash
cd frontend
npm start
# → http://localhost:3000
```

---

## 📁 Project Structure

```
soccer-agent/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + Socket.IO server
│   │   ├── routes/
│   │   │   ├── video.js           # /api/video/* — process pipeline
│   │   │   ├── agent.js           # /api/agent/* — autonomous agent
│   │   │   ├── metadata.js        # /api/metadata/* — YouTube metadata
│   │   │   ├── music.js           # /api/music/* — music library
│   │   │   └── status.js          # /api/status — system checks
│   │   └── services/
│   │       ├── VideoService.js    # yt-dlp download wrapper
│   │       ├── ScriptService.js   # AI script generation
│   │       ├── FFmpegService.js   # Video editing pipeline
│   │       ├── MetadataService.js # YouTube metadata generator
│   │       ├── MusicService.js    # Copyright-free music manager
│   │       ├── AgentService.js    # Autonomous agent logic
│   │       ├── AgentScheduler.js  # Cron scheduler (every 6h)
│   │       └── TrendService.js    # World Cup 2026 trend scanner
│   ├── downloads/                 # Raw downloaded videos
│   ├── output/                    # Processed job packages
│   ├── music/                     # Copyright-free music library
│   ├── logs/                      # Server logs
│   ├── .env.example               # Environment template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.js                 # Main app with tab navigation
    │   ├── components/
    │   │   └── Header.js          # Site header
    │   └── pages/
    │       ├── URLProcessor.js    # Main URL processing UI
    │       ├── AgentDashboard.js  # Autonomous agent control
    │       ├── MusicLibrary.js    # Music categories & download
    │       ├── JobHistory.js      # Past processed jobs
    │       └── SystemStatus.js    # System health & setup guide
    └── package.json
```

---

## 🎬 Features

### URL Processor
- Paste any video URL (YouTube, Twitter/X, Instagram, TikTok, Reddit)
- Downloads at best quality via yt-dlp
- AI-generated English script (hook → narrative → CTA)
- FFmpeg editing: captions, zoom, slow-mo, color grade, music
- YouTube Shorts (9:16, ≤60s) or Long-Form (16:9, 2-10min)
- Auto-generated title, description, 50 tags, thumbnail brief
- Download complete ZIP package

### Autonomous Agent
- Scans World Cup 2026 trends every 6 hours
- Scores topics: virality × evergreen value
- Full pipeline per cycle: download → script → edit → metadata
- Real-time Socket.IO progress updates
- Manual trigger available

### Music Library
- 6 mood categories mapped to content types
- Sources: YouTube Audio Library, Pixabay, Mixkit, Bensound
- Auto-selects mood based on content type
- Copyright-safe: CC0 for Shorts, YouTube Audio Library for long-form

---

## 🔑 API Keys (All Optional)

| Key | Purpose | Get It |
|-----|---------|--------|
| `OPENAI_API_KEY` | Best AI scripts | platform.openai.com |
| `ANTHROPIC_API_KEY` | Alternative AI | console.anthropic.com |
| `YOUTUBE_API_KEY` | Trend scanning | console.cloud.google.com |
| `YOUTUBE_CLIENT_ID/SECRET` | Auto-publish | console.cloud.google.com |

Without API keys, the system uses template-based scripts and curated trend topics.

---

## ⚖️ Copyright Strategy

- **Short-Form**: Max 40s per source clip + narration + effects = Fair Use
- **Long-Form**: Multiple clips + original commentary + YouTube Audio Library music
- **Every video** includes Fair Use disclaimer in description
- **Music**: CC0 sources for Shorts, YouTube Audio Library for monetized long-form

---

## 🏆 Content Categories

| Type | Music Mood | Strategy |
|------|-----------|---------|
| ⚽ Goals & Skills | Epic Orchestral | Tight 30-60s clip, slow-mo on peak |
| 🏆 World Cup 2026 | Anthemic | Publish within 2h of events |
| 🔴 Controversy | Dark Tension | VAR, red cards, drama |
| 💸 Transfer | Modern Trap | Publish within 3h |
| ⭐ Player Story | Emotional Piano | Deep-dive series |
| 🎯 Legendary Matches | Epic Orchestral | Evergreen content |
| 🔥 Rivalry | Dark Tension | El Clásico, Derby |
| 📊 Records | Emotional Piano | History & nostalgia |
