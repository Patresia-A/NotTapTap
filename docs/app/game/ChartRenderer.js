import React, { useEffect, useRef } from 'https://esm.sh/react@18.3.1'

const LANE_COUNT = 4
const NOTE_SPEED_PX_PER_MS = 0.25

export default function ChartRenderer({ notes, timeMs }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    const laneWidth = w / LANE_COUNT
    for (let lane = 0; lane < LANE_COUNT; lane += 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)'
      ctx.fillRect(lane * laneWidth, 0, laneWidth - 2, h)
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, h - 80, w, 4)

    ctx.fillStyle = '#333'
    for (const note of notes) {
      const dt = note.tMs - timeMs
      const y = h - 80 - dt * NOTE_SPEED_PX_PER_MS
      if (y < -30 || y > h) continue
      const x = note.lane * laneWidth + laneWidth * 0.2
      ctx.fillRect(x, y, laneWidth * 0.6, 14)
    }
  }, [notes, timeMs])

  return (
    React.createElement('canvas', {
      ref: canvasRef,
      width: 800,
      height: 600,
      style: { width: '100%', border: '1px solid #ddd', borderRadius: 8 }
    })
  )
}
