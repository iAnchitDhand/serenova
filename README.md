# Serenova 🌿
### Your Private Mental Health Companion

A voice-first mental health companion that runs **entirely on your device** — no cloud, no servers, no data ever leaves your phone or browser.

Built for HackXtreme using the [RunAnywhere](https://runanywhere.ai) Web SDK.

---

## Why Serenova?

Mental health conversations require absolute privacy. With Serenova:

- 🔒 **Zero data transmission** — All AI inference runs locally via WebAssembly
- ⚡ **Instant responses** — No network latency; sub-100ms voice response start
- 📶 **Works offline** — After the first model download, no internet needed
- 🎙 **Voice-first** — Speak naturally; Sera listens, understands, and responds with her voice

---

## Features

| Feature | Description |
|---|---|
| **Voice Companion** | Full STT → LLM → TTS pipeline running in-browser |
| **Mood Journal** | Auto-logged mood tracking from voice check-ins |
| **Breathing Exercises** | Box breathing, 4-7-8, and calm breathing with animated guides |
| **Affirmations** | Curated affirmations and grounding techniques |
| **Crisis Resources** | Direct links to 988, Crisis Text Line, and SAMHSA |

---

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **AI SDK:** RunAnywhere Web SDK (`@runanywhere/web`, `@runanywhere/web-llamacpp`, `@runanywhere/web-onnx`)
- **Models:**
  - **LLM:** LFM2 350M Q4_K_M (Liquid AI) — empathetic responses
  - **STT:** Whisper Tiny EN (OpenAI) — voice transcription
  - **TTS:** Piper TTS en_US-lessac-medium — natural voice synthesis
  - **VAD:** Silero VAD v5 — voice activity detection
- **Storage:** localStorage (mood history), OPFS (model files)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Chrome 120+ or Edge 120+ (required for WebAssembly + WebGPU)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/serenova
cd serenova

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

> **Important:** The app requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers for SharedArrayBuffer (multi-threaded WASM). These are configured in `vite.config.ts` automatically.

### First Run

1. Open `http://localhost:5173` in Chrome/Edge
2. Click **"Load AI Models & Begin"** — this downloads ~425MB of AI models to your browser's OPFS storage
3. Grant microphone permission when prompted
4. Tap the orb and speak to Sera

Models are cached permanently in your browser — you won't need to download them again.

---

## Build for Production

```bash
npm run build
npm run preview
```

For deployment, ensure your server sends these headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## Project Structure

```
src/
├── components/
│   ├── SetupScreen.tsx      # First-run model download UI
│   ├── VoiceCompanion.tsx   # Main voice chat interface
│   ├── VoiceOrb.tsx         # Animated recording button
│   ├── MoodHistory.tsx      # Mood journal & sparkline chart
│   ├── BreathingExercise.tsx# Animated breathing guides
│   └── ResourcesPanel.tsx   # Affirmations, grounding, crisis help
├── hooks/
│   └── useVoiceRecorder.ts  # AudioCapture wrapper hook
├── lib/
│   ├── runanywhere.ts       # SDK initialization & model loading
│   ├── storage.ts           # localStorage mood persistence
│   └── prompts.ts           # LLM system prompt for Sera
├── App.tsx                  # Root layout + navigation
└── main.tsx                 # Entry point
```

---

## Disclaimer

Serenova is a supportive companion tool, **not a medical device or licensed therapist**. It is not a substitute for professional mental health care. If you or someone you know is in crisis, please contact:

- **988 Suicide & Crisis Lifeline** — Call or text 988 (US)
- **Crisis Text Line** — Text HOME to 741741
- **Emergency services** — 911 or your local equivalent

---

## License

MIT © HackXtreme 2026