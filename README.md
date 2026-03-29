# Serenova 🌿
### Your Private Mental Health Companion

A voice-first mental health companion that runs **entirely on your device** — no cloud, no servers, no data ever leaves your phone or browser.

Built using the [RunAnywhere](https://runanywhere.ai) Web SDK.

---

## Why Serenova?

Mental health conversations require absolute privacy. With Serenova:

- 🔒 **Zero data transmission** — All AI inference runs locally via WebAssembly
- ⚡ **Instant responses** — No network latency; sub-100ms voice response start
- 📶 **Works offline** — After first model download, no internet needed
- 🎙 **Voice-first** — Speak naturally; Sera listens, understands, and responds with her voice

---

## Features

| Feature | Description |
|---|---|
| **Voice Companion** | Full STT → LLM → TTS pipeline running in-browser |
| **Mood Journal** | Auto-logged mood tracking from voice check-ins |
| **Breathing Exercises** | Box breathing, 4-7-8, and calm breathing with animated guides |
| **Soundscapes** | 8 ambient soundscapes for relaxation (rain, forest, ocean, fire, wind, crystal, lullaby, space) |
| **Relaxing Games** | Interactive calming activities (Zen Garden, Calm Pairs memory game, Color Mandalas, Ripple Pool) |
| **Affirmations** | Curated affirmations with culturally relevant content for Indian users |
| **Crisis Resources** | India-specific mental health helplines and support services |

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
│   ├── SoundscapePlayer.tsx  # Ambient soundscape player with 8 tracks
│   ├── RelaxingGames.tsx   # Interactive calming activities
│   │   ├── ZenGarden     # Sand drawing with audio feedback
│   ├── CalmPairs      # Memory matching game
│   ├── ColorMandalas   # Interactive mandala creation
│   └── RipplePool     # Water ripple effects
│   └── ResourcesPanel.tsx   # Affirmations, grounding, crisis help
├── hooks/
│   ├── useVoiceRecorder.ts  # AudioCapture wrapper hook
│   └── useRipple.ts        # Ripple effect for UI interactions
├── lib/
│   ├── runanywhere.ts       # SDK initialization & model loading
│   ├── storage.ts           # localStorage mood persistence
│   └── prompts.ts           # LLM system prompt for Sera
├── App.tsx                  # Root layout with full-page navigation
└── main.tsx                 # Entry point
```

---

## India-Specific Features

### Localized Resources
The app includes India-specific mental health resources:
- **iCall (TISS)** - 1800-209-4366 (24/7 helpline)
- **Vandrevala Foundation** - 1860-266-2345 (Free counseling)
- **Snehi Foundation** - 91-98216-27774 (Emotional support)
- **NIMHANS Helpline** - 080-26993201 (Premier institute)
- **Fortis Stress Helpline** - 91-8376804102 (Mental health support)
- **YourDOST** - Online counseling platform
- **Mpower** - Mental health awareness & support

### Cultural Adaptations
- Culturally relevant affirmations including lotus and banyan tree metaphors
- Localized crisis resource information
- Contextual messaging for Indian users

---

## Disclaimer

Serenova is a supportive companion tool, **not a medical device or licensed therapist**. It is not a substitute for professional mental health care. If you or someone you know is in crisis, please contact:

### Emergency Resources (India)
- **iCall (TISS)** - 1800-209-4366 (24/7 mental health helpline)
- **Vandrevala Foundation** - 1860-266-2345 (Free, confidential counseling)
- **Emergency Services** - 112 or your local emergency number

---

## Development Notes

### Code Quality
- All debug statements removed for production
- Unused variables and functions eliminated
- TypeScript strict mode enabled
- Component memoization for performance

### Browser Compatibility
- Chrome 120+ and Edge 120+ supported
- WebAudio API with proper fallback handling
- Responsive design for mobile and desktop

### Performance
- Lazy loading of AI models
- Optimized audio context management
- Efficient canvas rendering with requestAnimationFrame
- Minimal bundle size through tree shaking