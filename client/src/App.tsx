import React, { useEffect, useMemo, useRef, useState } from 'react'
import ChartRenderer from './game/ChartRenderer'
import { makeDummyChart } from './game/dummyChart'
import { createSpotifyPlayer, getSpotifyAccessToken } from './sdk/spotify'
import { initMusicKit } from './sdk/apple'
import { API_BASE, apiUrl } from './config'

type Service = 'spotify' | 'apple'

type Track = { id: string; title: string; artist: string; uri?: string }

export default function App() {
  const [service, setService] = useState<Service | null>(null)
  const [spotifyReady, setSpotifyReady] = useState(false)
  const [appleReady, setAppleReady] = useState(false)
  const [timeMs, setTimeMs] = useState(0)
  const chart = useMemo(() => makeDummyChart(60000), [])

  // Spotify state
  const spPlayerRef = useRef<any>(null)
  const spDeviceReadyRef = useRef(false)

  // Apple state
  const musicRef = useRef<MusicKit.MusicKitInstance | null>(null)

  // ====== AUTH BUTTON HANDLERS ======
  const connectSpotify = () => {
    window.location.href = apiUrl('/api/spotify/login')
  }
  const connectApple = async () => {
    try {
      musicRef.current = await initMusicKit()
      setAppleReady(true)
    } catch (e) {
      alert('Apple Music authorization failed')
    }
  }

  // ====== INIT SPOTIFY PLAYER ======
  useEffect(() => {
    ;(async () => {
      try {
        const token = await getSpotifyAccessToken()
        if (!token) return
        spPlayerRef.current = await createSpotifyPlayer()
        spPlayerRef.current.addListener('ready', async ({ device_id }: any) => {
          const t = await getSpotifyAccessToken()
          await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: [device_id], play: false })
          })
          spDeviceReadyRef.current = true
          setSpotifyReady(true)
        })
        spPlayerRef.current.addListener('not_ready', () => {
          spDeviceReadyRef.current = false
        })
      } catch {
        // User not authenticated yet; ignore
      }
    })()
  }, [])

  // ====== CLOCK TICK ======
  useEffect(() => {
    let raf: number
    const tick = async () => {
      if (service === 'spotify' && spPlayerRef.current) {
        const state = await spPlayerRef.current.getCurrentState()
        if (state && !state.paused) setTimeMs(state.position)
      } else if (service === 'apple' && musicRef.current) {
        const t = musicRef.current.player.currentPlaybackTime * 1000
        if (!isNaN(t)) setTimeMs(t)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [service])

  // ====== SEARCH UTILITIES ======
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [picks, setPicks] = useState<Track[]>([])

  async function searchSpotify(q: string) {
    const token = await getSpotifyAccessToken()
    const r = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json()
    const items = (j.tracks?.items || []).map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      uri: t.uri
    }))
    setResults(items)
  }

  async function searchApple(q: string) {
    if (!musicRef.current) return
    const res = await musicRef.current.api.search(q, { types: ['songs'], limit: 10 })
    const songs = res?.results?.songs?.data || []
    setResults(
      songs.map((s: any) => ({ id: s.id, title: s.attributes.name, artist: s.attributes.artistName }))
    )
  }

  function addPick(it: Track) {
    setPicks(prev => (prev.length >= 10 ? prev : [...prev, it]))
  }

  function removePick(id: string) {
    setPicks(prev => prev.filter(p => p.id !== id))
  }

  // ====== PLAY A SELECTED TRACK ======
  async function playSelected(it: Track) {
    if (service === 'spotify') {
      if (!spDeviceReadyRef.current) return alert('Spotify device not ready')
      const token = await getSpotifyAccessToken()
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [it.uri] })
      })
      setService('spotify')
    } else if (service === 'apple' && musicRef.current) {
      await musicRef.current.setQueue({ songs: [it.id] })
      await musicRef.current.play()
      setService('apple')
    }
  }

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        maxWidth: 980,
        margin: '24px auto',
        padding: 16
      }}
    >
      <h1>Rhythm Starter</h1>
      <p>
        Connect a service, search & pick up to 10 songs, then play one and watch the dummy chart sync to the SDK clock.
      </p>
      {API_BASE && (
        <p style={{ background: '#fff4ce', color: '#5f370e', padding: '8px 12px', borderRadius: 6 }}>
          Backend origin: <code>{API_BASE}</code>
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={connectSpotify} disabled={spotifyReady}>
          {spotifyReady ? 'Spotify Connected' : 'Connect Spotify'}
        </button>
        <button onClick={connectApple} disabled={appleReady}>
          {appleReady ? 'Apple Music Connected' : 'Connect Apple Music'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
        <label>
          <input type="radio" name="svc" onChange={() => setService('spotify')} checked={service === 'spotify'} /> Spotify
        </label>
        <label>
          <input type="radio" name="svc" onChange={() => setService('apple')} checked={service === 'apple'} /> Apple Music
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h3>Search</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tracks" style={{ flex: 1 }} />
            <button onClick={() => (service === 'spotify' ? searchSpotify(query) : searchApple(query))} disabled={!service}>
              Search
            </button>
          </div>
          <ul>
            {results.map(r => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  {r.title} — {r.artist}
                </span>
                <button onClick={() => addPick(r)} disabled={picks.some(p => p.id === r.id) || picks.length >= 10}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Picks (max 10)</h3>
          <ul>
            {picks.map(p => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  {p.title} — {p.artist}
                </span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => playSelected(p)}>Play</button>
                  <button onClick={() => removePick(p.id)}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Chart</h3>
      <ChartRenderer notes={chart} timeMs={timeMs} />
      <p style={{ opacity: 0.7 }}>
        Clock source: {service ? service : '—'} — time = {(timeMs / 1000).toFixed(2)}s
      </p>
    </div>
  )
}
