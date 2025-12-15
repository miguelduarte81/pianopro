import * as Tone from 'tone'
import { ref } from 'vue'

export function useAudio() {
  const isLoaded = ref(false)
  const isAudioStarted = ref(false)
  
  let sampler = null
  let reverb = null
  let clickSynth = null

  async function initAudio() {
    if (isAudioStarted.value) return

    await Tone.start()
    isAudioStarted.value = true
    
    reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.2
    }).toDestination()
    await reverb.generate()

    // Clicker Synth
    clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).toDestination()
    clickSynth.volume.value = -10 // Lower volume for click

    sampler = new Tone.Sampler({
      urls: {
        "A0": "A0.mp3",
        "C1": "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        "A1": "A1.mp3",
        "C2": "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        "A2": "A2.mp3",
        "C3": "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        "A3": "A3.mp3",
        "C4": "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3",
        "C5": "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        "A5": "A5.mp3",
        "C6": "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        "A6": "A6.mp3",
        "C7": "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        "A7": "A7.mp3",
        "C8": "C8.mp3"
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        isLoaded.value = true
        console.log("Piano samples loaded")
      }
    }).connect(reverb)
  }

  function playNote(midiNote, velocity = 127) {
    if (!sampler || !isLoaded.value) return
    const freq = Tone.Frequency(midiNote, "midi").toNote()
    const vel = velocity / 127
    sampler.triggerAttack(freq, Tone.now(), vel)
  }

  function playReferenceNote(midiNote) {
    if (!sampler || !isLoaded.value) return
    const freq = Tone.Frequency(midiNote, "midi").toNote()
    // Play softer for reference (velocity 0.3)
    sampler.triggerAttack(freq, Tone.now(), 0.3)
    // Auto release after a short duration if we don't track duration? 
    // Actually, triggerAttackRelease might be better if we know duration, 
    // but for now let's just triggerAttack and let it ring or use triggerAttackRelease if we pass duration.
  }
  
  function playReferenceNoteWithDuration(midiNote, duration) {
    if (!sampler || !isLoaded.value) return
    const freq = Tone.Frequency(midiNote, "midi").toNote()
    sampler.triggerAttackRelease(freq, duration, Tone.now(), 0.3)
  }

  function stopNote(midiNote) {
    if (!sampler || !isLoaded.value) return
    const freq = Tone.Frequency(midiNote, "midi").toNote()
    sampler.triggerRelease(freq, Tone.now())
  }

  function playClick(high = false) {
    if (!clickSynth || !isAudioStarted.value) return
    // High click for downbeat (measure start), low for others
    // For now just one sound or slightly different pitch
    const note = high ? 'C5' : 'C4'
    clickSynth.triggerAttackRelease(note, '32n', Tone.now())
  }

  return {
    initAudio,
    isLoaded,
    isAudioStarted,
    playNote,
    playReferenceNote,
    playReferenceNoteWithDuration,
    stopNote,
    playClick
  }
}
