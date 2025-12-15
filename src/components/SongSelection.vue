<script setup>
import { ref, computed } from 'vue'
import { songs } from '../data/songs'

defineEmits(['selectSong'])

const searchQuery = ref('')
const selectedCategory = ref('All')
const selectedLevel = ref('All')

// Extract unique categories and levels
const categories = ['All', ...new Set(songs.map(s => s.category).filter(Boolean))]
const levels = ['All', 'Easy', 'Medium', 'Hard']

const filteredSongs = computed(() => {
  return songs.filter(song => {
    // Search Filter
    const query = searchQuery.value.toLowerCase()
    const matchesSearch = song.title.toLowerCase().includes(query) || 
                          song.author.toLowerCase().includes(query)
    
    // Category Filter
    const matchesCategory = selectedCategory.value === 'All' || song.category === selectedCategory.value
    
    // Level Filter
    const matchesLevel = selectedLevel.value === 'All' || song.level === selectedLevel.value
    
    return matchesSearch && matchesCategory && matchesLevel
  }).sort((a, b) => a.title.localeCompare(b.title))
})
</script>

<template>
  <div class="w-full h-full bg-gray-900 text-white overflow-y-auto">
    <div class="max-w-7xl mx-auto px-8 pb-8 pt-6">
      <!-- Sticky Header: Search & Filters -->
      <div class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md pb-6 pt-2 -mx-8 px-8 border-b border-gray-800 mb-8 shadow-lg">
         <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Song Library
            </h1>
            
            <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
               <!-- Search -->
               <div class="flex flex-col gap-1.5 w-full sm:w-auto">
                 <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Search</label>
                 <div class="relative group">
                   <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                   </div>
                   <input 
                     v-model="searchQuery" 
                     type="text" 
                     placeholder="Search songs..." 
                     class="bg-gray-800 text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-64 transition-all"
                   >
                 </div>
               </div>
               
               <!-- Filters -->
               <div class="flex gap-2 w-full sm:w-auto">
                 <div class="flex flex-col gap-1.5 flex-1 sm:flex-none">
                   <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                   <select 
                     v-model="selectedCategory"
                     class="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 outline-none cursor-pointer hover:bg-gray-750 transition-colors appearance-none"
                   >
                     <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                   </select>
                 </div>
                 
                 <div class="flex flex-col gap-1.5 flex-1 sm:flex-none">
                   <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Level</label>
                   <select 
                     v-model="selectedLevel"
                     class="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 outline-none cursor-pointer hover:bg-gray-750 transition-colors appearance-none"
                   >
                     <option v-for="lvl in levels" :key="lvl" :value="lvl">{{ lvl }}</option>
                   </select>
                 </div>
               </div>
            </div>
         </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div 
          v-for="song in filteredSongs" 
          :key="song.id"
          class="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer group border border-gray-700 hover:border-blue-500 flex flex-col h-full"
          @click="$emit('selectSong', song)"
        >
          <!-- Image -->
          <div class="h-40 bg-gray-700 relative overflow-hidden">
            <img 
              :src="song.image" 
              :alt="song.title" 
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            >
            <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            
            <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
              :class="{
                'text-green-400': song.level === 'Easy',
                'text-yellow-400': song.level === 'Medium',
                'text-red-400': song.level === 'Hard'
              }"
            >
              {{ song.level }}
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 flex flex-col flex-1">
            <div class="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
              {{ song.category }}
            </div>
            <h3 class="text-lg font-bold text-white mb-1 leading-tight group-hover:text-blue-300 transition-colors">
              {{ song.title }}
            </h3>
            <p class="text-gray-400 text-sm">
              {{ song.author }}
            </p>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="filteredSongs.length === 0" class="col-span-full py-12 text-center text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <p class="text-xl font-medium">No songs found matching your search.</p>
           <button 
             @click="searchQuery = ''; selectedCategory = 'All'; selectedLevel = 'All'"
             class="mt-4 text-blue-400 hover:text-blue-300 underline"
           >
             Clear filters
           </button>
        </div>
      </div>
    </div>
  </div>
</template>
