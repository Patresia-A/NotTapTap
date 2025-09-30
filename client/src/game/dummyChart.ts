export type Note = { tMs: number; lane: number }

export function makeDummyChart(durationMs = 30000): Note[] {
  const notes: Note[] = []
  for (let t = 0, i = 0; t < durationMs; t += 500, i++) {
    notes.push({ tMs: t, lane: i % 4 })
  }
  return notes
}
