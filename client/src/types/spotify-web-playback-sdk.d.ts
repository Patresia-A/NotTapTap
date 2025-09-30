declare namespace Spotify {
  interface Error { message: string }

  interface PlayerInit { name: string; getOAuthToken(cb: (token: string) => void): void }

  interface PlaybackState {
    position: number
    paused: boolean
  }

  interface Player {
    connect(): Promise<boolean>
    getCurrentState(): Promise<PlaybackState | null>
    addListener(event: 'ready', cb: (payload: { device_id: string }) => void): void
    addListener(event: 'not_ready', cb: () => void): void
    addListener(event: string, cb: (...args: any[]) => void): void
  }
}

declare global {
  interface Window {
    Spotify: {
      Player: new (init: Spotify.PlayerInit) => Spotify.Player
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}
export {}
