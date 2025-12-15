<script setup>
import { ref } from 'vue'
import { useMidi } from './composables/useMidi'
import { useAudio } from './composables/useAudio'
import { useGame } from './composables/useGame'
import { parseMidiFile } from './utils/midiParser'
import PianoCanvas from './components/PianoCanvas.vue'
import MidiDebug from './components/MidiDebug.vue'
import SongSelection from './components/SongSelection.vue'

const { activeNotes, on, off } = useMidi()
const { initAudio, playNote, stopNote, isAudioStarted, playReferenceNote, playClick } = useAudio()
const { isPlaying, currentTime, song, score, combo, playbackSpeed, visibleHands, isMetronomeEnabled, generateTestSong, loadSong, checkHit, play, pause, reset, on: onGameEvent } = useGame()

const currentView = ref('menu') // 'menu' | 'game'

// Audio connection
on('noteOn', ({ note, velocity }) => {
  playNote(note, velocity)
  checkHit(note)
})
on('noteOff', ({ note }) => stopNote(note))

onGameEvent('playReferenceNote', (note) => {
  if (isAudioStarted.value) {
    playReferenceNote(note.note)
  }
})

onGameEvent('playClick', (isDownbeat) => {
  if (isAudioStarted.value) {
    playClick(isDownbeat)
  }
})

async function handleSongSelect(selectedSong) {
  if (!selectedSong.midiUrl) {
    alert("This song is a placeholder and doesn't have a MIDI file yet.")
    return
  }

  try {
    // Fetch the MIDI file
    const response = await fetch(selectedSong.midiUrl)
    const arrayBuffer = await response.arrayBuffer()
    const file = new File([arrayBuffer], selectedSong.title + '.mid')
    
    const parsedSong = await parseMidiFile(file)
    loadSong(parsedSong)
    
    // Switch to game view
    currentView.value = 'game'
    
    // Ensure audio is ready (user interaction happened on click)
    if (!isAudioStarted.value) {
      initAudio()
    }

    // Auto-start
    setTimeout(() => {
      play()
    }, 100)
  } catch (e) {
    console.error("Failed to load song", e)
    alert("Failed to load song")
  }
}

function goBackToMenu() {
  pause()
  currentView.value = 'menu'
}

// Ensure audio starts on interaction
function handleNoteTrigger({ note, velocity }) {
  if (!isAudioStarted.value) {
    initAudio()
  }
  playNote(note, velocity)
  checkHit(note)
}
</script>

