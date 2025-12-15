import { Midi } from '@tonejs/midi'

export async function parseMidiFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const midi = new Midi(arrayBuffer)
  
  // Flatten tracks to a single list of notes
  // For now, we'll take all tracks or just the first one with notes
  // Ideally, we'd let the user select tracks, but let's merge all for simplicity
  
  const notes = []
  
  // Heuristic for Hand Detection
  // Strategy 1: Multiple Tracks
  // If we have exactly 2 tracks with significant notes, assume T1=Right, T2=Left (or vice versa based on pitch)
  
  const tracksWithNotes = midi.tracks.filter(t => t.notes.length > 0)
  
  if (tracksWithNotes.length >= 2) {
    // Calculate average pitch for each track to guess hand
    const trackStats = tracksWithNotes.map((track, index) => {
      const avgPitch = track.notes.reduce((sum, n) => sum + n.midi, 0) / track.notes.length
      return { index, avgPitch, track }
    })
    
    // Sort by pitch: Lower = Left, Higher = Right
    trackStats.sort((a, b) => a.avgPitch - b.avgPitch)
    
    // Assign hands
    // If more than 2 tracks, we might need a better heuristic, but let's split the lower half to Left and upper to Right
    const splitIndex = Math.floor(trackStats.length / 2)
    
    trackStats.forEach((stat, i) => {
      const hand = i < splitIndex ? 'left' : 'right'
      
      stat.track.notes.forEach(note => {
        notes.push({
          note: note.midi,
          time: note.time,
          duration: note.duration,
          velocity: note.velocity,
          hit: false,
          hand: hand
        })
      })
    })
  } else {
    // Strategy 2: Single Track -> Split by Pitch
    // Split point: Middle C (60)
    midi.tracks.forEach(track => {
      track.notes.forEach(note => {
        const hand = note.midi < 60 ? 'left' : 'right'
        notes.push({
          note: note.midi,
          time: note.time,
          duration: note.duration,
          velocity: note.velocity,
          hit: false,
          hand: hand
        })
      })
    })
  }
  
  // Sort by time
  notes.sort((a, b) => a.time - b.time)

  // Trim silence: Shift notes so the first note starts at 0
  // useful to ensure consistent count-in
  if (notes.length > 0) {
    const firstNoteTime = notes[0].time
    if (firstNoteTime > 0) {
      notes.forEach(n => n.time -= firstNoteTime)
    }
  }
  
  // Get BPM
  const bpm = (midi.header && midi.header.tempos && midi.header.tempos.length > 0) 
    ? midi.header.tempos[0].bpm 
    : 120

  // Get Key Signature
  const keySignature = (midi.header && midi.header.keySignatures && midi.header.keySignatures.length > 0)
    ? midi.header.keySignatures[0]
    : null

  return {
    name: midi.name || file.name,
    duration: midi.duration, // Note: Duration might need adjustment if we trimmed, but it's okay
    bpm,
    keySignature,
    notes
  }
}
