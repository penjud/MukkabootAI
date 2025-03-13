<template>
  <div class="file-explorer">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-folder-open</v-icon>
        File Explorer
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          icon="mdi-refresh"
          @click="refreshFiles"
          :loading="isLoading"
          title="Refresh"
        ></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pt-4">
        <!-- Breadcrumbs Navigation -->
        <v-breadcrumbs :items="breadcrumbs" class="px-0 pb-2">
          <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
          <template v-slot:title="{ item }">
            <a 
              href="#" 
              @click.prevent="navigateToPath(item.path)" 
              class="text-decoration-none"
            >
              {{ item.title }}
            </a>
          </template>
        </v-breadcrumbs>
        
        <!-- Actions Bar -->
        <div class="d-flex align-center mb-4">
          <v-btn
            prepend-icon="mdi-upload"
            variant="outlined"
            color="primary"
            size="small"
            class="mr-2"
            @click="showUploadDialog"
          >
            Upload
          </v-btn>
          
          <v-btn
            prepend-icon="mdi-folder-plus"
            variant="outlined"
            color="primary"
            size="small"
            class="mr-2"
            @click="showNewFolderDialog"
          >
            New Folder
          </v-btn>
          
          <v-spacer></v-spacer>
          
          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            variant="outlined"
            single-line
            style="max-width: 250px;"
            @update:model-value="filterFiles"
          ></v-text-field>
        </div>
        
        <!-- File List -->
        <div class="file-list">
          <v-list v-if="!isLoading && displayedFiles.length > 0">
            <v-list-item
              v-for="file in displayedFiles"
              :key="file.path"
              :title="file.name"
              :subtitle="file.isDirectory ? 'Directory' : formatFileSize(file.size)"
              @click="handleItemClick(file)"
            >
              <template v-slot:prepend>
                <v-icon :color="file.isDirectory ? 'amber-darken-2' : 'grey'">
                  {{ getIconForFile(file) }}
                </v-icon>
              </template>
              
              <template v-slot:append>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      v-bind="props"
                      @click.stop
                    ></v-btn>
                  </template>
                  
                  <v-list>
                    <v-list-item
                      v-if="!file.isDirectory"
                      prepend-icon="mdi-download"
                      title="Download"
                      @click="downloadFile(file)"
                    ></v-list-item>
                    <v-list-item
                      prepend-icon="mdi-pencil"
                      title="Rename"
                      @click="showRenameDialog(file)"
                    ></v-list-item>
                    <v-list-item
                      prepend-icon="mdi-content-copy"
                      title="Copy Path"
                      @click="copyPath(file)"
                    ></v-list-item>
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="Delete"
                      @click="showDeleteDialog(file)"
                      class="text-error"
                    ></v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
          </v-list>
          
          <div v-else-if="isLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2">Loading files...</div>
          </div>
          
          <div v-else class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-file-outline</v-icon>
            <div class="text-h6 mt-2">No files found</div>
            <div class="text-subtitle-1" v-if="searchQuery">
              No files match your search "{{ searchQuery }}"
            </div>
            <div class="text-subtitle-1" v-else>
              This folder is empty
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Upload Dialog -->
    <v-dialog v-model="uploadDialog" max-width="500px">
      <v-card>
        <v-card-title>Upload Files</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="filesToUpload"
            label="Select Files"
            multiple
            chips
            prepend-icon="mdi-file-upload"
            accept="*/*"
            :loading="isUploading"
          ></v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            text
            @click="uploadDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="primary"
            @click="uploadFiles"
            :loading="isUploading"
            :disabled="!filesToUpload || filesToUpload.length === 0"
          >
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- New Folder Dialog -->
    <v-dialog v-model="newFolderDialog" max-width="500px">
      <v-card>
        <v-card-title>Create New Folder</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newFolderName"
            label="Folder Name"
            prepend-inner-icon="mdi-folder"
            variant="outlined"
            :rules="[v => !!v || 'Folder name is required']"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            text
            @click="newFolderDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="primary"
            @click="createFolder"
            :disabled="!newFolderName"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Rename Dialog -->
    <v-dialog v-model="renameDialog" max-width="500px">
      <v-card>
        <v-card-title>Rename {{ selectedFile ? (selectedFile.isDirectory ? 'Folder' : 'File') : '' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newName"
            label="New Name"
            prepend-inner-icon="mdi-pencil"
            variant="outlined"
            :rules="[v => !!v || 'Name is required']"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            text
            @click="renameDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="primary"
            @click="renameItem"
            :disabled="!newName"
          >
            Rename
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete {{ selectedFile ? (selectedFile.isDirectory ? 'Folder' : 'File') : '' }}</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ selectedFile ? selectedFile.name : '' }}"?
          <div v-if="selectedFile && selectedFile.isDirectory" class="text-red mt-2">
            <v-icon>mdi-alert</v-icon>
            This will delete all files and subfolders inside this folder.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            text
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="error"
            @click="deleteItem"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- File Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="900px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          {{ selectedFile ? selectedFile.name : '' }}
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="previewDialog = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div v-if="isPreviewLoading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2">Loading preview...</div>
          </div>
          
          <div v-else-if="previewContent" class="file-preview">
            <!-- Image Preview -->
            <div v-if="isImageFile" class="text-center">
              <img :src="previewUrl" class="preview-image" alt="File Preview" />
            </div>
            
            <!-- Text Preview -->
            <div v-else-if="isTextFile" class="text-preview">
              <pre>{{ previewContent }}</pre>
            </div>
            
            <!-- PDF Preview -->
            <div v-else-if="isPdfFile" class="text-center">
              <iframe :src="previewUrl" width="100%" height="600" frameborder="0"></iframe>
            </div>
            
            <!-- Unsupported Format Message -->
            <div v-else class="text-center py-6">
              <v-icon size="64" color="grey-lighten-1">mdi-file-outline</v-icon>
              <div class="text-h6 mt-2">Preview not available</div>
              <div class="text-subtitle-1">
                This file type cannot be previewed. Please download the file to view it.
              </div>
              <v-btn
                color="primary"
                prepend-icon="mdi-download"
                class="mt-4"
                @click="downloadFile(selectedFile)"
              >
                Download
              </v-btn>
            </div>
          </div>
          
          <div v-else class="text-center py-6">
            <v-icon size="64" color="grey-lighten-1">mdi-file-outline</v-icon>
            <div class="text-h6 mt-2">Preview not available</div>
            <div class="text-subtitle-1">
              Unable to generate preview for this file.
            </div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-chip size="small" color="grey-lighten-1" class="mr-2">
            {{ selectedFile ? (selectedFile.isDirectory ? 'Directory' : formatFileSize(selectedFile.size)) : '' }}
          </v-chip>
          <v-chip size="small" color="grey-lighten-1" class="mr-2">
            {{ selectedFile ? selectedFile.type || 'Unknown type' : '' }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            v-if="selectedFile && !selectedFile.isDirectory"
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadFile(selectedFile)"
          >
            Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { FilesystemService } from '../../services';

export default {
  name: 'FileExplorer',
  props: {
    rootPath: {
      type: String,
      default: '/'
    },
    allowedExtensions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['file-selected', 'path-changed'],
  setup(props, { emit }) {
    // State variables
    const currentPath = ref(props.rootPath);
    const files = ref([]);
    const displayedFiles = ref([]);
    const isLoading = ref(false);
    const searchQuery = ref('');
    
    // Dialog controls
    const uploadDialog = ref(false);
    const newFolderDialog = ref(false);
    const renameDialog = ref(false);
    const deleteDialog = ref(false);
    const previewDialog = ref(false);
    
    // Form inputs
    const filesToUpload = ref([]);
    const newFolderName = ref('');
    const newName = ref('');
    const isUploading = ref(false);
    
    // Selected file and preview
    const selectedFile = ref(null);
    const previewContent = ref(null);
    const isPreviewLoading = ref(false);
    const previewUrl = ref('');
    
    // Computed properties
    const breadcrumbs = computed(() => {
      const parts = currentPath.value.split('/').filter(Boolean);
      const breadcrumbItems = [{ title: 'Root', path: '/' }];
      
      let path = '/';
      for (const part of parts) {
        path += part + '/';
        breadcrumbItems.push({ title: part, path });
      }
      
      return breadcrumbItems;
    });
    
    const isImageFile = computed(() => {
      if (!selectedFile.value) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      return imageExtensions.some(ext => selectedFile.value.name.toLowerCase().endsWith(ext));
    });
    
    const isTextFile = computed(() => {
      if (!selectedFile.value) return false;
      const textExtensions = ['.txt', '.md', '.json', '.js', '.py', '.html', '.css', '.csv', '.log', '.xml', '.yml', '.yaml'];
      return textExtensions.some(ext => selectedFile.value.name.toLowerCase().endsWith(ext));
    });
    
    const isPdfFile = computed(() => {
      if (!selectedFile.value) return false;
      return selectedFile.value.name.toLowerCase().endsWith('.pdf');
    });
    
    // Load files for the current path
    const loadFiles = async () => {
      isLoading.value = true;
      
      try {
        const response = await FilesystemService.listDirectory(currentPath.value);
        files.value = response.data.map(file => ({
          ...file,
          path: `${currentPath.value}${currentPath.value.endsWith('/') ? '' : '/'}${file.name}`
        }));
        
        // Sort directories first, then files alphabetically
        files.value.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        
        displayedFiles.value = [...files.value];
        
        // Emit the path changed event
        emit('path-changed', currentPath.value);
      } catch (error) {
        console.error('Error loading files:', error);
        // Add mock data for testing if needed
        loadMockFiles();
      } finally {
        isLoading.value = false;
      }
    };
    
    // Helper function to load mock files (for testing/development)
    const loadMockFiles = () => {
      files.value = [
        { name: 'Documents', isDirectory: true, path: `${currentPath.value}/Documents`, size: 0, type: 'directory' },
        { name: 'Images', isDirectory: true, path: `${currentPath.value}/Images`, size: 0, type: 'directory' },
        { name: 'report.pdf', isDirectory: false, path: `${currentPath.value}/report.pdf`, size: 1024 * 1024 * 2.5, type: 'application/pdf' },
        { name: 'data.csv', isDirectory: false, path: `${currentPath.value}/data.csv`, size: 1024 * 512, type: 'text/csv' },
        { name: 'notes.txt', isDirectory: false, path: `${currentPath.value}/notes.txt`, size: 1024 * 15, type: 'text/plain' }
      ];
      
      displayedFiles.value = [...files.value];
    };
    
    // Handle file/folder click
    const handleItemClick = (file) => {
      if (file.isDirectory) {
        // Navigate into the directory
        navigateToPath(file.path);
      } else {
        // Select the file and show preview
        selectedFile.value = file;
        showPreview(file);
        
        // Emit the file selected event
        emit('file-selected', file);
      }
    };
    
    // Navigate to a specific path
    const navigateToPath = (path) => {
      currentPath.value = path;
      searchQuery.value = '';
      loadFiles();
    };
    
    // Refresh the current directory
    const refreshFiles = () => {
      loadFiles();
    };
    
    // Filter files based on search query
    const filterFiles = () => {
      if (!searchQuery.value) {
        displayedFiles.value = [...files.value];
        return;
      }
      
      const query = searchQuery.value.toLowerCase();
      displayedFiles.value = files.value.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    };
    
    // Format file size for display
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Get appropriate icon for file type
    const getIconForFile = (file) => {
      if (file.isDirectory) {
        return 'mdi-folder';
      }
      
      const name = file.name.toLowerCase();
      
      if (name.endsWith('.pdf')) {
        return 'mdi-file-pdf-box';
      } else if (name.endsWith('.doc') || name.endsWith('.docx')) {
        return 'mdi-file-word-box';
      } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        return 'mdi-file-excel-box';
      } else if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
        return 'mdi-file-powerpoint-box';
      } else if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif')) {
        return 'mdi-file-image-box';
      } else if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac')) {
        return 'mdi-file-music-box';
      } else if (name.endsWith('.mp4') || name.endsWith('.avi') || name.endsWith('.mov')) {
        return 'mdi-file-video-box';
      } else if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.gz')) {
        return 'mdi-zip-box';
      } else if (name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.cpp') || name.endsWith('.php')) {
        return 'mdi-file-code-box';
      } else if (name.endsWith('.txt') || name.endsWith('.md')) {
        return 'mdi-file-text-box';
      } else {
        return 'mdi-file-outline';
      }
    };
    
    // Upload files to current directory
    const showUploadDialog = () => {
      filesToUpload.value = [];
      uploadDialog.value = true;
    };
    
    const uploadFiles = async () => {
      if (!filesToUpload.value || filesToUpload.value.length === 0) {
        return;
      }
      
      isUploading.value = true;
      
      try {
        const uploadPromises = filesToUpload.value.map(file => {
          const formData = new FormData();
          formData.append('file', file);
          
          return FilesystemService.uploadFile(currentPath.value, formData);
        });
        
        await Promise.all(uploadPromises);
        
        // Refresh the directory after upload
        loadFiles();
        uploadDialog.value = false;
      } catch (error) {
        console.error('Error uploading files:', error);
        // Show error notification
      } finally {
        isUploading.value = false;
      }
    };
    
    // Create new folder
    const showNewFolderDialog = () => {
      newFolderName.value = '';
      newFolderDialog.value = true;
    };
    
    const createFolder = async () => {
      if (!newFolderName.value) {
        return;
      }
      
      try {
        const folderPath = `${currentPath.value}${currentPath.value.endsWith('/') ? '' : '/'}${newFolderName.value}`;
        await FilesystemService.createDirectory(folderPath);
        
        // Refresh the directory
        loadFiles();
        newFolderDialog.value = false;
      } catch (error) {
        console.error('Error creating folder:', error);
        // Show error notification
      }
    };
    
    // Rename file or folder
    const showRenameDialog = (file) => {
      selectedFile.value = file;
      newName.value = file.name;
      renameDialog.value = true;
    };
    
    const renameItem = async () => {
      if (!newName.value || !selectedFile.value) {
        return;
      }
      
      try {
        const oldPath = selectedFile.value.path;
        const newPath = `${currentPath.value}${currentPath.value.endsWith('/') ? '' : '/'}${newName.value}`;
        
        await FilesystemService.moveFile(oldPath, newPath);
        
        // Refresh the directory
        loadFiles();
        renameDialog.value = false;
      } catch (error) {
        console.error('Error renaming item:', error);
        // Show error notification
      }
    };
    
    // Delete file or folder
    const showDeleteDialog = (file) => {
      selectedFile.value = file;
      deleteDialog.value = true;
    };
    
    const deleteItem = async () => {
      if (!selectedFile.value) {
        return;
      }
      
      try {
        await FilesystemService.deleteFile(selectedFile.value.path);
        
        // Refresh the directory
        loadFiles();
        deleteDialog.value = false;
      } catch (error) {
        console.error('Error deleting item:', error);
        // Show error notification
      }
    };
    
    // Download a file
    const downloadFile = (file) => {
      if (!file || file.isDirectory) {
        return;
      }
      
      FilesystemService.downloadFile(file.path)
        .then(response => {
          // Create a download link
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', file.name);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch(error => {
          console.error('Error downloading file:', error);
          // Show error notification
        });
    };
    
    // Copy file path to clipboard
    const copyPath = (file) => {
      navigator.clipboard.writeText(file.path)
        .then(() => {
          // Show success notification
          console.log('Path copied to clipboard:', file.path);
        })
        .catch(error => {
          console.error('Error copying path to clipboard:', error);
        });
    };
    
    // Show file preview
    const showPreview = async (file) => {
      if (!file || file.isDirectory) {
        return;
      }
      
      previewDialog.value = true;
      isPreviewLoading.value = true;
      previewContent.value = null;
      
      try {
        if (isImageFile.value || isPdfFile.value) {
          // For images and PDFs, set the URL directly
          previewUrl.value = `/api/filesystem/file?path=${encodeURIComponent(file.path)}`;
        } else if (isTextFile.value) {
          // For text files, load the content
          const response = await FilesystemService.getFileContent(file.path);
          previewContent.value = response.data;
        } else {
          // For other file types, set content to null
          previewContent.value = null;
        }
      } catch (error) {
        console.error('Error loading file preview:', error);
        previewContent.value = null;
      } finally {
        isPreviewLoading.value = false;
      }
    };
    
    // Load files when component is mounted
    onMounted(() => {
      loadFiles();
    });
    
    // Watch for changes to root path prop
    watch(() => props.rootPath, (newPath) => {
      if (newPath !== currentPath.value) {
        currentPath.value = newPath;
        loadFiles();
      }
    });
    
    return {
      currentPath,
      files,
      displayedFiles,
      isLoading,
      searchQuery,
      uploadDialog,
      newFolderDialog,
      renameDialog,
      deleteDialog,
      previewDialog,
      filesToUpload,
      newFolderName,
      newName,
      isUploading,
      selectedFile,
      previewContent,
      isPreviewLoading,
      previewUrl,
      breadcrumbs,
      isImageFile,
      isTextFile,
      isPdfFile,
      loadFiles,
      handleItemClick,
      navigateToPath,
      refreshFiles,
      filterFiles,
      formatFileSize,
      getIconForFile,
      showUploadDialog,
      uploadFiles,
      showNewFolderDialog,
      createFolder,
      showRenameDialog,
      renameItem,
      showDeleteDialog,
      deleteItem,
      downloadFile,
      copyPath,
      showPreview
    };
  }
};
</script>

<style scoped>
.file-explorer {
  height: 100%;
}

.file-list {
  min-height: 300px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
}

.text-preview {
  max-height: 70vh;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
}

.text-preview pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: monospace;
}
</style>