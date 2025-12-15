import { ref, computed } from 'vue'
import { useRafFn } from '@vueuse/core'

export function useGame() {
  const isPlaying = ref(false)
  const currentTime = ref(0) // in seconds
  const playbackSpeed = ref(1.0)
  const song = ref({
    notes: [], // { note: 60, time: 1.0, duration: 0.5 }
    bpm: 120
  })

  // Generate a random song for testing
  function generateTestSong() {
    const notes = []
    let time = 2.0
    for (let i = 0; i < 50; i++) {
      const note = 60 + Math.floor(Math.random() * 24) - 12 // C3 to C5 approx
      const duration = 0.5 + Math.random() * 0.5
      notes.push({
        note,
        time,
        duration,
        velocity: 0.8,
        hit: false
      })
      time += duration + Math.random() * 0.5
    }
    song.value.notes = notes
  }

  function loadSong(newSong) {
    song.value = newSong
    reset()
  }

  const score = ref(0)
  const combo = ref(0)
  const visibleHands = ref({ left: true, right: true })
  const isMetronomeEnabled = ref(true) // Default on

  const playbackIndex = ref(0)
  // Metronome State
  const nextClickTime = ref(0)
  const beatDuration = computed(() => 60 / (song.value.bpm || 120))
  
  // Callbacks
  const callbacks = {
    playReferenceNote: [],
    playClick: []
  }
  
  function on(event, fn) {
    if (!callbacks[event]) callbacks[event] = []
    callbacks[event].push(fn)
  }

  // Game Loop
  const { pause, resume } = useRafFn(({ delta }) => {
    if (!isPlaying.value) return
    
    const dt = (delta / 1000) * playbackSpeed.value
    currentTime.value += dt
    
    // Metronome Logic
    if (isMetronomeEnabled.value || currentTime.value < 0) {
       const effectiveBeatDuration = beatDuration.value
       
       if (currentTime.value >= nextClickTime.value) {
         // Trigger Click
         if (currentTime.value - nextClickTime.value < 0.1) {
            const beatIndex = Math.round(nextClickTime.value / effectiveBeatDuration)
            const isDownbeat = beatIndex % 4 === 0
            callbacks.playClick.forEach(fn => fn(isDownbeat))
         }
         
         nextClickTime.value += effectiveBeatDuration
       }
    }
    
    // Reference Playback (Only if time > 0)
    if (currentTime.value >= 0) {
      while (playbackIndex.value < song.value.notes.length) {
        const note = song.value.notes[playbackIndex.value]
        
        if (note.time <= currentTime.value) {
          const isVisible = (note.hand === 'left' && visibleHands.value.left) || 
                            (note.hand === 'right' && visibleHands.value.right) ||
                            (!note.hand)
                            
          if (isVisible) {
             callbacks.playReferenceNote.forEach(fn => fn(note))
          }
          
          playbackIndex.value++
        } else {
          break
        }
      }
    }
  })

  function checkHit(note) {
    if (!isPlaying.value) return

    const HIT_WINDOW = 0.15
    const now = currentTime.value
    
    const hitNoteIndex = song.value.notes.findIndex(n => {
      if (n.hand === 'left' && !visibleHands.value.left) return false
      if (n.hand === 'right' && !visibleHands.value.right) return false

      return n.note === note && Math.abs(n.time - now) <= HIT_WINDOW && !n.hit
    })

    if (hitNoteIndex !== -1) {
      song.value.notes[hitNoteIndex].hit = true
      score.value += 100 + (combo.value * 10)
      combo.value++
      return 'PERFECT'
    } else {
      combo.value = 0
      return 'MISS'
    }
  }

  function play() {
    if (!isPlaying.value) {
      if (currentTime.value === 0) {
        const bd = 60 / (song.value.bpm || 120)
        // 4 bars countdown (16 beats)
        currentTime.value = -(bd * 16)
        nextClickTime.value = currentTime.value
      }
      
      isPlaying.value = true
      resume()
    }
  }

  function pauseGame() {
    isPlaying.value = false
    pause()
  }

  function reset() {
    pauseGame()
    currentTime.value = 0
    score.value = 0
    combo.value = 0
    playbackIndex.value = 0
    nextClickTime.value = 0
    song.value.notes.forEach(n => n.hit = false)
  }

  return {
    isPlaying,
    currentTime,
    playbackSpeed,
    song,
    score,
    combo,
    visibleHands,
    isMetronomeEnabled,
    generateTestSong,
    loadSong,
    checkHit,
    play,
    pause: pauseGame,
    reset,
    on
  }
}