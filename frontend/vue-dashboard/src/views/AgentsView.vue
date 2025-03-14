<template>
  <div class="agents-view">
    <h1 class="text-h4 mb-4">AI Models & Agents</h1>
    
    <!-- Tabs -->
    <v-tabs
      v-model="activeTab"
      color="primary"
      grow
      class="mb-6"
    >
      <v-tab value="my-agents">
        <v-icon start>mdi-account-group</v-icon>
        My Agents
      </v-tab>
      <v-tab value="featured">
        <v-icon start>mdi-star</v-icon>
        Featured
      </v-tab>
      <v-tab value="wizard">
        <v-icon start>mdi-wizard-hat</v-icon>
        Agent Wizard
      </v-tab>
    </v-tabs>
    
    <v-window v-model="activeTab" class="mt-4">
      <!-- My Agents Tab -->
      <v-window-item value="my-agents" eager>
        <my-agents-tab
          @create-agent="showAgentWizard"
          @edit-agent="editAgent"
          @delete-agent="confirmDeleteAgent"
          @show-featured="activeTab = 'featured'"
          @select-agent="showAgentDetails = true"
        ></my-agents-tab>
      </v-window-item>
      
      <!-- Featured Tab -->
      <v-window-item value="featured" eager>
        <featured-tab
          @select-agent="showAgentDetails = true"
        ></featured-tab>
      </v-window-item>
      
      <!-- Agent Wizard Tab -->
      <v-window-item value="wizard" eager>
        <agent-wizard-tab
          @agent-created="handleAgentCreated"
        ></agent-wizard-tab>
      </v-window-item>
    </v-window>
    
    <!-- Agent Details Drawer -->
    <v-navigation-drawer
      v-model="showAgentDetails"
      location="right"
      temporary
      width="400"
    >
      <v-card class="h-100" flat>
        <v-card-title class="d-flex align-center">
          <v-avatar color="primary" size="36" class="mr-2">
            <v-icon color="white">{{ getAgentIcon(selectedAgent) }}</v-icon>
          </v-avatar>
          <div>{{ selectedAgent?.name || 'Agent Details' }}</div>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showAgentDetails = false"
          ></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text v-if="selectedAgent">
          <v-list class="px-0">
            <v-list-item>
              <v-list-item-title>Description</v-list-item-title>
              <v-list-item-subtitle>{{ selectedAgent.description || 'No description provided' }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>Model</v-list-item-title>
              <v-list-item-subtitle>{{ formatModelName(selectedAgent.model) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="selectedAgent.lastUsed">
              <v-list-item-title>Last Used</v-list-item-title>
              <v-list-item-subtitle>{{ formatLastUsed(selectedAgent.lastUsed) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-divider class="my-2"></v-divider>
            
            <v-list-item>
              <v-list-item-title>System Prompt</v-list-item-title>
              <v-list-item-subtitle class="white-space-pre-wrap">{{ selectedAgent.systemPrompt || 'No system prompt provided' }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-divider class="my-2"></v-divider>
            
            <v-list-item>
              <v-list-item-title>Parameters</v-list-item-title>
            </v-list-item>
            
            <v-list-item>
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
            </v-list-item>
            
            <v-list-item>
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
            </v-list-item>
          </v-list>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions v-if="selectedAgent">
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-chat"
            @click="chatWithAgent(selectedAgent)"
          >
            Chat
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="!selectedAgent.isFeatured"
            variant="text"
            prepend-icon="mdi-pencil"
            @click="editAgent(selectedAgent)"
          >
            Edit
          </v-btn>
          <v-btn
            variant="text"
            prepend-icon="mdi-content-copy"
            @click="duplicateAgent(selectedAgent)"
          >
            {{ selectedAgent.isFeatured ? 'Use as Template' : 'Duplicate' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
    
    <!-- Edit Agent Dialog -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>
          Edit Agent
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
            
            <v-textarea
              v-model="agentForm.systemPrompt"
              label="System Prompt"
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
            @click="editDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveEditedAgent"
            :disabled="!isFormValid"
          >
            Save
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, formatDistance } from 'date-fns';
import { useAgentsStore } from '../stores/agents';
import { selectAgentForChat } from '../services/chat-agent.service';

// Import components explicitly
import MyAgentsTab from '../components/agents/tabs/MyAgentsTab.vue';
import FeaturedTab from '../components/agents/tabs/FeaturedTab.vue';
import AgentWizardTab from '../components/agents/tabs/AgentWizardTab.vue';
import AgentCard from '../components/agents/AgentCard.vue';
import AgentListItem from '../components/agents/AgentListItem.vue';

export default {
  name: 'AgentsView',
  components: {
    MyAgentsTab,
    FeaturedTab,
    AgentWizardTab,
    AgentCard,
    AgentListItem,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const agentsStore = useAgentsStore();
    
    // Tab state
    const activeTab = ref('my-agents');
    
    // Agent details drawer
    const showAgentDetails = ref(false);
    
    // Edit dialog
    const editDialog = ref(false);
    const isFormValid = ref(true);
    const agentForm = ref({
      id: '',
      name: '',
      description: '',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      topP: 0.9
    });
    
    // Delete dialog
    const deleteDialog = ref(false);
    const agentToDelete = ref(null);
    
    // Computed properties
    const selectedAgent = computed(() => agentsStore.selectedAgent);
    
    // Methods
    const showAgentWizard = () => {
      // Reset wizard in store
      agentsStore.resetWizard();
      
      // Switch to wizard tab
      activeTab.value = 'wizard';
    };
    
    const editAgent = (agent) => {
      // Set form data
      agentForm.value = { ...agent };
      
      // Show dialog
      editDialog.value = true;
    };
    
    const saveEditedAgent = () => {
      if (!isFormValid.value) return;
      
      // Update agent in store
      agentsStore.updateAgent(agentForm.value.id, agentForm.value);
      
      // Close dialog
      editDialog.value = false;
    };
    
    const confirmDeleteAgent = (agent) => {
      agentToDelete.value = agent;
      deleteDialog.value = true;
    };
    
    const deleteAgent = () => {
      if (!agentToDelete.value) return;
      
      // Delete from store
      agentsStore.deleteAgent(agentToDelete.value.id);
      
      // Clear selected agent if it was deleted
      if (selectedAgent.value && selectedAgent.value.id === agentToDelete.value.id) {
        agentsStore.clearSelectedAgent();
        showAgentDetails.value = false;
      }
      
      // Close dialog
      deleteDialog.value = false;
      agentToDelete.value = null;
    };
    
    const duplicateAgent = (agent) => {
      const newAgent = agentsStore.duplicateAgent(agent.id);
      
      if (newAgent) {
        // Select the new agent
        agentsStore.selectAgent(newAgent);
        
        // Switch to my agents tab if on featured tab
        if (activeTab.value === 'featured') {
          activeTab.value = 'my-agents';
        }
      }
    };
    
    const chatWithAgent = (agent) => {
      // Use the chat agent service to safely store the agent
      const success = selectAgentForChat(agent);
      
      if (success) {
        // Mark the agent as used
        if (!agent.isFeatured) {
          agentsStore.markAgentAsUsed(agent.id);
        }
        
        // Navigate to chat view
        router.push({
          path: '/chat',
          query: { agent: agent.id }
        });
      } else {
        // Handle error (could add error notification here)
        console.error('Failed to select agent for chat');
      }
    };
    
    const handleAgentCreated = (agent) => {
      // Switch to my agents tab
      activeTab.value = 'my-agents';
      
      // Select the new agent
      agentsStore.selectAgent(agent);
      
      // Show agent details
      showAgentDetails.value = true;
    };
    
    const getAgentIcon = (agent) => {
      if (!agent) return 'mdi-robot';
      
      if (agent.icon) {
        return agent.icon;
      }
      
      if (agent.model && agent.model.includes('code')) {
        return 'mdi-code-braces';
      } else if (agent.model && agent.model.includes('vision')) {
        return 'mdi-eye';
      } else if (agent.model && (agent.model.includes('stable') || agent.model.includes('sd'))) {
        return 'mdi-image';
      } else if (agent.name.toLowerCase().includes('assist')) {
        return 'mdi-account-tie';
      } else if (agent.name.toLowerCase().includes('creative') || agent.name.toLowerCase().includes('write')) {
        return 'mdi-pencil';
      } else {
        return 'mdi-robot';
      }
    };
    
    const formatModelName = (modelId) => {
      if (!modelId) return 'Unknown';
      
      return modelId
        .replace(/:.*$/, '') // Remove version/tag part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    const formatLastUsed = (dateString) => {
      if (!dateString) return 'Never';
      
      try {
        const date = new Date(dateString);
        const now = new Date();
        
        // If it's today, show relative time
        if (date.toDateString() === now.toDateString()) {
          return formatDistance(date, now, { addSuffix: true });
        }
        
        // Otherwise show the date
        return format(date, 'MMM d, yyyy');
      } catch (error) {
        return 'Unknown';
      }
    };
    
    // Load agents on mount
    onMounted(async () => {
      // Load agents and models
      await agentsStore.loadAgents();
      await agentsStore.loadModels();
      
      // Check for tab parameter in URL
      const tabParam = route.query.tab;
      if (tabParam) {
        switch (tabParam) {
          case 'featured':
            activeTab.value = 'featured';
            break;
          case 'wizard':
            activeTab.value = 'wizard';
            break;
          default:
            activeTab.value = 'my-agents';
        }
      }
      
      // Check for agent ID parameter in URL
      const agentId = route.query.agent;
      if (agentId) {
        const agent = [...agentsStore.agents, ...agentsStore.featuredAgents]
          .find(a => a.id === agentId);
        
        if (agent) {
          agentsStore.selectAgent(agent);
          showAgentDetails.value = true;
        }
      }
    });
    
    // Update URL when active tab changes
    watch(activeTab, (newTab) => {
      router.replace({
        query: { ...route.query, tab: newTab }
      });
    });
    
    return {
      // State
      activeTab,
      showAgentDetails,
      editDialog,
      isFormValid,
      agentForm,
      deleteDialog,
      agentToDelete,
      
      // Computed
      selectedAgent,
      
      // Methods
      showAgentWizard,
      editAgent,
      saveEditedAgent,
      confirmDeleteAgent,
      deleteAgent,
      duplicateAgent,
      chatWithAgent,
      handleAgentCreated,
      getAgentIcon,
      formatModelName,
      formatLastUsed
    };
  }
};
</script>

<style scoped>
.agents-view {
  position: relative;
}

.white-space-pre-wrap {
  white-space: pre-wrap;
}
</style>