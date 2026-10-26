# School 13 — Roguelite Survival Engine

> **A 2D top-down survival game engine featuring zero-allocation object pooling, procedural Web Audio breakbeat synthesis, and reactive Gemini AI narrative integration.**

[![Live Demonstration](https://img.shields.io/badge/Live_Demo-Interactive_Canvas-E11D48?style=for-the-badge)](https://islomf2010-dot.github.io/school-13/)
[![Source Code](https://img.shields.io/badge/Source-GitHub-161B26?style=for-the-badge)](https://github.com/islomf2010-dot/school-13)

---

## Technical Overview

`School 13` is an in-browser action roguelite engine engineered to maintain a strict, stutter-free 60 FPS canvas loop under heavy projectile density. 

Rather than relying on generic game frameworks or allocating transient objects during frame loops, the runtime is built around pre-allocated memory pools, direct HTML5 Canvas 2D rasterization, and an entirely offline-capable procedural sound generator.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             GAME ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘
  INPUT & GESTURES
        │
        ▼
  FIXED TIMESTEP LOOP (60 Hz)
        │
        ├──► SPATIAL COLLISION PIPELINE (Obstacle & Hazard Projections)
        │
        ├──► ENTITY STATE & PROGRESSION (Weapons, Bosses, Meta-Upgrades)
        │
        ├──► ZERO-ALLOCATION OBJECT POOLS
        │      ├── Projectile Pool (Capacity: 420)
        │      ├── Particle Pool   (Capacity: 420)
        │      ├── Floor Decals    (Capacity: 110)
        │      └── Popups & Trailing Afterimages
        │
        ├──► PROCEDURAL WEB AUDIO SYNTHESIZER
        │      ├── Multi-channel Gain Bus (Master / Music / SFX)
        │      ├── 136 BPM Step Sequencer (Breakbeat / Kick / Snare Noise)
        │      └── Dynamic Biquad Filter (Lowpass modulation during Time-Stop)
        │
        └──► RENDERER (Offscreen Sprite Caching & Layered Canvas Composite)
```

---

## Core Systems & Implementation

### 1. Zero-Allocation Object Pools
To prevent Garbage Collection (GC) pauses during intense wave clears with hundreds of concurrent bullets and fragments, all transient entities reside in fixed-size typed arrays:
* **Projectiles:** Pre-allocated pool of 420 projectiles with recycled slots.
* **Particles:** 420 dynamic particle instances simulating shell ejections, sparks, and blood splatters.
* **Floor Decals:** 110 persistent ground impacts with FIFO eviction.
* **Afterimages:** 64 dash shadow frames for the Sandevistan and Shinobi ultimate mechanics.

### 2. Procedural Web Audio Synthesis Engine
`School 13` ships zero recorded music loops or sound files:
* **Audio Synthesis:** Operates a custom 136 BPM industrial breakbeat synthesizer running directly on the Web Audio API thread.
* **Dynamic Time Dilation:** When the *Sandevistan* ultimate is triggered, an automated `BiquadFilterNode` sweeps down to 320 Hz while playback rate decreases, producing an authentic cinematic time-stop resonance without pre-rendered audio assets.

### 3. Combat Mechanics & Boss Archetypes
* **Weapons:** Slingshot, Shotgun, Nailgun, Acid Projector, and Tesla Arc Cannon with branching fire patterns.
* **Ultimates:** 
  * *Sandevistan:* Chrono-implant freezing enemy velocity and accumulating kinetic projectile damage for a delayed burst release.
  * *Shadow Shinobi:* Instantaneous spatial teleportation behind high-threat targets with circular slash geometry.
  * *Sonic Bell:* High-radius omnidirectional knockback with stun state application.
* **Boss AI:** Distinct finite state machines for Vice Principal, PE Teacher, Chemical Experiment, and Principal archetypes.

### 4. Gemini AI Narrative Integration
Adaptive narrative layer utilizing the `@google/genai` SDK to dynamically generate contextual pre-boss taunts and post-battle debriefs reflecting current player weapon loadouts and survival times.

---

## Verification & Testing

The repository includes automated unit tests verifying combat rules and damage calculation determinism:

```bash
npm test           # Validates game rules, damage formulas, and state logic
npm run lint       # TypeScript strict type checking
```

---

## Local Development & Setup

### Prerequisites
* **Node.js:** `>= 20.0.0`
* **Package Manager:** `npm`

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/islomf2010-dot/school-13.git
cd school-13

# 2. Install dependencies
npm install

# 3. Configure environment (Optional for AI dialogs)
cp .env.example .env.local
# Add GEMINI_API_KEY if testing live AI generation

# 4. Start local development server
npm run dev        # http://localhost:3000
```

### Production Build
```bash
npm run build      # Produces optimized dist/ bundle
npm run preview    # Serves the production build locally
```

---

## Technical Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Renderer** | HTML5 Canvas 2D | High-throughput direct pixel rendering without WebGL overhead |
| **Runtime** | React 19 / TypeScript | UI overlay, modal dialogues, HUD telemetry |
| **Audio** | Web Audio API | Zero-asset procedural synth engine and reactive audio bus |
| **AI** | Google Gemini API (`@google/genai`) | Contextual in-game narrative generation |
| **Styling** | Tailwind CSS / Motion | HUD telemetry, weapon selection modals |
| **Build** | Vite 8 / Rollup | Native ES modules and optimized production bundle |

---

## Licence & Assets

All sound synthesis, game logic, and canvas rendering pipelines are custom implementations. Character and environment sprites are pre-rendered assets organized in `/public/assets/`.
