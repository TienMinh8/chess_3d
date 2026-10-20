# Wizard Chess 3D — Gothic Sanctum Edition

An immersive 3D Gothic Cathedral Wizard Chess web application built with **React**, **Three.js**, and **Vite**.

## ✨ Features

- **3D Gothic Cathedral Environment**: Real-time atmospheric cathedral setting with dynamic candle lighting, stone arches, and high-fidelity 3D chess statue models.
- **Cinematic Camera System**:
  - Smooth diagonal panoramic home view with gentle ambient breathing drift.
  - Multi-angle in-game camera controls (Player View, Overhead Tactical, Dynamic Cinematic).
- **Physical Kick Combat Choreography**:
  - 3-phase combat sequence: Attacking piece approaches the adjacent tile $\rightarrow$ delivers a physical knock-back strike with golden shockwave sparks $\rightarrow$ defeated piece flies in a parabolic arc landing just outside the board perimeter $\rightarrow$ attacker advances to claim the tile.
- **Smart Chess AI**:
  - Built-in chess engine with check/checkmate detection.
  - Minimax AI with 3 distinct difficulty tiers:
    - **Tập Sự (Novice)** — Friendly introductory play.
    - **Pháp Sư (Mage)** — Balanced positional play.
    - **Đại Sư (Archmage)** — Deep tactical foresight.
- **Game Modes**:
  - Single Player vs AI (Choice of playing as White or Black).
  - Local 2-Player Pass & Play mode.
- **Web Audio Sound Effects**:
  - Procedural sound synthesis for piece slide, impact clash, kick knockout, floor bounce, check alert, victory chimes, and menu feedback without external audio assets.
- **Gothic Sanctum Design System**:
  - Antique brushed brass / muted gold primary controls.
  - Obsidian dark stone mode cards and clean utility bar.
  - Cinematic loading splash screen with rotating astrolabe and 8-point compass star emblem.

## 🛠️ Tech Stack

- **Frontend**: React 18
- **3D Graphics**: Three.js, GLTFLoader
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Audio**: Web Audio API

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TienMinh8/chess_3d.git
   cd chess_3d
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📜 License

MIT License.
