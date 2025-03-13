<template>
  <div>
    <h1 class="text-h4 mb-4">Files</h1>
    
    <v-row>
      <v-col cols="12">
        <file-explorer
          :root-path="rootPath"
          @file-selected="handleFileSelected"
          @path-changed="handlePathChanged"
        />
      </v-col>
    </v-row>
    
    <!-- Selected File Information Panel -->
    <v-snackbar
      v-model="showFileInfo"
      :timeout="3000"
      color="info"
    >
      <div class="d-flex align-center">
        <div>
          <strong>{{ selectedFile?.name }}</strong>
          <div v-if="selectedFile">
            {{ formatFileSize(selectedFile.size) }} | {{ getFileType(selectedFile) }}
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          v-if="selectedFile && !selectedFile.isDirectory"
          variant="text"
          @click="useFileInChat"
        >
          Use in Chat
        </v-btn>
      </div>
    </v-snackbar>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FileExplorer from '../components/files/FileExplorer.vue';

export default {
  name: 'FilesView',
  components: {
    FileExplorer
  },
  setup() {
    const router = useRouter();
    const rootPath = ref('/');
    const selectedFile = ref(null);
    const showFileInfo = ref(false);
    const currentPath = ref('/');
    
    // Handle file selection from explorer
    const handleFileSelected = (file) => {
      selectedFile.value = file;
      showFileInfo.value = true;
    };
    
    // Handle path changes in the explorer
    const handlePathChanged = (path) => {
      currentPath.value = path;
    };
    
    // Format file size for display
    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Get human-readable file type
    const getFileType = (file) => {
      if (!file) return '';
      
      if (file.isDirectory) {
        return 'Directory';
      }
      
      if (file.type) {
        return file.type;
      }
      
      const name = file.name.toLowerCase();
      
      if (name.endsWith('.pdf')) {
        return 'PDF Document';
      } else if (name.endsWith('.doc') || name.endsWith('.docx')) {
        return 'Word Document';
      } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        return 'Excel Spreadsheet';
      } else if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
        return 'PowerPoint Presentation';
      } else if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif')) {
        return 'Image';
      } else if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac')) {
        return 'Audio File';
      } else if (name.endsWith('.mp4') || name.endsWith('.avi') || name.endsWith('.mov')) {
        return 'Video File';
      } else if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.gz')) {
        return 'Archive';
      } else if (name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.cpp') || name.endsWith('.php')) {
        return 'Source Code';
      } else if (name.endsWith('.txt')) {
        return 'Text File';
      } else if (name.endsWith('.md')) {
        return 'Markdown File';
      } else if (name.endsWith('.json')) {
        return 'JSON File';
      } else if (name.endsWith('.csv')) {
        return 'CSV File';
      } else {
        return 'Unknown File Type';
      }
    };
    
    // Use selected file in chat
    const useFileInChat = () => {
      if (!selectedFile.value || selectedFile.value.isDirectory) {
        return;
      }
      
      // Store the file path in localStorage to be used in the chat
      localStorage.setItem('chatAttachment', JSON.stringify({
        path: selectedFile.value.path,
        name: selectedFile.value.name,
        size: selectedFile.value.size,
        type: selectedFile.value.type || getFileType(selectedFile.value)
      }));
      
      // Navigate to chat view
      router.push({ 
        path: '/chat',
        query: { 
          useFile: selectedFile.value.path 
        }
      });
    };
    
    return {
      rootPath,
      selectedFile,
      showFileInfo,
      currentPath,
      handleFileSelected,
      handlePathChanged,
      formatFileSize,
      getFileType,
      useFileInChat
    };
  }
};
</script>

<style scoped>
/* No additional styles needed */
</style>