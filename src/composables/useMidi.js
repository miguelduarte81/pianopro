import { ref, onMounted, onUnmounted } from 'vue'

export function useMidi() {
  const inputs = ref([])
  const outputs = ref([])
  const selectedInputId = ref(null)
  const isSupported = ref(false)
  const error = ref(null)
  
  // Reactive map of active notes: key=noteNumber, value={velocity, channel}
  const activeNotes = ref(new Map())

  // Event callbacks
  const callbacks = {
    noteOn: [],
    noteOff: []
  }

  function on(event, fn) {
    if (callbacks[event]) callbacks[event].push(fn)
  }

  function off(event, fn) {
    if (callbacks[event]) {
      const index = callbacks[event].indexOf(fn)
      if (index > -1) callbacks[event].splice(index, 1)
    }
  }

  async function init() {
    if (!navigator.requestMIDIAccess) {
      error.value = "Web MIDI API not supported in this browser."
      return
    }

    try {
      const access = await navigator.requestMIDIAccess()
      isSupported.value = true
      
      updateDevices(access)
      
      access.onstatechange = (e) => {
        updateDevices(access)
      }
    } catch (e) {
      error.value = "MIDI Access Denied. Please allow MIDI access."
      console.error(e)
    }
  }

  function updateDevices(access) {
    inputs.value = Array.from(access.inputs.values())
    outputs.value = Array.from(access.outputs.values())
    
    // Auto-select first input if none selected and available
    if (inputs.value.length > 0 && !selectedInputId.value) {
      selectInput(inputs.value[0].id)
    }
  }

  function selectInput(id) {
    // Cleanup previous
    if (selectedInputId.value) {
      const prev = inputs.value.find(i => i.id === selectedInputId.value)
      if (prev) prev.onmidimessage = null
    }

    selectedInputId.value = id
    const input = inputs.value.find(i => i.id === id)
    if (input) {
      input.onmidimessage = handleMidiMessage
      console.log(`MIDI Input selected: ${input.name}`)
    }
  }

  function handleMidiMessage(event) {
    const [status, data1, data2] = event.data
    const command = status >> 4
    const channel = status & 0xf
    
    // Note On
    if (command === 9 && data2 > 0) {
      const note = { note: data1, velocity: data2, channel }
      activeNotes.value.set(data1, note)
      trigger('noteOn', note)
    }
    // Note Off (or Note On with velocity 0)
    else if (command === 8 || (command === 9 && data2 === 0)) {
      activeNotes.value.delete(data1)
      trigger('noteOff', { note: data1, channel })
    }
  }

  function trigger(event, data) {
    if (callbacks[event]) {
      callbacks[event].forEach(fn => fn(data))
    }
  }

  onMounted(init)

  return {
    inputs,
    outputs,
    selectedInputId,
    isSupported,
    error,
    activeNotes,
    selectInput,
    on,
    off
  }
}
