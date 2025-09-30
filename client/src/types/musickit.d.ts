declare namespace MusicKit {
  interface MusicKitInstance {
    authorize(): Promise<string>
    setQueue(descriptor: { songs: string[] }): Promise<void>
    play(): Promise<void>
    api: {
      search(query: string, options: { types: string[]; limit: number }): Promise<any>
    }
    player: {
      currentPlaybackTime: number
    }
  }

  interface ConfigureOptions {
    developerToken: string
    app: { name: string; build: string }
  }

  interface MusicKitConstructor {
    configure(options: ConfigureOptions): Promise<MusicKitInstance>
  }
}

declare global {
  interface Window {
    MusicKit: MusicKit.MusicKitConstructor
  }
}
export {}
