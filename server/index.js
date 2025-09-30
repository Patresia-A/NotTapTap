import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import * as jose from 'jose';

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ===== Apple Music Developer Token =====
app.get('/api/apple/devtoken', async (req, res) => {
  try {
    const privateKey = await jose.importPKCS8(process.env.APPLE_PRIVATE_KEY, 'ES256');
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })
      .setIssuer(process.env.APPLE_TEAM_ID)
      .setIssuedAt()
      .setExpirationTime('150d')
      .sign(privateKey);
    res.send(jwt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create Apple dev token' });
  }
});

// ===== Spotify OAuth (PKCE simplified to code+secret for local dev) =====
const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';

app.get('/api/spotify/login', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' '),
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: process.env.SPOTIFY_STATE_SECRET
  });
  res.redirect(`${SPOTIFY_AUTH}?${params.toString()}`);
});

app.get('/api/spotify/callback', async (req, res) => {
  const { code, state } = req.query;
  if (state !== process.env.SPOTIFY_STATE_SECRET) {
    return res.status(400).send('State mismatch');
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });
  const resp = await fetch(SPOTIFY_TOKEN, { method: 'POST', body });
  const data = await resp.json();
  if (!resp.ok) {
    console.error(data);
    return res.status(500).send('Token exchange failed');
  }
  res.cookie('sp_refresh', data.refresh_token, { httpOnly: true, sameSite: 'lax' });
  res.redirect(process.env.CLIENT_ORIGIN);
});

app.get('/api/spotify/access_token', async (req, res) => {
  const refresh = req.cookies.sp_refresh;
  if (!refresh) return res.status(401).json({ error: 'No refresh token' });
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });
  const resp = await fetch(SPOTIFY_TOKEN, { method: 'POST', body });
  const data = await resp.json();
  if (!resp.ok) return res.status(500).json({ error: 'Failed to refresh token' });
  res.json({ access_token: data.access_token });
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
