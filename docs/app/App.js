import React, { useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@18.3.1'
import ChartRenderer from './game/ChartRenderer.js'
import { makeDummyChart } from './game/dummyChart.js'
import { API_BASE, apiUrl } from './config.js'
import { createSpotifyPlayer, getSpotifyAccessToken } from './sdk/spotify.js'
import { initMusicKit } from './sdk/apple.js'

const SERVICE_SPOTIFY = 'spotify'
const SERVICE_APPLE = 'apple'

export default function App() {
  const [service, setService] = useState(null)
  const [spotifyReady, setSpotifyReady] = useState(false)
  const [appleReady, setAppleReady] = useState(false)
  const [timeMs, setTimeMs] = useState(0)
  const chart = useMemo(() => makeDummyChart(60000), [])

  const spPlayerRef = useRef(null)
  const spDeviceReadyRef = useRef(false)

  const musicRef = useRef(null)

  const connectSpotify = () => {
    window.location.href = apiUrl('/api/spotify/login')
  }

  const connectApple = async () => {
    try {
      musicRef.current = await initMusicKit()
      setAppleReady(true)
    } catch (err) {
      console.error(err)
      alert('Apple Music authorization failed. Check the console for details.')
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getSpotifyAccessToken()
        if (!token) return
        const player = await createSpotifyPlayer()
        if (cancelled) return
        spPlayerRef.current = player
        player.addListener('ready', async ({ device_id }) => {
          try {
            const refreshed = await getSpotifyAccessToken()
            await fetch('https://api.spotify.com/v1/me/player', {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${refreshed}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ device_ids: [device_id], play: false })
            })
            spDeviceReadyRef.current = true
            setSpotifyReady(true)
          } catch (err) {
            console.error('Failed to transfer playback', err)
          }
        })
        player.addListener('not_ready', () => {
          spDeviceReadyRef.current = false
        })
      } catch (err) {
        console.info('Spotify not yet authenticated', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let rafId
    const tick = () => {
      if (service === SERVICE_SPOTIFY && spPlayerRef.current) {
        spPlayerRef.current.getCurrentState().then(state => {
          if (state && !state.paused) {
            setTimeMs(state.position)
          }
        })
      } else if (service === SERVICE_APPLE && musicRef.current) {
        const playbackTime = musicRef.current.player.currentPlaybackTime * 1000
        if (!Number.isNaN(playbackTime)) {
          setTimeMs(playbackTime)
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [service])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [picks, setPicks] = useState([])

  async function searchSpotify(term) {
    try {
      const token = await getSpotifyAccessToken()
      const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      const items = (data.tracks?.items || []).map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        uri: track.uri
      }))
      setResults(items)
    } catch (err) {
      console.error('Spotify search failed', err)
      alert('Spotify search failed. Open the console for details.')
    }
  }

  async function searchApple(term) {
    if (!musicRef.current) return
    try {
      const res = await musicRef.current.api.search(term, { types: ['songs'], limit: 10 })
      const songs = res?.results?.songs?.data || []
      setResults(
        songs.map(song => ({
          id: song.id,
          title: song.attributes.name,
          artist: song.attributes.artistName
        }))
      )
    } catch (err) {
      console.error('Apple search failed', err)
      alert('Apple Music search failed. Open the console for details.')
    }
  }

  function addPick(item) {
    setPicks(prev => {
      if (prev.some(pick => pick.id === item.id) || prev.length >= 10) return prev
      return [...prev, item]
    })
  }

  function removePick(id) {
    setPicks(prev => prev.filter(pick => pick.id !== id))
  }

  async function playSelected(item) {
    if (service === SERVICE_SPOTIFY) {
      if (!spDeviceReadyRef.current) {
        alert('Spotify device not ready yet. Wait a second and try again.')
        return
      }
      try {
        const token = await getSpotifyAccessToken()
        await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [item.uri] })
        })
        setService(SERVICE_SPOTIFY)
      } catch (err) {
        console.error('Failed to start Spotify playback', err)
        alert('Could not start Spotify playback. See console for details.')
      }
    } else if (service === SERVICE_APPLE && musicRef.current) {
      try {
        await musicRef.current.setQueue({ songs: [item.id] })
        await musicRef.current.play()
        setService(SERVICE_APPLE)
      } catch (err) {
        console.error('Failed to start Apple playback', err)
        alert('Could not start Apple Music playback. See console for details.')
      }
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return
    if (service === SERVICE_SPOTIFY) {
      searchSpotify(query)
    } else if (service === SERVICE_APPLE) {
      searchApple(query)
    }
  }

  return (
    React.createElement('div', { style: styles.container },
      React.createElement('h1', null, 'Rhythm Starter'),
      React.createElement('p', null, 'Connect Spotify or Apple Music, pick up to 10 songs, and play one to drive the dummy chart.'),
      React.createElement('p', { style: styles.configHint },
        'Current API base: ', API_BASE ? API_BASE : 'Using same-origin proxy (empty)'
      ),
      React.createElement('div', { style: styles.buttonRow },
        React.createElement('button', { onClick: connectSpotify, disabled: spotifyReady }, spotifyReady ? 'Spotify Connected' : 'Connect Spotify'),
        React.createElement('button', { onClick: connectApple, disabled: appleReady }, appleReady ? 'Apple Music Connected' : 'Connect Apple Music')
      ),
      React.createElement('div', { style: styles.radioRow },
        React.createElement('label', null,
          React.createElement('input', {
            type: 'radio',
            name: 'service',
            onChange: () => setService(SERVICE_SPOTIFY),
            checked: service === SERVICE_SPOTIFY
          }),
          ' Spotify'
        ),
        React.createElement('label', null,
          React.createElement('input', {
            type: 'radio',
            name: 'service',
            onChange: () => setService(SERVICE_APPLE),
            checked: service === SERVICE_APPLE
          }),
          ' Apple Music'
        )
      ),
      React.createElement('div', { style: styles.columns },
        React.createElement('div', null,
          React.createElement('h3', null, 'Search'),
          React.createElement('div', { style: styles.searchRow },
            React.createElement('input', {
              value: query,
              onChange: event => setQuery(event.target.value),
              placeholder: 'Search tracks',
              style: styles.searchInput
            }),
            React.createElement('button', { onClick: handleSearch, disabled: !service }, 'Search')
          ),
          React.createElement('ul', { style: styles.list },
            results.map(result => (
              React.createElement('li', { key: result.id, style: styles.listItem },
                React.createElement('span', null, `${result.title} — ${result.artist}`),
                React.createElement('button', {
                  onClick: () => addPick(result),
                  disabled: picks.some(pick => pick.id === result.id) || picks.length >= 10
                }, 'Add')
              )
            ))
          )
        ),
        React.createElement('div', null,
          React.createElement('h3', null, 'Picks (max 10)'),
          React.createElement('ul', { style: styles.list },
            picks.map(pick => (
              React.createElement('li', { key: pick.id, style: styles.listItem },
                React.createElement('span', null, `${pick.title} — ${pick.artist}`),
                React.createElement('span', { style: styles.pickButtons },
                  React.createElement('button', { onClick: () => playSelected(pick) }, 'Play'),
                  React.createElement('button', { onClick: () => removePick(pick.id) }, 'Remove')
                )
              )
            ))
          )
        )
      ),
      React.createElement('h3', { style: { marginTop: 24 } }, 'Chart'),
      React.createElement(ChartRenderer, { notes: chart, timeMs }),
      React.createElement('p', { style: styles.clockText }, `Clock source: ${service || '—'} — time = ${(timeMs / 1000).toFixed(2)}s`),
      React.createElement('details', { style: styles.helpBox },
        React.createElement('summary', null, 'Need a backend?'),
        React.createElement('p', null, 'Deploy the Express server (server/index.js) to a Node-friendly host. Set CLIENT_ORIGIN to your GitHub Pages URL and make sure CORS allows credentials.'),
        React.createElement('p', null, 'Then edit docs/index.html (APP_CONFIG.apiBase) or create docs/app/config.runtime.js to point the static client to your backend.')
      )
    )
  )
}

const styles = {
  container: {
    fontFamily: 'Inter, system-ui, sans-serif',
    maxWidth: 980,
    margin: '24px auto',
    padding: 16
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12
  },
  radioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '12px 0'
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16
  },
  searchRow: {
    display: 'flex',
    gap: 8
  },
  searchInput: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #cbd5f5'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    background: '#f8fafc',
    color: '#0f172a',
    padding: '8px 12px',
    borderRadius: 8
  },
  pickButtons: {
    display: 'flex',
    gap: 8
  },
  clockText: {
    opacity: 0.7
  },
  helpBox: {
    marginTop: 24,
    background: '#e0f2fe',
    color: '#0f172a',
    padding: 12,
    borderRadius: 8
  },
  configHint: {
    background: '#f1f5f9',
    color: '#0f172a',
    padding: '8px 12px',
    borderRadius: 8,
    display: 'inline-block'
  }
}
