<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps({
  activeNotes: {
    type: Map,
    default: () => new Map()
  },
  fallingNotes: {
    type: Array,
    default: () => []
  },
  song: {
    type: Object,
    default: () => ({ notes: [] })
  },
  currentTime: {
    type: Number,
    default: 0
  },
  visibleHands: {
    type: Object,
    default: () => ({ left: true, right: true })
  }
})

const canvasRef = ref(null)
const containerRef = ref(null)
let ctx = null
let animationFrameId = null

// Configuration
const WHITE_KEY_WIDTH = 40
const BLACK_KEY_WIDTH = 24
const KEY_HEIGHT = 120
const NOTE_RANGE = { start: 21, end: 108 } // A0 to C8 (88 keys)
const PIXELS_PER_SECOND = 300

// State
const dimensions = ref({ width: 0, height: 0 })
const localActiveNotes = ref(new Set()) // Track locally pressed keys

useResizeObserver(containerRef, (entries) => {
  const entry = entries[0]
  const { width, height } = entry.contentRect
  dimensions.value = { width, height }
  if (canvasRef.value) {
    canvasRef.value.width = width
    canvasRef.value.height = height
  }
})

const emit = defineEmits(['noteOn', 'noteOff'])


function getNoteLabel(midiNote) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return notes[midiNote % 12]
}

function drawKeyboard() {
  if (!ctx) return
  const { width, height } = dimensions.value
  
  // Clear
  ctx.clearRect(0, 0, width, height)
  
  drawColumns()
  drawHitLine()
  
  const numWhiteKeys = 52
  const keyWidth = width / numWhiteKeys
  const blackKeyWidth = keyWidth * 0.6
  const keyHeight = height * 0.2
  const keyTop = height - keyHeight

  // Helper to get highlight color for a note
  const getHighlightColor = (note) => {
    // Check if this note is currently being hit by a falling bar
    // We can check activeNotes map, but we also want to know the HAND color
    // activeNotes stores { velocity, channel } but not hand...
    // We can infer hand from the song data if we have it, or just default to blue
    
    // Better approach: When we process falling notes, we can build a map of "active highlight colors"
    // But drawKeyboard runs BEFORE drawFallingNotes in the loop order? 
    // Actually, order matters. If we want bars BEHIND keyboard, draw bars first?
    // User said: "highlight the keyboard note with the same colour as the bar, while the bar is crossing the line."
    // So we need to know which notes are "crossing the line".
    
    // Let's check activeNotes first (MIDI input)
    if (props.activeNotes.has(note)) {
      // Default blue for input, or maybe match the hand if we could guess?
      return '#3b82f6'
    }
    return null
  }

  // Draw White Keys
  let x = 0
  for (let i = NOTE_RANGE.start; i <= NOTE_RANGE.end; i++) {
    const isBlack = isBlackKey(i)
    if (!isBlack) {
      // Check both MIDI active notes and local mouse/touch notes
      const isActive = props.activeNotes.has(i) || localActiveNotes.value.has(i)
      
      // Base key color
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, keyTop, keyWidth, keyHeight)
      
      // Active State (Inner Shadow / Gradient)
      if (isActive) {
        // Gradient
        const grad = ctx.createLinearGradient(x, keyTop, x, keyTop + keyHeight)
        grad.addColorStop(0, '#e5e7eb')
        grad.addColorStop(1, '#9ca3af')
        ctx.fillStyle = grad
        ctx.fillRect(x, keyTop, keyWidth, keyHeight)
        
        // Inner Shadow (simulated with border/overlay)
        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(x, keyTop, keyWidth, 5) // Top shadow
        ctx.fillRect(x, keyTop, 5, keyHeight) // Left shadow
      }
      
      // Border
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(x, keyTop, keyWidth, keyHeight)

      // Note Label
      ctx.fillStyle = isActive ? '#1f2937' : '#9ca3af' // Dark text if active
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(getNoteLabel(i), x + keyWidth / 2, height - 10)

      x += keyWidth
    }
  }

  // Draw Black Keys (overlay)
  x = 0
  for (let i = NOTE_RANGE.start; i <= NOTE_RANGE.end; i++) {
    const isBlack = isBlackKey(i)
    if (!isBlack) {
      x += keyWidth
    } else {
      const bkX = x - (blackKeyWidth / 2)
      const bkHeight = keyHeight * 0.65
      
      const isActive = props.activeNotes.has(i) || localActiveNotes.value.has(i)
      
      // Base black key
      ctx.fillStyle = '#1f2937'
      ctx.fillRect(bkX, keyTop, blackKeyWidth, bkHeight)
      
      if (isActive) {
        // Gradient for active black key
        const grad = ctx.createLinearGradient(bkX, keyTop, bkX, keyTop + bkHeight)
        grad.addColorStop(0, '#374151')
        grad.addColorStop(1, '#111827')
        ctx.fillStyle = grad
        ctx.fillRect(bkX, keyTop, blackKeyWidth, bkHeight)
        
        // Inner shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(bkX, keyTop, blackKeyWidth, 5)
      }
      
      // Border
      ctx.strokeStyle = '#000'
      ctx.strokeRect(bkX, keyTop, blackKeyWidth, bkHeight)
    }
  }
}

