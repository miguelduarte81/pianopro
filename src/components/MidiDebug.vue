<script setup>
import { watch } from 'vue'
import { useMidi } from '../composables/useMidi'
import { useAudio } from '../composables/useAudio'

const { inputs, selectedInputId, activeNotes, selectInput, error, isSupported, on, off } = useMidi()
const { initAudio, isLoaded, isAudioStarted, playNote, stopNote } = useAudio()

// Connect MIDI events to Audio
on('noteOn', ({ note, velocity }) => {
  playNote(note, velocity)
})

on('noteOff', ({ note }) => {
  stopNote(note)
})
</script>

<template>
  <div class="p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-w-md w-full">
    <h2 class="text-xl font-bold mb-4 text-blue-400">MIDI Debugger</h2>
    
    <div v-if="error" class="bg-red-900/50 text-red-200 p-2 rounded mb-4">
      {{ error }}
    </div>

    <!-- Audio Controls -->
    <div class="mb-6 p-3 bg-gray-900 rounded border border-gray-600">
      <h3 class="text-sm font-medium text-gray-400 mb-2">Audio Engine</h3>
      <div class="flex items-center gap-4">
        <button 
          @click="initAudio"
          :disabled="isAudioStarted"
          class="px-4 py-2 rounded font-bold text-sm transition-colors"
          :class="isAudioStarted ? 'bg-green-600 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'"
        >
          {{ isAudioStarted ? 'Audio Active' : 'Start Audio' }}
        </button>
        <div class="text-xs text-gray-400">
          <span v-if="!isAudioStarted">Click to enable sound</span>
          <span v-else-if="!isLoaded">Loading samples...</span>
          <span v-else class="text-green-400">Samples Ready</span>
        </div>
      </div>
    </div>

    <div v-if="!isSupported" class="text-yellow-400 mb-4">
      Web MIDI is not supported or permission pending.
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-400 mb-1">Select Input Device</label>
      <select 
        :value="selectedInputId" 
        @change="e => selectInput(e.target.value)"
        class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
      >
        <option v-if="inputs.length === 0" value="">No devices found</option>
        <option v-for="input in inputs" :key="input.id" :value="input.id">
          {{ input.name }}
        </option>
      </select>
    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-400 mb-2">Active Notes</h3>
      <div class="flex flex-wrap gap-2 min-h-[50px] bg-gray-900 p-2 rounded border border-gray-600">
        <div 
          v-for="[note, data] in activeNotes" 
          :key="note"
          class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse"
        >
          {{ note }} <span class="text-blue-200 text-xs">v{{ data.velocity }}</span>
        </div>
        <div v-if="activeNotes.size === 0" class="text-gray-600 text-sm italic self-center">
          Play some keys...
        </div>
      </div>
    </div>
  </div>
</template>