<template>
  <div class="h-full w-full flex flex-col bg-gray-900 text-white overflow-hidden">
    
    <!-- Menu View -->
    <SongSelection 
      v-if="currentView === 'menu'"
      @selectSong="handleSongSelect"
    />

    <!-- Game View -->
    <div v-else class="h-full w-full flex flex-col relative">
      <!-- Header / Controls -->
      <!-- Header / Controls -->
      <!-- Header / Controls -->
      <div 
        class="absolute top-0 left-0 z-10 w-full flex items-center justify-between px-10 py-4 gap-5 pointer-events-none bg-gradient-to-b from-gray-900/90 to-transparent"
      >
        <!-- Left: Back & Logo -->
        <div class="pointer-events-auto flex items-center gap-6">
          <button 
            @click="goBackToMenu"
            class="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white/80 hover:text-white transition-colors border border-white/10 backdrop-blur"
            title="Back to Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <h1 class="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            PianoPro
          </h1>
        </div>

        <!-- Center: Score -->
        <div class="flex flex-col items-center pointer-events-none select-none">
          <div class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all">
            {{ score }}
          </div>
          <div v-if="combo > 1" class="text-sm font-bold text-yellow-400 animate-bounce tracking-wider">
            {{ combo }} COMBO!
          </div>
        </div>

        <!-- Right: Controls & Settings -->
        <div class="pointer-events-auto flex items-center gap-4">
          <!-- Play Buttons Group -->
          <div class="flex items-center gap-3 mr-2">
            <button 
              @click="isPlaying ? pause() : play()"
              class="p-3 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center border border-white/10 backdrop-blur"
              :class="isPlaying ? 'bg-yellow-500/90 hover:bg-yellow-400' : 'bg-green-500/90 hover:bg-green-400'"
              :title="isPlaying ? 'Pause' : 'Play'"
            >
              <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </button>

            <button 
              @click="reset"
              class="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur"
              title="Reset Song"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>
            </button>
          </div>

          <!-- Divider -->
          <div class="h-8 w-px bg-white/10"></div>

          <!-- Hand Toggles -->
          <div class="flex bg-gray-800/80 rounded-lg p-1 border border-white/10 backdrop-blur">
            <button 
              @click="visibleHands.left = !visibleHands.left"
              class="p-2 rounded transition-colors"
              :class="visibleHands.left ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'"
              title="Toggle Left Hand"
            >
              <!-- Flipped Icon for Left Hand (Thumb on Right) -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </button>
            <div class="w-px bg-white/10 mx-1"></div>
            <button 
              @click="visibleHands.right = !visibleHands.right"
              class="p-2 rounded transition-colors"
              :class="visibleHands.right ? 'bg-emerald-600/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'"
              title="Toggle Right Hand"
            >
              <!-- Standard Icon for Right Hand (Thumb on Left) -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </button>
          </div>

          <!-- Metronome -->
          <button 
            @click="isMetronomeEnabled = !isMetronomeEnabled"
            class="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors border border-white/10 backdrop-blur"
            :class="isMetronomeEnabled ? 'text-purple-400 border-purple-500/30' : 'text-gray-500'"
            title="Metronome"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><rect x="18" y="3" width="4" height="6" rx="2"/><path d="M19 12v6"/><rect x="5" y="10" width="14" height="4" rx="2" transform="rotate(-90 12 12)"/></svg>
          </button>

          <!-- Tempo Slider -->
          <div class="flex items-center gap-2 bg-gray-800/80 px-3 py-2 rounded-lg border border-white/10 backdrop-blur group hover:border-blue-500/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 group-hover:text-blue-400 transition-colors"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14 9.17 8.34"/></svg>
            <div class="w-24">
              <input 
                type="range" 
                min="0.1" 
                max="2.0" 
                step="0.1" 
                v-model.number="playbackSpeed"
                class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              >
            </div>
            <span class="text-xs font-mono text-gray-400 w-8 text-right">{{ Math.round(playbackSpeed * 100) }}%</span>
          </div>

          <!-- Debugger (Hidden) -->
          <!-- <MidiDebug class="opacity-90 hover:opacity-100 transition-opacity" /> -->
        </div>
      </div>

      <!-- Countdown Overlay -->
      <div 
        v-if="currentTime < 0 && Math.abs(currentTime) > (60 / (song.bpm || 120)) * 4 && isPlaying" 
        class="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
      >
        <!-- Logic: Total 16 beats. 
             Beats 16-9: Info 
             Beats 8-5: Countdown 4-3-2-1
             Beats 4-0: Overlay Hidden (v-if above handles this)
        -->
        <div class="mb-12">
            <div v-if="Math.ceil(Math.abs(currentTime) / (60 / (song.bpm || 120))) <= 8" class="text-[12rem] font-black text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-ping">
              {{ Math.ceil(Math.abs(currentTime) / (60 / (song.bpm || 120))) - 4 }}
            </div>
            <div v-else class="text-3xl text-gray-300 font-medium tracking-widest uppercase animate-pulse">
              Get Ready
            </div>
        </div>
        
        <div v-if="song.keySignature" class="flex flex-col items-center animate-fade-in-up">
           <div class="flex gap-12 mb-4 p-6 bg-gray-900/50 rounded-2xl border border-white/10 backdrop-blur-md">
             <div class="flex flex-col items-center min-w-[120px]">
               <div class="text-sm text-gray-400 font-bold tracking-widest uppercase mb-2">Key</div>
               <div class="text-6xl font-black text-yellow-400 drop-shadow-lg">
                 {{ song.keySignature.key }}<span class="text-2xl ml-1 text-yellow-500/80">{{ song.keySignature.scale === 'major' ? '' : 'm' }}</span>
               </div>
             </div>
             <div class="w-px bg-white/10"></div>
             <div class="flex flex-col items-center min-w-[120px]">
               <div class="text-sm text-gray-400 font-bold tracking-widest uppercase mb-2">Tempo</div>
               <div class="text-6xl font-black text-blue-400 drop-shadow-lg">
                 {{ Math.round(song.bpm) }}
               </div>
               <div class="text-xs text-gray-500 font-mono mt-1">BPM</div>
             </div>
           </div>
        </div>
        <div v-else class="text-3xl text-gray-300 font-medium tracking-wide animate-pulse">
          <!-- Fallback info -->
          <div class="flex flex-col items-center">
             <div class="text-xl text-gray-400 font-medium tracking-wider uppercase mb-1">Tempo</div>
             <div class="text-5xl font-bold text-blue-400 drop-shadow-lg">
               {{ Math.round(song.bpm || 120) }} <span class="text-2xl text-gray-400">BPM</span>
             </div>
          </div>
        </div>
      </div>

      <!-- Main Canvas Area -->
      <div class="flex-1 relative">
        <PianoCanvas 
          :activeNotes="activeNotes" 
          :song="song"
          :currentTime="currentTime"
          :visibleHands="visibleHands"
          @noteOn="handleNoteTrigger"
          @noteOff="({ note }) => stopNote(note)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
