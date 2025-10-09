import { apiUrl } from '../config'

let sdkReadyResolve: () => void
export const spotifySDKReady = new Promise<void>(res => (sdkReadyResolve = res))

// @ts-ignore
window.onSpotifyWebPlaybackSDKReady = () => {
  sdkReadyResolve()
}

export async function getSpotifyAccessToken(): Promise<string> {
  const r = await fetch(apiUrl('/api/spotify/access_token'), { credentials: 'include' })
  if (!r.ok) throw new Error('Not authenticated with Spotify')
  const j = await r.json()
  return j.access_token
}

export async function createSpotifyPlayer() {
  await spotifySDKReady
  const token = await getSpotifyAccessToken()
  // @ts-ignore
  const player = new window.Spotify.Player({
    name: 'Rhythm Web Player',
    getOAuthToken: (cb: (t: string) => void) => cb(token)
  })
  await player.connect()
  return player
}
