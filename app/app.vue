<template>
  <div class="w-screen h-screen flex flex-col items-center justify-center pb-8 select-none" style="background-color: #000000; font-family: ui-monospace, monospace;">
    
    <div class="absolute top-6 right-6 z-50" data-queue-button>
      <button
        @click.stop="showQueue = !showQueue"
        class="p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-95"
        style="background-color: #000000; border: 1px solid #333333;"
        :title="`${uploadedFiles.length} files in queue`"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #ffffff;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </button>

      <div v-if="showQueue" 
           class="absolute right-0 mt-3 w-[480px] animate-queue-open overflow-hidden"
           style="background-color: #000000; border: 1px solid #2a2a2a; border-radius: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);" 
           data-queue-popup>
        
        <div class="p-6 pb-2 flex items-center gap-2">
          <p class="text-[14px] font-bold tracking-tight text-white">processing queue</p>
        </div>
        
        <div v-if="uploadedFiles.length === 0" class="p-8 pt-4 flex flex-col items-center text-center">
          <div class="w-32 h-32 mb-4 opacity-80">
            <img
              src="https://rawr.hackclub.com/crying_dino.png"
              class="w-full h-full object-contain"
              alt="crying dinosaur"
            />
          </div>
          <p class="text-[12px] leading-5 text-gray-500">nothing here yet, just the two of us.<br/>try uploading something!</p>
        </div>

        <div v-else class="p-4 space-y-2 max-h-80 overflow-y-auto">
           <div v-for="(file, index) in uploadedFiles" :key="index" class="p-3 rounded-2xl" style="background-color: #111111; border: 1px solid #222222;">
             <div class="flex items-start gap-3">
               <div class="flex-shrink-0 pt-1">
                 <svg v-if="file.status === 'uploading'" class="w-4 h-4 animate-spin text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                 </svg>
                 <svg v-else-if="file.status === 'error'" class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                 </svg>
                 <svg v-else class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                 </svg>
               </div>
               <div class="flex-1 min-w-0">
                 <div class="flex items-center justify-between gap-2">
                   <a v-if="file.status === 'done'" :href="file.url" target="_blank" class="text-xs text-white truncate hover:underline">{{ file.name }}</a>
                   <span v-else class="text-xs" :style="{ color: file.status === 'error' ? '#dc2626' : '#ffffff' }">{{ file.name }}</span>
                   <span class="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                     {{ copiedIndex === index ? 'copied link' : file.status }}
                   </span>
                 </div>
                 <p class="text-[10px] mt-0.5 select-text" :style="{ color: file.status === 'error' ? '#ef4444' : '#808080' }">
                   <span v-if="file.status === 'error'">{{ file.error }}</span>
                   <span v-else>
                     {{ file.size }}
                     <span v-if="file.status === 'done'">
                       · <span class="text-gray-400 hover:text-white transition-colors cursor-pointer" @click="copyToClipboard(file.url, index)">{{ file.url }}</span>
                     </span>
                   </span>
                 </p>
                <div v-if="file.status === 'uploading'" class="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-white transition-all duration-300 animate-progress-bar" :style="{ width: `${file.progress}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="uploadedFiles.length > 0" class="p-4 pt-0">
          <button @click="uploadedFiles = []; showQueue = false" class="w-full text-[11px] font-bold py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
            clear queue
          </button>
        </div>
      </div>
    </div>

    <div class="animate-fade-in flex flex-col items-center gap-6 px-4 sm:gap-8">
      <div 
        class="w-64 h-40 sm:w-96 sm:h-48 border-[3px] border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300" 
        style="border-color: #333333; border-radius: 24px;"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @click="fileInput?.click()"
        :style="isDragging ? { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)' } : {}"
      >
        <input type="file" ref="fileInput" @change="handleFileSelect" class="hidden">
        <div class="flex justify-center mb-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </div>
        <p class="text-sm sm:text-lg font-bold text-white">drag or select files</p>
        <p class="text-[11px] sm:text-xs text-gray-500 mt-1">max 200mb files, no executables</p>
      </div>
      
      <div class="flex flex-col gap-3 w-80 sm:w-[560px]">
        <div class="relative input-wrapper">
          <svg 
            class="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors" 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
            :style="{ color: (isValidUrl || !urlInput) ? '#808080' : '#991b1b' }"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          <input 
            v-model="urlInput"
            ref="urlInputRef"
            type="text" 
            placeholder="paste the link here (or Ctrl+V to paste from clipboard)" 
            class="w-full pl-11 pr-4 py-3 bg-transparent border transition-all outline-none text-sm" 
            :style="{ 
              borderColor: (isValidUrl || !urlInput) ? '#333333' : '#dc2626',
              color: (isValidUrl || !urlInput) ? '#ffffff' : '#ef4444',
              borderRadius: '16px'
            }"
            @keyup.enter="uploadFromUrl"
            @paste.prevent="handlePaste"
          >
        </div>
        <div class="flex justify-end">
          <button 
            @click="uploadFromUrl"
            :disabled="isUploading || !isValidUrl"
            class="px-6 py-2 text-xs font-bold transition-all" 
            :style="{ 
              backgroundColor: (isUploading || !isValidUrl) ? '#111111' : '#ffffff', 
              color: (isUploading || !isValidUrl) ? '#444444' : '#000000', 
              borderRadius: '14px',
              opacity: (isUploading || !isValidUrl) ? 0.5 : 1,
              cursor: (isUploading || !isValidUrl) ? 'not-allowed' : 'pointer'
            }"
          >
            {{ isUploading ? 'uploading...' : 'upload' }}
          </button>
        </div>
      </div>
    </div>

    <p class="text-center text-[11px] text-gray-500 absolute bottom-8 px-8 max-w-xl leading-relaxed">
      i honestly don't care what you upload so i don't log anything about you. as long as it doesn't break the law, you are good!
    </p>
  </div>
