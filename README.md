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
   cp client/.env.example client/.env # optional: only needed if pointing at a remote backend
   ```

3. **Run the development servers**
   ```bash
   pnpm dev
   ```

   This runs both the Express backend (port 5174) and the Vite dev server (port 5173). The client proxies `/api/*` requests to the backend.

4. **Open the client**
Visit the URL printed by Vite (typically http://localhost:5173) and connect to your preferred service.

> **Heads up:** GitHub Pages no longer hosts a playable build for this project. The static root `index.html` simply points you
> back to these setup instructions. Use the local development workflow above to run the app.

## Can this run on GitHub Pages?

Yes — the repository now ships with an unbundled React build inside `docs/` so GitHub Pages can serve the playable UI. Because
Pages is static-only you still need to deploy the Express backend elsewhere, but once that is online you can point the hosted
client at it with a single config change.

1. **Deploy the backend.** Host `server/index.js` on a Node-friendly platform (Render, Railway, Fly.io, etc.). Set
   `CLIENT_ORIGIN` in the server `.env` to your Pages URL (for example `https://<user>.github.io/NotTapTap`).
2. **Allow credentials in CORS.** The Express app already sends `credentials: true` so make sure your platform honours cookies
   and HTTPS. Spotify OAuth requires them.
3. **Update the Pages config.** Open `docs/index.html` and set `window.APP_CONFIG.apiBase` to your deployed backend origin
   (without a trailing slash). Commit and push the change.

With those steps complete, `https://<user>.github.io/NotTapTap/` will load the same rhythm UI as the local Vite build. The
standalone Pages bundle loads React, Spotify, and Apple Music SDKs straight from CDN to keep the deployment lightweight.

### Tweaking the static client

- Edit `docs/index.html` to change the `apiBase` string (no trailing slash). The default empty string keeps calls relative to the
  Pages origin so you can use a reverse proxy if desired.
- Optional: drop overrides into `docs/app/config.runtime.js` if you prefer to keep secrets out of Git history. For example:
  ```js
  window.APP_CONFIG = window.APP_CONFIG || {}
  window.APP_CONFIG.apiBase = 'https://your-backend.example'
  ```
- The unbundled build uses [`esm.sh`](https://esm.sh/) to load React/ReactDOM. If you need to pin versions, update the URLs in
  `docs/app/*.js` accordingly.

## Notes

- Spotify playback requires a Premium account and the `streaming` scope. Playback occurs on the local browser device registered through the Web Playback SDK.
- Apple Music playback requires a valid developer token (JWT) created from your team ID, key ID, and private key. The provided endpoint `/api/apple/devtoken` issues a token valid for 150 days.
- The rhythm chart is a placeholder pattern cycling through four lanes. Extend `src/game` to load beatmaps or generate charts from audio analysis for real gameplay.
- Implement latency calibration, scoring, and note judgments to turn this prototype into a full rhythm game experience.
