export function makeDummyChart(durationMs = 60000) {
  const notes = []
  for (let t = 0, i = 0; t < durationMs; t += 500, i += 1) {
    notes.push({ tMs: t, lane: i % 4 })
  }
  return notes
}