// Input Handling

function getKeyAtPosition(x, y) {
  const { width, height } = dimensions.value
  const keyHeight = height * 0.2
  const keyTop = height - keyHeight
  
  if (y < keyTop) return null

  const numWhiteKeys = 52
  const keyWidth = width / numWhiteKeys
  const blackKeyWidth = keyWidth * 0.6
  const bkHeight = keyHeight * 0.65

  // Check Black Keys First
  let wx = 0
  for (let i = NOTE_RANGE.start; i <= NOTE_RANGE.end; i++) {
    const isBlack = isBlackKey(i)
    if (!isBlack) {
      wx += keyWidth
    } else {
      const bkX = wx - (blackKeyWidth / 2)
      if (x >= bkX && x <= bkX + blackKeyWidth && y <= keyTop + bkHeight) {
        return i
      }
    }
  }

  // Check White Keys
  wx = 0
  for (let i = NOTE_RANGE.start; i <= NOTE_RANGE.end; i++) {
    if (!isBlackKey(i)) {
      if (x >= wx && x <= wx + keyWidth) {
        return i
      }
      wx += keyWidth
    }
  }
  return null
}

const activePointers = new Map() // pointerId -> note

function handlePointerDown(event) {
  event.preventDefault() // Prevent scrolling/selection
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const note = getKeyAtPosition(x, y)
  if (note !== null) {
    startNote(note)
    activePointers.set(event.pointerId, note)
    canvasRef.value.setPointerCapture(event.pointerId)
  }
}

function handlePointerMove(event) {
  if (!activePointers.has(event.pointerId)) return
  event.preventDefault()
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const note = getKeyAtPosition(x, y)
  const currentNote = activePointers.get(event.pointerId)
  
  if (note !== currentNote) {
    if (currentNote !== null) stopNote(currentNote)
    if (note !== null) {
      startNote(note)
      activePointers.set(event.pointerId, note)
    } else {
      activePointers.delete(event.pointerId)
    }
  }
}

function handlePointerUp(event) {
  event.preventDefault()
  const note = activePointers.get(event.pointerId)
  if (note !== undefined) {
    stopNote(note)
    activePointers.delete(event.pointerId)
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
}

function startNote(note) {
  if (!localActiveNotes.value.has(note)) {
    localActiveNotes.value.add(note)
    emit('noteOn', { note, velocity: 100 })
  }
}

function stopNote(note) {
  if (localActiveNotes.value.has(note)) {
    localActiveNotes.value.delete(note)
    emit('noteOff', { note })
  }
}

function isBlackKey(midiNote) {
  const n = midiNote % 12
  return [1, 3, 6, 8, 10].includes(n)
}

function render() {
  drawKeyboard()
  drawColumns()
  drawHitLine()
  drawFallingNotes()
  
  animationFrameId = requestAnimationFrame(render)
}

function drawHitLine() {
  if (!ctx) return
  const { width, height } = dimensions.value
  const keyHeight = height * 0.2
  const keyTop = height - keyHeight
  // Increase gap to 100px
  const hitLineY = keyTop - 100 
  
  // Draw glowing line
  ctx.beginPath()
  ctx.moveTo(0, hitLineY)
  ctx.lineTo(width, hitLineY)
  ctx.strokeStyle = '#60a5fa' // Blue-400
  ctx.lineWidth = 4
  ctx.shadowColor = '#3b82f6'
  ctx.shadowBlur = 15
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawColumns() {
  if (!ctx) return
  const { width, height } = dimensions.value
  const keyHeight = height * 0.2
  const keyTop = height - keyHeight
  const hitLineY = keyTop - 100
  
  const numWhiteKeys = 52
  const keyWidth = width / numWhiteKeys
  
  // Draw alternating columns
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
  
  for (let i = 0; i < numWhiteKeys; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * keyWidth, 0, keyWidth, hitLineY)
    }
  }
}

