import { apiUrl } from '../config.js'

async function waitForMusicKit() {
  if (window.MusicKit) return window.MusicKit
  return new Promise(resolve => {
    document.addEventListener('musickitloaded', () => resolve(window.MusicKit), { once: true })
  })
}

export async function initMusicKit() {
  const MusicKit = await waitForMusicKit()
  const devToken = await fetch(apiUrl('/api/apple/devtoken')).then(r => r.text())
  const instance = await MusicKit.configure({
    developerToken: devToken,
    app: { name: 'Rhythm Starter', build: '1.0.0' }
  })
  await instance.authorize()
  return instance
}
