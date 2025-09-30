# Rhythm Starter

A tiny full-stack prototype that lets players connect their Spotify (Premium) or Apple Music account, select up to 10 songs, and play one of them while a dummy four-lane rhythm chart scrolls in sync with the service playback clock.

> ⚠️ Real credentials are required for playback SDKs. This repository only contains starter code — you must supply your own Spotify and Apple Music developer credentials.

## Features

- Spotify OAuth + Web Playback SDK integration via a Node/Express backend.
- Apple Music developer token generation and client-side authorization with MusicKit.
- Unified React UI to connect a service, search songs, queue up to 10 picks, and trigger playback.
- Canvas-based four-lane chart renderer driven by the authoritative playback time from each SDK.

## Project layout
```
/ (repo root)
  package.json (pnpm workspaces)
  /server
    package.json
    index.js
    .env.example
  /client
    package.json
    index.html
    src/main.tsx
    src/App.tsx
    src/sdk/spotify.ts
    src/sdk/apple.ts
    src/game/ChartRenderer.tsx
    src/game/dummyChart.ts
    vite.config.ts
```

## Getting started

1. **Install dependencies**
   ```bash
   npm i -g pnpm
   pnpm install
   ```

2. **Configure environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env and provide Spotify + Apple Music credentials
   ```

3. **Run the development servers**
   ```bash
   pnpm dev
   ```

   This runs both the Express backend (port 5174) and the Vite dev server (port 5173). The client proxies `/api/*` requests to the backend.

4. **Open the client**
   Visit the URL printed by Vite (typically http://localhost:5173) and connect to your preferred service.

## Notes

- Spotify playback requires a Premium account and the `streaming` scope. Playback occurs on the local browser device registered through the Web Playback SDK.
- Apple Music playback requires a valid developer token (JWT) created from your team ID, key ID, and private key. The provided endpoint `/api/apple/devtoken` issues a token valid for 150 days.
- The rhythm chart is a placeholder pattern cycling through four lanes. Extend `src/game` to load beatmaps or generate charts from audio analysis for real gameplay.
- Implement latency calibration, scoring, and note judgments to turn this prototype into a full rhythm game experience.
