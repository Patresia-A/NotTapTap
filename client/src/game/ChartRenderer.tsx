import React, { useEffect, useRef } from 'react'
import type { Note } from './dummyChart'

const LANE_COUNT = 4
const NOTE_SPEED_PX_PER_MS = 0.25

export default function ChartRenderer({ notes, timeMs }: { notes: Note[]; timeMs: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    const laneW = w / LANE_COUNT
    for (let l = 0; l < LANE_COUNT; l++) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)'
      ctx.fillRect(l * laneW, 0, laneW - 2, h)
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, h - 80, w, 4)

    ctx.fillStyle = '#333'
    for (const note of notes) {
      const dt = note.tMs - timeMs
      const y = h - 80 - dt * NOTE_SPEED_PX_PER_MS
      if (y < -30 || y > h) continue
      const x = note.lane * laneW + laneW * 0.2
      ctx.fillRect(x, y, laneW * 0.6, 14)
    }
  }, [notes, timeMs])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8 }}
    />
  )
}