function drawFallingNotes() {
  if (!ctx) return
  const { width, height } = dimensions.value
  const keyHeight = height * 0.2
  const keyTop = height - keyHeight
  const hitLineY = keyTop - 100 
  
  // Draw Beat Lines first (behind notes)
  if (props.song.bpm) {
    const beatDuration = 60 / props.song.bpm
    const pixelsPerBeat = beatDuration * PIXELS_PER_SECOND
    
    // Find first visible beat
    // y = hitLineY - (time - currentTime) * PPS
    // Visible y range: 0 to hitLineY
    // 0 = hitLineY - (maxTime - currentTime) * PPS
    // (maxTime - currentTime) * PPS = hitLineY
    // maxTime = currentTime + hitLineY / PPS
    
    const maxVisibleTime = props.currentTime + (hitLineY / PIXELS_PER_SECOND)
    const minVisibleTime = props.currentTime // roughly
    
    // Align to beat grid
    // We want beats such that time % beatDuration == 0
    // startBeatTime = Math.ceil(minVisibleTime / beatDuration) * beatDuration
    
    // Actually we want to see beats coming from top (future)
    // So we iterate from currentTime up to maxVisibleTime
    
    const startBeat = Math.ceil(props.currentTime / beatDuration)
    const endBeat = Math.ceil(maxVisibleTime / beatDuration)
    
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    for (let i = startBeat; i <= endBeat; i++) {
      const beatTime = i * beatDuration
      const y = hitLineY - (beatTime - props.currentTime) * PIXELS_PER_SECOND
      
      if (y >= 0 && y <= hitLineY) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
    }
    ctx.stroke()
  }

  const numWhiteKeys = 52
  const keyWidth = width / numWhiteKeys
  const blackKeyWidth = keyWidth * 0.6
  
  // Filter visible notes
  // We want notes where (time - duration) < maxVisibleTime AND time > minVisibleTime
  // Actually, simpler: just draw all and let canvas clip, or optimize range.
  // For now, iterate all (optimization later if needed)
  
  props.song.notes.forEach(note => {
    // Check hand visibility
    if (note.hand === 'left' && !props.visibleHands.left) return
    if (note.hand === 'right' && !props.visibleHands.right) return
    
    // Calculate Y position
    const timeToHit = note.time - props.currentTime
    const yBottom = hitLineY - (timeToHit * PIXELS_PER_SECOND)
    const noteHeight = note.duration * PIXELS_PER_SECOND
    const yTop = yBottom - noteHeight
    
    // Geometry
    const geom = getKeyGeometry(note.note, width, height)
    if (!geom) return
    let { x, w } = geom
    
    // Determine Color
    let color = '#3b82f6' // Default Blue
    if (note.hand === 'left') color = '#3b82f6'
    if (note.hand === 'right') color = '#10b981'
    
    // --- HIT/MISS FEEDBACK ---
    
    // Check for HIT
    if (note.hit) {
      // transient effect time
      const timeSinceHit = props.currentTime - note.time
      if (timeSinceHit >= 0 && timeSinceHit < 0.5) { // Show for 0.5s
         const alpha = 1.0 - (timeSinceHit / 0.5)
         
         // Green Glow at Hit Line
         const centerX = x + w / 2
         const centerY = hitLineY
         
         ctx.globalAlpha = alpha
         const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 2)
         grad.addColorStop(0, 'rgba(34, 197, 94, 0.8)') // Green-500
         grad.addColorStop(1, 'rgba(34, 197, 94, 0)')
         
         ctx.fillStyle = grad
         ctx.beginPath()
         ctx.arc(centerX, centerY, w * 2, 0, Math.PI * 2)
         ctx.fill()
         
         // Sparkle/Core
         ctx.fillStyle = '#fff'
         ctx.beginPath()
         ctx.arc(centerX, centerY, w * 0.5, 0, Math.PI * 2)
         ctx.fill()
         
         ctx.globalAlpha = 1.0
      }
      // If hit, maybe fade the note bar more or hide it?
      // User didn't specify, but often hit notes disappear or turn transparent.
      // Let's keep it visible but maybe dim.
      ctx.globalAlpha = 0.2
    }
    
    // Check for MISS
    // Missed if passed hit line by > 0.2s and not hit
    else if (!note.hit && timeToHit < -0.2) {
       const timeSinceMiss = -(timeToHit + 0.2) // starts at 0
       if (timeSinceMiss >= 0 && timeSinceMiss < 0.5) {
         const alpha = 1.0 - (timeSinceMiss / 0.5)
         
         // Red Glow (Smaller)
         const centerX = x + w / 2
         const centerY = hitLineY
         
         ctx.globalAlpha = alpha
         const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 1.5)
         grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)') // Red-500
         grad.addColorStop(1, 'rgba(239, 68, 68, 0)')
         
         ctx.fillStyle = grad
         ctx.beginPath()
         ctx.arc(centerX, centerY, w * 1.5, 0, Math.PI * 2)
         ctx.fill()
         
         ctx.globalAlpha = 1.0
       }
       // Dim missed notes
       ctx.globalAlpha = 0.5 
    }
    
    // --- DRAW NOTE ---
    
    // Skip if off screen (allow some buffer)
    if (yBottom < -50 || yTop > keyTop) {
      ctx.globalAlpha = 1.0
      return
    }

    // Draw Note Tail (Bar)
    // Fade out if passing hit line
    // We can use a gradient for the whole bar if it crosses the line?
    // Or just fade the whole note if the head is past the line?
    // "make the notes fade out when they pass the hitting line"
    // This implies the part below the line should fade.
    
    const drawYTop = Math.max(0, yTop)
    const drawYBottom = Math.min(keyTop, yBottom) // Clip at keyboard top
    const drawHeight = drawYBottom - drawYTop
    
    if (drawHeight > 0) {
      // Create gradient if crossing hit line
      if (yBottom > hitLineY) {
        // We need to map the gradient stops to the note's position relative to the line
        // 0% -> Top of note (or hit line)
        // 100% -> Bottom of note
        
        // Simpler: Just fade out based on y position relative to gap?
        // Let's try a gradient from HitLineY to KeyTop
        
        const fadeStart = hitLineY
        const fadeEnd = keyTop
        
        const gradFill = ctx.createLinearGradient(0, fadeStart, 0, fadeEnd)
        gradFill.addColorStop(0, color)
        gradFill.addColorStop(1, 'rgba(0,0,0,0)') // Transparent
        
        // We need to apply this ONLY to the part below the line?
        // Or we can fill the rect with a color that is solid above and gradient below?
        // That's complex with a single fillRect.
        
        // Let's draw in two passes if needed, or just use the gradient for the whole thing if it's mostly below?
        // Actually, let's just use globalAlpha for the whole note if it's past the line?
        // No, that looks weird if it pops.
        
        // Let's draw the tail normally above the line, and with gradient below.
        
        // 1. Draw part above hit line
        if (yTop < hitLineY) {
           const hAbove = Math.min(yBottom, hitLineY) - yTop
           if (hAbove > 0) {
             // Easier: Draw the whole rounded rect with a gradient that is solid color until hitLineY, then fades.
             const totalGrad = ctx.createLinearGradient(0, yTop, 0, yBottom)
             
             // Calculate stop position for hitLineY
             // pos = (hitLineY - yTop) / (yBottom - yTop)
             let stopPos = (hitLineY - yTop) / (yBottom - yTop)
             stopPos = Math.max(0, Math.min(1, stopPos))
             
             totalGrad.addColorStop(0, color)
             totalGrad.addColorStop(stopPos, color)
             totalGrad.addColorStop(1, 'rgba(0,0,0,0)') // Fade out at bottom
             
             ctx.fillStyle = totalGrad
             ctx.beginPath()
             ctx.roundRect(x + 1, drawYTop, w - 2, drawHeight, w / 2)
             ctx.fill()
           }
        } else {
           // Entirely below line (short note or late)
           // Fade from top to bottom?
           const grad = ctx.createLinearGradient(0, yTop, 0, yBottom)
           grad.addColorStop(0, color)
           grad.addColorStop(1, 'rgba(0,0,0,0)')
           ctx.fillStyle = grad
           ctx.beginPath()
           ctx.roundRect(x + 1, drawYTop, w - 2, drawHeight, w / 2)
           ctx.fill()
        }
      } else {
        // Normal draw (above line)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(x + 1, drawYTop, w - 2, drawHeight, w / 2)
        ctx.fill()
      }
    }
    
    // Draw Note Head (Circle)
    // Head is at yBottom.
    // Only draw if visible (above keyboard?)
    // If it passes hit line, it goes into the gap.
    // If it hits keyboard, it disappears?
    
    if (yBottom <= keyTop + (w/2) && yBottom >= -w) {
       // Fade head if below line?
       let headAlpha = 1.0
       // If hit, maybe hide head? Or keep it?
       // If missed, keep it.
       // The fade logic below hitLine is still valid.
       
       if (yBottom > hitLineY) {
         const distance = yBottom - hitLineY
         const maxDist = keyTop - hitLineY
         headAlpha = 1.0 - (distance / maxDist)
         headAlpha = Math.max(0, headAlpha)
       }
       
       // Apply global alpha from hit/miss status
       ctx.globalAlpha = ctx.globalAlpha * headAlpha
       
       ctx.fillStyle = color
       
       const radius = (w * 0.8) / 2
       const centerX = x + (w / 2)
       const centerY = yBottom - radius 
       
       if (centerY - radius < keyTop) {
         ctx.beginPath()
         ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
         ctx.fill()
         
         ctx.fillStyle = 'rgba(255,255,255,0.3)'
         ctx.beginPath()
         ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
         ctx.fill()
       }
    }
    
    // Highlight Keyboard Logic
    if (!note.hit && yBottom >= hitLineY && yTop <= hitLineY) {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.6
      // We need to draw on top of the keyboard.
      // Since this runs after drawKeyboard, we can just draw a rect over the key.
      
      // Note: keyHeight is defined at top of function
      ctx.fillRect(x, keyTop, w, keyHeight)
      
      // Add a glow effect at the bottom of the key?
      // Or maybe just the overlay is enough.
      
      // Also maybe a small flash at the hit line itself?
      // ctx.shadowColor = color
      // ctx.shadowBlur = 10
      // ctx.fillRect(x, hitLineY - 2, w, 4)
      // ctx.shadowBlur = 0
    }
    
    ctx.globalAlpha = 1.0
  })
}

function getKeyGeometry(note, width, height) {
  const numWhiteKeys = 52
  const keyWidth = width / numWhiteKeys
  const blackKeyWidth = keyWidth * 0.6
  
  let wx = 0
  for (let i = NOTE_RANGE.start; i <= NOTE_RANGE.end; i++) {
    const isBlack = isBlackKey(i)
    if (i === note) {
      if (!isBlack) {
        return { x: wx, w: keyWidth, isBlack: false }
      } else {
        return { x: wx - (blackKeyWidth / 2), w: blackKeyWidth, isBlack: true }
      }
    }
    if (!isBlack) wx += keyWidth
  }
  return null
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    render()
  }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative bg-gray-900 overflow-hidden">
    <canvas 
      ref="canvasRef" 
      class="block cursor-pointer touch-none"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerUp"
    ></canvas>
  </div>
</template>
