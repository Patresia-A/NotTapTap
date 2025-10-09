import { apiUrl } from '../config.js'

let sdkReadyResolve
export const spotifySDKReady = new Promise(resolve => {
  sdkReadyResolve = resolve
})

window.onSpotifyWebPlaybackSDKReady = () => {
  if (typeof sdkReadyResolve === 'function') {
    sdkReadyResolve()
  }
}

export async function getSpotifyAccessToken() {
  const response = await fetch(apiUrl('/api/spotify/access_token'), { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Not authenticated with Spotify')
  }
  const json = await response.json()
  return json.access_token
}

export async function createSpotifyPlayer() {
  await spotifySDKReady
  const initialToken = await getSpotifyAccessToken().catch(() => null)
  if (!initialToken) throw new Error('Spotify token missing')
  let cachedToken = initialToken
  const player = new window.Spotify.Player({
    name: 'Rhythm Web Player',
    getOAuthToken: cb => {
      if (cachedToken) {
        const tokenToUse = cachedToken
        cachedToken = null
        cb(tokenToUse)
        return
      }
      getSpotifyAccessToken()
        .then(token => cb(token))
        .catch(err => {
          console.error('Failed to refresh Spotify token', err)
        })
    }
  })
  await player.connect()
  return player
}
