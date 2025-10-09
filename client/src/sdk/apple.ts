import { apiUrl } from '../config'

export async function initMusicKit(): Promise<MusicKit.MusicKitInstance> {
  // @ts-ignore
  const MusicKit = window.MusicKit as typeof window.MusicKit
  const devToken = await fetch(apiUrl('/api/apple/devtoken')).then(r => r.text())
  const music = await MusicKit.configure({
    developerToken: devToken,
    app: { name: 'Rhythm Starter', build: '1.0.0' }
  })
  await music.authorize()
  return music
}