</template>

<script setup lang="ts">
  const fileInput = ref<HTMLInputElement>();
  const urlInputRef = ref<HTMLInputElement>();
  const urlInput = ref('');
  const isUploading = ref(false);
  const isDragging = ref(false);
  const uploadedUrl = ref('');
  const uploadedFiles = ref<Array<{ url: string; name: string; size: string; progress?: number; status?: 'uploading' | 'done' | 'error'; error?: string }>>([]);
  const showQueue = ref(false);
  const copiedIndex = ref<number | null>(null);

  const isValidUrl = computed(() => {
    if (!urlInput.value.trim()) return false;
    try {
      new URL(urlInput.value);
      return true;
    } catch {
      return false;
    }
  });

  const copyToClipboard = async (url: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(url);
      if (index !== undefined) {
        copiedIndex.value = index;
        setTimeout(() => {
          copiedIndex.value = null;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDrop = (event: DragEvent) => {
    isDragging.value = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      uploadFile(input.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file?: File) => {
    if (!file) return;
    
    isUploading.value = true;
    uploadedUrl.value = '';
    
    const fileEntry = reactive({
      url: '',
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: 'uploading' as const,
    });
    uploadedFiles.value.unshift(fileEntry);
    showQueue.value = true;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progress: { loaded: number; total: number }) => {
          fileEntry.progress = Math.round((progress.loaded / progress.total) * 100);
        },
      });
      
      uploadedUrl.value = response as string;
      fileEntry.url = response as string;
      fileEntry.status = 'done';
      fileEntry.progress = 100;
    } catch (error: any) {
       fileEntry.status = 'error';
       fileEntry.error = error.data || error.message || 'Upload failed';
       fileEntry.progress = 0;
     } finally {
      isUploading.value = false;
      if (fileInput.value) fileInput.value.value = '';
    }
  };

  const uploadFromUrl = async () => {
    if (!urlInput.value.trim()) {
      return;
    }
    isUploading.value = true;
    try {
      const response = await fetch(urlInput.value);
      if (!response.ok) throw new Error('Failed to fetch from URL');
      const blob = await response.blob();
      const file = new File([blob], urlInput.value.split('/').pop() || 'file', { type: blob.type });
      await uploadFile(file);
      if (uploadedUrl.value) urlInput.value = '';
    } catch (error: any) {
      // this is a catch but the error will end up
      // being shown in the processing queue
    } finally {
      isUploading.value = false;
    }
  };

  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    // Check for files in clipboard (images, screenshots, etc)
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          uploadFile(file);
          return;
        }
      }
    }

    // Check for text (URLs)
    const text = event.clipboardData?.getData('text');
    if (text) {
      urlInput.value = text;
    }
  };

  const closeQueueOnClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (showQueue.value && !target.closest('[data-queue-button]') && !target.closest('[data-queue-popup]')) {
      showQueue.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('click', closeQueueOnClickOutside);
    urlInputRef.value?.focus();
  });
  onUnmounted(() => document.removeEventListener('click', closeQueueOnClickOutside));
</script>

<style scoped>
  @keyframes queueOpen {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-queue-open { animation: queueOpen 0.15s cubic-bezier(0, 0, 0.2, 1); }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in { animation: fadeIn 0.4s ease-out; }

  @keyframes progressBar {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
  .animate-progress-bar {
    background: linear-gradient(90deg, #ffffff, rgba(255,255,255,0.7), #ffffff);
    background-size: 200% 100%;
    animation: progressBar 1.5s ease-in-out infinite;
  }

  .input-wrapper:focus-within input {
    border-color: #ffffff !important;
  }
  .input-wrapper:focus-within svg {
    color: #ffffff !important;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
</style>