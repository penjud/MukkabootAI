<template>
  <div class="agent-wizard-tab">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-wizard-hat</v-icon>
        Agent Creation Wizard
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <!-- Stepper for wizard flow -->
        <v-stepper v-model="currentStep" class="mb-6">
          <v-stepper-header>
            <v-stepper-item
              step="1"
              title="Select Model"
            ></v-stepper-item>
            
            <v-divider></v-divider>
            
            <v-stepper-item
              step="2"
              title="Basic Info"
            ></v-stepper-item>
            
            <v-divider></v-divider>
            
            <v-stepper-item
              step="3"
              title="Configuration"
            ></v-stepper-item>
            
            <v-divider></v-divider>
            
            <v-stepper-item
              step="4"
              title="Review"
            ></v-stepper-item>
          </v-stepper-header>
          
          <!-- Step 1: Select Model -->
          <v-stepper-item value="1">
            <v-container class="py-4">
              <p class="text-body-1 mb-4">
                First, choose a language model for your agent. Different models excel at different tasks.
              </p>
              
              <!-- Loading state -->
              <div v-if="isLoadingModels" class="d-flex justify-center align-center py-8">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <span class="ml-2">Loading available models...</span>
              </div>
              
              <!-- Error state -->
              <v-alert
                v-else-if="modelsError"
                type="error"
                class="mb-4"
              >
                {{ modelsError }}
              </v-alert>
              
              <!-- Model selection -->
              <div v-else>
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="modelSearch"
                      label="Search Models"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="mb-4"
                    ></v-text-field>
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col
                    v-for="model in filteredModels"
                    :key="model.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      :class="['model-card', { 'model-card-selected': wizardData.model === model.id }]"
                      @click="selectModel(model.id)"
                      height="100%"
                      variant="outlined"
                      :color="wizardData.model === model.id ? 'primary' : undefined"
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
              </div>
            </v-container>
          </v-stepper-item>
          
          <!-- Step 2: Basic Information -->
          <v-stepper-item value="2">
            <v-container class="py-4">
              <p class="text-body-1 mb-4">
                Next, give your agent a name and description. This helps identify and remember what the agent does.
              </p>
              
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="wizardData.name"
                    label="Agent Name"
                    variant="outlined"
                    :rules="[v => !!v || 'Name is required']"
                    required
                  ></v-text-field>
                  
                  <v-textarea
                    v-model="wizardData.description"
                    label="Description (optional)"
                    variant="outlined"
                    hint="A brief description of what this agent does best"
                    rows="3"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-card variant="outlined" class="pa-4">
                    <div class="text-subtitle-1 font-weight-bold mb-2">Agent Overview</div>
                    
                    <div class="d-flex align-center mb-2">
                      <v-avatar color="primary" size="36" class="mr-2">
                        <v-icon color="white">{{ getAgentIcon() }}</v-icon>
                      </v-avatar>
                      <div class="text-h6">{{ wizardData.name || 'New Agent' }}</div>
                    </div>
                    
                    <div class="text-body-2">
                      {{ wizardData.description || 'No description provided' }}
                    </div>
                    
                    <v-divider class="my-3"></v-divider>
                    
                    <div class="d-flex align-center">
                      <v-chip
                        size="small"
                        color="primary-lighten-3"
                      >
                        {{ formatModelName(wizardData.model) }}
                      </v-chip>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-stepper-item>
          
          <!-- Step 3: Configuration -->
          <v-stepper-item value="3">
            <v-container class="py-4">
              <p class="text-body-1 mb-4">
                Now, configure how your agent behaves. The system prompt defines the agent's personality and expertise.
              </p>
              
              <v-row>
                <v-col cols="12" md="8">
                  <v-textarea
                    v-model="wizardData.systemPrompt"
                    label="System Prompt"
                    variant="outlined"
                    hint="Instructions that define how the agent behaves"
                    rows="6"
                  ></v-textarea>
                  
                  <div class="text-subtitle-1 font-weight-bold mt-4 mb-2">Parameters</div>
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-slider
                        v-model="wizardData.temperature"
                        label="Temperature"
                        hint="Higher values make output more creative but less predictable"
                        min="0"
                        max="1"
                        step="0.1"
                        thumb-label
                      ></v-slider>
                    </v-col>
                    
                    <v-col cols="12" md="6">
                      <v-slider
                        v-model="wizardData.topP"
                        label="Top P"
                        hint="Controls diversity of model output"
                        min="0"
                        max="1"
                        step="0.1"
                        thumb-label
                      ></v-slider>
                    </v-col>
                  </v-row>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-card variant="outlined" class="pa-4">
                    <div class="text-subtitle-1 font-weight-bold mb-2">Parameter Guidance</div>
                    
                    <div class="text-body-2 mb-4">
                      <strong>System Prompt</strong>: A set of instructions that prime the agent and define its behavior. For example:
                      <ul class="mt-1">
                        <li>"You are a helpful assistant that specializes in Web Development."</li>
                        <li>"You are a creative writing assistant who helps with story ideas."</li>
                      </ul>
                    </div>
                    
                    <div class="text-body-2 mb-3">
                      <strong>Temperature ({{ wizardData.temperature }})</strong>: Controls randomness
                      <ul class="mt-1">
                        <li>Low (0.1-0.3): More focused, factual, and deterministic</li>
                        <li>Medium (0.4-0.7): Balanced creativity and coherence</li>
                        <li>High (0.8-1.0): More creative, varied, but potentially less focused</li>
                      </ul>
                    </div>
                    
                    <div class="text-body-2">
                      <strong>Top P ({{ wizardData.topP }})</strong>: Controls token selection diversity
                      <ul class="mt-1">
                        <li>Lower values: More focused on likely tokens</li>
                        <li>Higher values: More diverse output</li>
                      </ul>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-stepper-item>
          
          <!-- Step 4: Review -->
          <v-stepper-item value="4">
            <v-container class="py-4">
              <p class="text-body-1 mb-4">
                Review your agent configuration before creating it. You can go back to previous steps to make changes.
              </p>
              
              <v-row>
                <v-col cols="12" md="8">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="d-flex align-center">
                      <v-avatar color="primary" size="36" class="mr-2">
                        <v-icon color="white">{{ getAgentIcon() }}</v-icon>
                      </v-avatar>
                      <div>{{ wizardData.name || 'New Agent' }}</div>
                    </v-card-title>
                    
                    <v-divider></v-divider>
                    
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Description</v-list-item-title>
                          <v-list-item-subtitle>{{ wizardData.description || 'No description provided' }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Model</v-list-item-title>
                          <v-list-item-subtitle>{{ formatModelName(wizardData.model) }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>System Prompt</v-list-item-title>
                          <v-list-item-subtitle class="white-space-pre-wrap">{{ wizardData.systemPrompt || 'No system prompt provided' }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Temperature</v-list-item-title>
                          <v-list-item-subtitle>{{ wizardData.temperature }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Top P</v-list-item-title>
                          <v-list-item-subtitle>{{ wizardData.topP }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-card variant="outlined" class="pa-4">
                    <div class="text-subtitle-1 font-weight-bold mb-2">What's Next?</div>
                    
                    <p class="text-body-2 mb-3">
                      After creating your agent, you'll be able to:
                    </p>
                    
                    <ul class="text-body-2 mb-4">
                      <li>Chat with your agent directly</li>
                      <li>Edit its configuration at any time</li>
                      <li>Create more agents for different purposes</li>
                    </ul>
                    
                    <p class="text-body-2">
                      Agents remember their conversations, allowing for continuity across multiple chat sessions.
                    </p>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-stepper-item>
        </v-stepper>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <v-btn
          v-if="currentStep > 1"
          variant="text"
          @click="currentStep--"
        >
          Back
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="currentStep < 4"
          color="primary"
          @click="nextStep"
          :disabled="!canProceed"
        >
          Next
        </v-btn>
        <v-btn
          v-else
          color="primary"
          @click="createAgent"
          :disabled="!isFormValid"
          :loading="isCreating"
        >
          Create Agent
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAgentsStore } from '../../../stores/agents';

export default {
  name: 'AgentWizardTab',
  emits: [
    'agent-created'
  ],
  setup(props, { emit }) {
    const router = useRouter();
    const agentsStore = useAgentsStore();
    
    // Wizard state
    const currentStep = ref(1);
    const isCreating = ref(false);
    
    // Form data
    const wizardData = reactive({
      step: 1,
      name: '',
      description: '',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      topP: 0.9
    });
    
    // Model selection
    const modelSearch = ref('');
    
    // Computed properties
    const isLoadingModels = computed(() => agentsStore.isLoadingModels);
    const modelsError = computed(() => agentsStore.modelsError);
    const availableModels = computed(() => agentsStore.availableModels);
    
    const filteredModels = computed(() => {
      if (!modelSearch.value) {
        return availableModels.value;
      }
      
      const query = modelSearch.value.toLowerCase();
      return availableModels.value.filter(model => 
        model.name.toLowerCase().includes(query) ||
        (model.description && model.description.toLowerCase().includes(query)) ||
        (model.tags && model.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    });
    
    const canProceed = computed(() => {
      switch (currentStep.value) {
        case 1:
          return !!wizardData.model;
        case 2:
          return !!wizardData.name;
        case 3:
          return true;
        default:
          return true;
      }
    });
    
    const isFormValid = computed(() => {
      return !!wizardData.name && !!wizardData.model;
    });
    
    // Methods
    const nextStep = () => {
      if (canProceed.value) {
        wizardData.step = currentStep.value + 1;
        currentStep.value++;
      }
    };
    
    const selectModel = (modelId) => {
      wizardData.model = modelId;
      
      // Auto-generate system prompt if none exists
      if (!wizardData.systemPrompt) {
        const model = availableModels.value.find(m => m.id === modelId);
        if (model) {
          if (model.category === 'Code' || model.id.includes('code')) {
            wizardData.systemPrompt = 'You are a coding assistant specialized in helping with programming tasks. Focus on providing clean, efficient, and well-documented code examples.';
          } else {
            wizardData.systemPrompt = 'You are a helpful, harmless, and honest assistant.';
          }
        }
      }
    };
    
    const createAgent = async () => {
      if (!isFormValid.value) return;
      
      isCreating.value = true;
      
      try {
        // Update wizard data in the store
        agentsStore.updateWizardData(wizardData);
        
        // Save agent from wizard data
        const newAgent = agentsStore.saveAgentFromWizard();
        
        // Clear form
        wizardData.name = '';
        wizardData.description = '';
        wizardData.model = '';
        wizardData.systemPrompt = '';
        wizardData.temperature = 0.7;
        wizardData.topP = 0.9;
        
        // Reset wizard step
        currentStep.value = 1;
        
        // Emit event
        emit('agent-created', newAgent);
        
        // Navigate to chat with the new agent
        router.push({
          path: '/chat',
          query: { agent: newAgent.id }
        });
      } catch (error) {
        console.error('Error creating agent:', error);
      } finally {
        isCreating.value = false;
      }
    };
    
    const getAgentIcon = () => {
      if (!wizardData.name) return 'mdi-robot';
      
      const name = wizardData.name.toLowerCase();
      
      if (wizardData.model && wizardData.model.includes('code')) {
        return 'mdi-code-braces';
      } else if (name.includes('code') || name.includes('program')) {
        return 'mdi-code-braces';
      } else if (name.includes('creative') || name.includes('writ')) {
        return 'mdi-pencil';
      } else if (name.includes('research') || name.includes('analy')) {
        return 'mdi-book-search';
      } else if (name.includes('assist')) {
        return 'mdi-account-tie';
      } else {
        return 'mdi-robot';
      }
    };
    
    const formatModelName = (modelId) => {
      if (!modelId) return 'No Model Selected';
      
      // Find the model in available models
      const model = availableModels.value.find(m => m.id === modelId);
      if (model) {
        return model.name;
      }
      
      // If not found, format the model ID
      return modelId
        .replace(/:.*$/, '') // Remove version/tag part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
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
    
    // Initialize data
    onMounted(async () => {
      // Load models if not already loaded
      if (availableModels.value.length === 0) {
        await agentsStore.loadModels();
      }
      
      // Initialize wizard data from store
      Object.assign(wizardData, agentsStore.wizardData);
      
      // Set current step
      currentStep.value = wizardData.step || 1;
    });
    
    // Watch for changes to wizard data and sync with store
    watch(wizardData, (newData) => {
      agentsStore.updateWizardData(newData);
    }, { deep: true });
    
    return {
      // State
      currentStep,
      isCreating,
      wizardData,
      modelSearch,
      
      // Computed
      isLoadingModels,
      modelsError,
      availableModels,
      filteredModels,
      canProceed,
      isFormValid,
      
      // Methods
      nextStep,
      selectModel,
      createAgent,
      getAgentIcon,
      formatModelName,
      formatSize
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

.white-space-pre-wrap {
  white-space: pre-wrap;
}
</style>
