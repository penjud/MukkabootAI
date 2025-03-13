<template>
  <div>
    <h1 class="text-h4 mb-4">AI Models & Agents</h1>
    
    <v-row>
      <v-col cols="12" md="8">
        <model-selector
          v-model="selectedModel"
          @model-selected="handleModelSelected"
        />
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
            Saved Agents
            <v-spacer></v-spacer>
            <v-btn
              size="small"
              icon="mdi-plus"
              @click="showNewAgentDialog"
              title="Create New Agent"
            ></v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <v-list v-if="agents.length > 0">
              <v-list-item
                v-for="agent in agents"
                :key="agent.id"
                :title="agent.name"
                :subtitle="agent.model"
                @click="selectAgent(agent)"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="36">
                    <v-icon color="white">{{ getAgentIcon(agent) }}</v-icon>
                  </v-avatar>
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
                        prepend-icon="mdi-chat"
                        title="Chat with Agent"
                        @click="chatWithAgent(agent)"
                      ></v-list-item>
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit Agent"
                        @click="editAgent(agent)"
                      ></v-list-item>
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete Agent"
                        @click="showDeleteAgentDialog(agent)"
                        class="text-error"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-list-item>
            </v-list>
            
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-account-off</v-icon>
              <div class="text-h6 mt-2">No agents created yet</div>
              <div class="text-subtitle-1">
                Create an agent to quickly chat with your preferred models.
              </div>
              <v-btn
                color="primary"
                class="mt-4"
                prepend-icon="mdi-plus"
                @click="showNewAgentDialog"
              >
                Create New Agent
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Agent Configuration Card -->
        <v-card v-if="selectedAgent" class="mt-4">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-tune</v-icon>
            Agent Configuration
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Name</v-list-item-title>
                <v-list-item-subtitle>{{ selectedAgent.name }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Model</v-list-item-title>
                <v-list-item-subtitle>{{ selectedAgent.model }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="selectedAgent.description">
                <v-list-item-title>Description</v-list-item-title>
                <v-list-item-subtitle>{{ selectedAgent.description }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="selectedAgent.systemPrompt">
                <v-list-item-title>System Prompt</v-list-item-title>
                <v-list-item-subtitle class="system-prompt-preview">
                  {{ selectedAgent.systemPrompt }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <v-divider class="my-4"></v-divider>
            
            <div class="text-subtitle-1 font-weight-bold mb-2">Parameters</div>
            
            <v-row>
              <v-col cols="6">
                <v-slider
                  v-model="selectedAgent.temperature"
                  label="Temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  thumb-label
                  density="compact"
                  disabled
                ></v-slider>
              </v-col>
              
              <v-col cols="6">
                <v-slider
                  v-model="selectedAgent.topP"
                  label="Top P"
                  min="0"
                  max="1"
                  step="0.1"
                  thumb-label
                  density="compact"
                  disabled
                ></v-slider>
              </v-col>
            </v-row>
            
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-chat"
              @click="chatWithAgent(selectedAgent)"
            >
              Chat with Agent
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- New/Edit Agent Dialog -->
    <v-dialog v-model="agentDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ isEditMode ? 'Edit Agent' : 'Create New Agent' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form" v-model="isFormValid">
            <v-text-field
              v-model="agentForm.name"
              label="Agent Name"
              variant="outlined"
              :rules="[v => !!v || 'Name is required']"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="agentForm.description"
              label="Description (optional)"
              variant="outlined"
            ></v-text-field>
            
            <v-select
              v-model="agentForm.model"
              :items="modelOptions"
              item-title="name"
              item-value="id"
              label="Model"
              variant="outlined"
              :rules="[v => !!v || 'Model is required']"
              required
            ></v-select>
            
            <v-textarea
              v-model="agentForm.systemPrompt"
              label="System Prompt (optional)"
              variant="outlined"
              hint="Instructions that define how the agent behaves"
              rows="4"
            ></v-textarea>
            
            <v-row>
              <v-col cols="6">
                <v-slider
                  v-model="agentForm.temperature"
                  label="Temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  thumb-label
                ></v-slider>
              </v-col>
              
              <v-col cols="6">
                <v-slider
                  v-model="agentForm.topP"
                  label="Top P"
                  min="0"
                  max="1"
                  step="0.1"
                  thumb-label
                ></v-slider>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="agentDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveAgent"
            :disabled="!isFormValid"
          >
            {{ isEditMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Agent Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Agent</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ agentToDelete?.name }}"?
          This action cannot be undone.
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
            @click="deleteAgent"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import ModelSelector from '../components/agents/ModelSelector.vue';

export default {
  name: 'AgentsView',
  components: {
    ModelSelector
  },
  setup() {
    const router = useRouter();
    const selectedModel = ref(null);
    const agents = ref([]);
    const selectedAgent = ref(null);
    const agentDialog = ref(false);
    const deleteDialog = ref(false);
    const isFormValid = ref(false);
    const form = ref(null);
    const isEditMode = ref(false);
    const agentToDelete = ref(null);
    
    // Agent form data
    const agentForm = ref({
      id: '',
      name: '',
      description: '',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      topP: 0.9
    });
    
    // Computed properties
    const modelOptions = computed(() => {
      if (!selectedModel.value) {
        return [];
      }
      
      return [selectedModel.value];
    });
    
    // Handle model selected from ModelSelector
    const handleModelSelected = (model) => {
      selectedModel.value = model;
      
      // Update form model if new agent dialog is open
      if (agentDialog.value && !isEditMode.value) {
        agentForm.value.model = model.id;
      }
    };
    
    // Show dialog to create a new agent
    const showNewAgentDialog = () => {
      isEditMode.value = false;
      resetAgentForm();
      
      // Set default model if available
      if (selectedModel.value) {
        agentForm.value.model = selectedModel.value.id;
      }
      
      agentDialog.value = true;
    };
    
    // Reset the agent form
    const resetAgentForm = () => {
      agentForm.value = {
        id: '',
        name: '',
        description: '',
        model: selectedModel.value ? selectedModel.value.id : '',
        systemPrompt: '',
        temperature: 0.7,
        topP: 0.9
      };
    };
    
    // Save the agent (create or update)
    const saveAgent = () => {
      if (!isFormValid.value) {
        return;
      }
      
      if (isEditMode.value) {
        // Update existing agent
        const index = agents.value.findIndex(a => a.id === agentForm.value.id);
        if (index !== -1) {
          agents.value[index] = { ...agentForm.value };
          selectedAgent.value = agents.value[index];
        }
      } else {
        // Create new agent
        const newAgent = {
          ...agentForm.value,
          id: uuidv4()
        };
        
        agents.value.push(newAgent);
        selectedAgent.value = newAgent;
      }
      
      // Save to localStorage
      saveAgentsToStorage();
      
      // Close dialog
      agentDialog.value = false;
    };
    
    // Select an agent
    const selectAgent = (agent) => {
      selectedAgent.value = agent;
    };
    
    // Edit an agent
    const editAgent = (agent) => {
      isEditMode.value = true;
      agentForm.value = { ...agent };
      agentDialog.value = true;
    };
    
    // Show delete confirmation dialog
    const showDeleteAgentDialog = (agent) => {
      agentToDelete.value = agent;
      deleteDialog.value = true;
    };
    
    // Delete an agent
    const deleteAgent = () => {
      if (!agentToDelete.value) {
        return;
      }
      
      // Remove from array
      agents.value = agents.value.filter(a => a.id !== agentToDelete.value.id);
      
      // Clear selected agent if it was deleted
      if (selectedAgent.value && selectedAgent.value.id === agentToDelete.value.id) {
        selectedAgent.value = null;
      }
      
      // Save to localStorage
      saveAgentsToStorage();
      
      // Close dialog
      deleteDialog.value = false;
      agentToDelete.value = null;
    };
    
    // Chat with an agent
    const chatWithAgent = (agent) => {
      // Store the agent in localStorage to be used in the chat
      localStorage.setItem('selectedAgent', JSON.stringify(agent));
      
      // Navigate to chat view
      router.push({
        path: '/chat',
        query: { agent: agent.id }
      });
    };
    
    // Get icon for agent based on its purpose/model
    const getAgentIcon = (agent) => {
      if (!agent) return 'mdi-robot';
      
      if (agent.model.includes('code')) {
        return 'mdi-code-braces';
      } else if (agent.model.includes('vision')) {
        return 'mdi-eye';
      } else if (agent.model.includes('stable') || agent.model.includes('sd')) {
        return 'mdi-image';
      } else if (agent.name.toLowerCase().includes('assist')) {
        return 'mdi-account-tie';
      } else if (agent.name.toLowerCase().includes('creative') || agent.name.toLowerCase().includes('write')) {
        return 'mdi-pencil';
      } else {
        return 'mdi-robot';
      }
    };
    
    // Save agents to localStorage
    const saveAgentsToStorage = () => {
      localStorage.setItem('agents', JSON.stringify(agents.value));
    };
    
    // Load agents from localStorage
    const loadAgentsFromStorage = () => {
      const storedAgents = localStorage.getItem('agents');
      if (storedAgents) {
        try {
          agents.value = JSON.parse(storedAgents);
        } catch (error) {
          console.error('Error parsing stored agents:', error);
          // Initialize with default agents if there's an error
          initializeDefaultAgents();
        }
      } else {
        // Initialize with default agents if none exist
        initializeDefaultAgents();
      }
    };
    
    // Initialize with default agents
    const initializeDefaultAgents = () => {
      agents.value = [
        {
          id: 'agent-1',
          name: 'General Assistant',
          description: 'A general-purpose AI assistant for everyday tasks',
          model: 'llama3',
          systemPrompt: 'You are a helpful, harmless, and honest assistant.',
          temperature: 0.7,
          topP: 0.9
        },
        {
          id: 'agent-2',
          name: 'Code Helper',
          description: 'Specialized assistant for programming and development tasks',
          model: 'codellama',
          systemPrompt: 'You are a coding assistant specialized in helping with programming tasks. Focus on providing clean, efficient, and well-documented code examples.',
          temperature: 0.3,
          topP: 0.95
        },
        {
          id: 'agent-3',
          name: 'Research Assistant',
          description: 'Assistant focused on in-depth research and analysis',
          model: 'llama3',
          systemPrompt: 'You are a research assistant with expertise in finding, analyzing, and presenting information. Provide comprehensive and well-structured responses with citations where possible.',
          temperature: 0.5,
          topP: 0.9
        }
      ];
      
      // Save to localStorage
      saveAgentsToStorage();
    };
    
    // Load agents when component is mounted
    onMounted(() => {
      loadAgentsFromStorage();
      
      // Set first agent as selected by default
      if (agents.value.length > 0 && !selectedAgent.value) {
        selectedAgent.value = agents.value[0];
      }
    });
    
    return {
      selectedModel,
      agents,
      selectedAgent,
      agentDialog,
      deleteDialog,
      isFormValid,
      form,
      isEditMode,
      agentToDelete,
      agentForm,
      modelOptions,
      handleModelSelected,
      showNewAgentDialog,
      saveAgent,
      selectAgent,
      editAgent,
      showDeleteAgentDialog,
      deleteAgent,
      chatWithAgent,
      getAgentIcon
    };
  }
};
</script>

<style scoped>
.system-prompt-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>