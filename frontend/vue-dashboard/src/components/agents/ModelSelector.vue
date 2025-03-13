<template>
  <div class="model-selector">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-robot</v-icon>
        Models
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          icon="mdi-refresh"
          @click="refreshModels"
          :loading="isLoading"
          title="Refresh Models"
        ></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12">
            <v-text-field
              v-model="searchQuery"
              label="Search Models"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-2"
              @update:model-value="filterModels"
            ></v-text-field>
          </v-col>
        </v-row>
        
        <div v-if="isLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">Loading models...</div>
        </div>
        
        <v-row v-else-if="displayedModels.length > 0">
          <v-col
            v-for="model in displayedModels"
            :key="model.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card
              :class="['model-card', { 'model-card-selected': selectedModel && selectedModel.id === model.id }]"
              @click="selectModel(model)"
              height="100%"
              variant="outlined"
              :color="selectedModel && selectedModel.id === model.id ? 'primary' : undefined"
            >
              <v-card-title class="d-flex align-center">
                <div class="text-truncate">{{ model.name }}</div>
                <v-spacer></v-spacer>
                <v-chip
                  v-if="model.size"
                  size="small"
                  color="grey-lighten-1"
                  class="ml-2"
                >
                  {{ formatSize(model.size) }}
                </v-chip>
              </v-card-title>
              
              <v-card-text class="d-flex flex-column">
                <div class="text-caption mb-2 model-description">
                  {{ model.description || 'No description available' }}
                </div>
                
                <div class="mt-auto pt-2">
                  <v-chip
                    v-if="model.category"
                    size="small"
                    class="mr-1 mb-1"
                    color="primary-lighten-3"
                  >
                    {{ model.category }}
                  </v-chip>
                  
                  <v-chip
                    v-if="model.tags && model.tags.length > 0"
                    v-for="tag in model.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    class="mr-1 mb-1"
                    color="grey-lighten-2"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <div v-else class="text-center py-4">
          <v-icon size="64" color="grey-lighten-1">mdi-robot-off</v-icon>
          <div class="text-h6 mt-2">No models found</div>
          <div class="text-subtitle-1" v-if="searchQuery">
            No models match your search "{{ searchQuery }}"
          </div>
          <div class="text-subtitle-1" v-else>
            Try refreshing or check your Ollama installation
          </div>
          <v-btn
            color="primary"
            class="mt-4"
            prepend-icon="mdi-refresh"
            @click="refreshModels"
            :loading="isLoading"
          >
            Refresh Models
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Model Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800px">
      <v-card v-if="selectedModel">
        <v-card-title class="d-flex align-center">
          {{ selectedModel.name }}
          <v-spacer></v-spacer>
          <v-chip
            v-if="selectedModel.size"
            size="small"
            color="grey-lighten-1"
          >
            {{ formatSize(selectedModel.size) }}
          </v-chip>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text>
          <div class="text-body-1 mb-4">
            {{ selectedModel.description || 'No description available' }}
          </div>
          
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Model Information</h3>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-information</v-icon>
                  </template>
                  <v-list-item-title>Model ID</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedModel.id }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="selectedModel.category">
                  <template v-slot:prepend>
                    <v-icon>mdi-tag</v-icon>
                  </template>
                  <v-list-item-title>Category</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedModel.category }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="selectedModel.size">
                  <template v-slot:prepend>
                    <v-icon>mdi-harddisk</v-icon>
                  </template>
                  <v-list-item-title>Size</v-list-item-title>
                  <v-list-item-subtitle>{{ formatSize(selectedModel.size) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="selectedModel.modified">
                  <template v-slot:prepend>
                    <v-icon>mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Last Modified</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedModel.modified) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Model Parameters</h3>
              <v-list density="compact">
                <v-list-item v-for="(value, key) in getModelParameters(selectedModel)" :key="key">
                  <v-list-item-title>{{ formatParameterName(key) }}</v-list-item-title>
                  <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          
          <div v-if="selectedModel.tags && selectedModel.tags.length > 0" class="mt-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Tags</h3>
            <div>
              <v-chip
                v-for="tag in selectedModel.tags"
                :key="tag"
                size="small"
                class="mr-1 mb-1"
                color="grey-lighten-2"
              >
                {{ tag }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            @click="detailsDialog = false"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            @click="useModel"
          >
            Use Model
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';
import { OllamaService } from '../../services';

export default {
  name: 'ModelSelector',
  props: {
    value: {
      type: Object,
      default: null
    }
  },
  emits: ['input', 'update:modelValue', 'model-selected'],
  setup(props, { emit }) {
    // State variables
    const models = ref([]);
    const displayedModels = ref([]);
    const isLoading = ref(false);
    const searchQuery = ref('');
    const selectedModel = ref(props.value);
    const detailsDialog = ref(false);
    
    // Load models from Ollama
    const loadModels = async () => {
      isLoading.value = true;
      
      try {
        const response = await OllamaService.listModels();
        
        // Transform the data for our needs
        models.value = response.data.models.map(model => ({
          id: model.name,
          name: formatModelName(model.name),
          description: model.description || `${formatModelName(model.name)} - LLM model`,
          size: model.size,
          modified: model.modified,
          tags: extractTags(model.name),
          category: getCategoryFromName(model.name),
          parameters: model.parameters || {}
        }));
        
        // Sort by name
        models.value.sort((a, b) => a.name.localeCompare(b.name));
        
        // Initialize displayed models
        displayedModels.value = [...models.value];
        
        // Set default selected model if none is selected
        if (!selectedModel.value && models.value.length > 0) {
          const defaultModel = models.value.find(m => m.id === 'llama3') || models.value[0];
          selectedModel.value = defaultModel;
          emitSelectedModel();
        }
      } catch (error) {
        console.error('Error loading models:', error);
        // Load mock data if needed
        loadMockModels();
      } finally {
        isLoading.value = false;
      }
    };
    
    // Load mock models for development/testing
    const loadMockModels = () => {
      models.value = [
        {
          id: 'llama3',
          name: 'Llama 3',
          description: 'Llama 3 is a state-of-the-art open-source language model developed by Meta AI.',
          size: 4100000000,
          modified: new Date().toISOString(),
          tags: ['open-source', 'general-purpose', 'meta-ai'],
          category: 'General Purpose',
          parameters: {
            context_length: 4096,
            model_type: 'LLaMA'
          }
        },
        {
          id: 'codellama',
          name: 'Code Llama',
          description: 'Code Llama is specialized for coding tasks, including code completion and generation.',
          size: 3800000000,
          modified: new Date().toISOString(),
          tags: ['coding', 'programming', 'meta-ai'],
          category: 'Code',
          parameters: {
            context_length: 16384,
            model_type: 'LLaMA'
          }
        },
        {
          id: 'mistral',
          name: 'Mistral',
          description: 'Mistral is a lightweight and efficient language model with strong performance.',
          size: 2500000000,
          modified: new Date().toISOString(),
          tags: ['open-source', 'efficient', 'mistral-ai'],
          category: 'General Purpose',
          parameters: {
            context_length: 8192,
            model_type: 'Mistral'
          }
        }
      ];
      
      displayedModels.value = [...models.value];
      
      // Set default selected model
      if (!selectedModel.value && models.value.length > 0) {
        selectedModel.value = models.value.find(m => m.id === 'llama3') || models.value[0];
        emitSelectedModel();
      }
    };
    
    // Refresh models
    const refreshModels = () => {
      loadModels();
    };
    
    // Filter models based on search query
    const filterModels = () => {
      if (!searchQuery.value) {
        displayedModels.value = [...models.value];
        return;
      }
      
      const query = searchQuery.value.toLowerCase();
      displayedModels.value = models.value.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        (model.tags && model.tags.some(tag => tag.toLowerCase().includes(query))) ||
        (model.category && model.category.toLowerCase().includes(query))
      );
    };
    
    // Select a model
    const selectModel = (model) => {
      selectedModel.value = model;
      detailsDialog.value = true;
    };
    
    // Use the selected model
    const useModel = () => {
      detailsDialog.value = false;
      emitSelectedModel();
    };
    
    // Emit the selected model
    const emitSelectedModel = () => {
      emit('input', selectedModel.value);
      emit('update:modelValue', selectedModel.value);
      emit('model-selected', selectedModel.value);
    };
    
    // Format model name for display
    const formatModelName = (name) => {
      return name
        .replace(/:.*$/, '') // Remove version/tag part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Extract tags from model name
    const extractTags = (name) => {
      const tags = [];
      
      // Add model family
      if (name.includes('llama')) {
        tags.push('llama');
      } else if (name.includes('mistral')) {
        tags.push('mistral');
      } else if (name.includes('vicuna')) {
        tags.push('vicuna');
      } else if (name.includes('stable')) {
        tags.push('stable-diffusion');
      }
      
      // Add size tag if present
      if (name.includes('7b')) {
        tags.push('7B');
      } else if (name.includes('13b')) {
        tags.push('13B');
      } else if (name.includes('70b')) {
        tags.push('70B');
      }
      
      // Add quantization if present
      if (name.includes('q4_0')) {
        tags.push('Q4_0');
      } else if (name.includes('q4_1')) {
        tags.push('Q4_1');
      } else if (name.includes('q5_0')) {
        tags.push('Q5_0');
      } else if (name.includes('q5_1')) {
        tags.push('Q5_1');
      } else if (name.includes('q8_0')) {
        tags.push('Q8_0');
      }
      
      return tags;
    };
    
    // Get category from model name
    const getCategoryFromName = (name) => {
      if (name.includes('code')) {
        return 'Code';
      } else if (name.includes('vision')) {
        return 'Vision';
      } else if (name.includes('stable') || name.includes('sd')) {
        return 'Image Generation';
      } else if (name.includes('instruct')) {
        return 'Instruction-tuned';
      } else {
        return 'General Purpose';
      }
    };
    
    // Format file size
    const formatSize = (bytes) => {
      if (!bytes) return 'Unknown';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(1)} ${units[unitIndex]}`;
    };
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return 'Unknown';
      
      try {
        return format(new Date(dateString), 'PPP');
      } catch (error) {
        return dateString;
      }
    };
    
    // Get model parameters
    const getModelParameters = (model) => {
      if (!model.parameters) {
        return {};
      }
      
      // Return most relevant parameters
      const relevantParams = {};
      
      if (model.parameters.context_length) {
        relevantParams.context_length = model.parameters.context_length;
      }
      
      if (model.parameters.model_type) {
        relevantParams.model_type = model.parameters.model_type;
      }
      
      return relevantParams;
    };
    
    // Format parameter name
    const formatParameterName = (name) => {
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Load models when component is mounted
    onMounted(() => {
      loadModels();
    });
    
    return {
      models,
      displayedModels,
      isLoading,
      searchQuery,
      selectedModel,
      detailsDialog,
      loadModels,
      refreshModels,
      filterModels,
      selectModel,
      useModel,
      formatSize,
      formatDate,
      getModelParameters,
      formatParameterName
    };
  }
};
</script>

<style scoped>
.model-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.model-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.model-card-selected {
  border: 2px solid var(--v-primary-base) !important;
}

.model-description {
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>