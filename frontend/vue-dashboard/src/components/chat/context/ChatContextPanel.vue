<template>
  <div class="context-panel">
    <v-card height="100%" class="d-flex flex-column">
      <v-card-title class="d-flex align-center py-3">
        <v-icon color="primary" class="mr-2">mdi-information</v-icon>
        Chat Info
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="$emit('close')"
          aria-label="Close context panel"
        ></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-container v-if="!selectedConversation" class="text-center my-8">
        <v-icon size="64" color="grey-lighten-1">mdi-chat-question</v-icon>
        <div class="text-h6 mt-2">No conversation selected</div>
        <div class="text-subtitle-1">Select a conversation to view details</div>
      </v-container>
      
      <template v-else>
        <!-- Agent Information -->
        <div class="px-4 py-3">
          <div class="d-flex align-center mb-3">
            <h3 class="text-subtitle-1 font-weight-bold">Agent</h3>
            <v-spacer></v-spacer>
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-pencil"
              @click="showAgentSelector = true"
            >
              Change
            </v-btn>
          </div>
          
          <v-card variant="outlined" class="pa-3 mb-4">
            <div class="d-flex align-center">
              <v-avatar :color="agentColor" size="42" class="mr-3">
                <v-icon color="white">{{ selectedAgent.icon }}</v-icon>
              </v-avatar>
              
              <div>
                <div class="font-weight-medium">{{ selectedAgent.name }}</div>
                <div class="text-caption">{{ selectedAgent.model }}</div>
              </div>
            </div>
            <div class="mt-2 text-body-2">
              {{ selectedAgent.description }}
            </div>
          </v-card>
        </div>
        
        <v-divider></v-divider>
        
        <!-- Conversation Details -->
        <div class="px-4 py-3">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Conversation Details</h3>
          
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-calendar</v-icon>
              </template>
              <v-list-item-title>Created</v-list-item-title>
              <v-list-item-subtitle>{{ selectedConversation.timestamp }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-message-text</v-icon>
              </template>
              <v-list-item-title>Messages</v-list-item-title>
              <v-list-item-subtitle>{{ selectedConversation.messageCount || 0 }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
        
        <v-divider></v-divider>
        
        <!-- Conversation Settings -->
        <div class="px-4 py-3">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Settings</h3>
          
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>Model Parameters</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="temperature"
                  label="Temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  thumb-label
                  :hide-details="false"
                  density="compact"
                  color="primary"
                  class="mb-4"
                >
                  <template v-slot:details>
                    <div class="text-caption">
                      Controls randomness: 0 is more focused, 1 is more creative
                    </div>
                  </template>
                </v-slider>
                
                <v-slider
                  v-model="maxTokens"
                  label="Max Tokens"
                  min="100"
                  max="4000"
                  step="100"
                  thumb-label
                  :hide-details="false"
                  density="compact"
                  color="primary"
                  class="mb-4"
                >
                  <template v-slot:details>
                    <div class="text-caption">
                      Maximum response length
                    </div>
                  </template>
                </v-slider>
              </v-expansion-panel-text>
            </v-expansion-panel>
            
            <v-expansion-panel>
              <v-expansion-panel-title>Context & Memory</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-switch
                  v-model="useMemory"
                  color="primary"
                  label="Use conversation memory"
                  hide-details
                  class="mb-3"
                ></v-switch>
                
                <v-switch
                  v-model="useFiles"
                  color="primary"
                  label="Include file attachments"
                  hide-details
                  class="mb-3"
                ></v-switch>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        
        <v-divider></v-divider>
        
        <!-- Actions -->
        <div class="actions-container mt-auto px-4 py-3">
          <v-btn
            block
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            @click="$emit('delete-conversation', selectedConversation.id)"
            class="mb-2"
          >
            Delete Conversation
          </v-btn>
          
          <v-btn
            block
            color="primary"
            variant="outlined"
            prepend-icon="mdi-content-copy"
            @click="$emit('export-conversation', selectedConversation.id)"
          >
            Export Chat
          </v-btn>
        </div>
      </template>
    </v-card>
    
    <!-- Agent Selection Dialog -->
    <v-dialog v-model="showAgentSelector" max-width="500px">
      <v-card>
        <v-card-title>Change Agent</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="agent in agents"
              :key="agent.id"
              :title="agent.name"
              :subtitle="agent.description"
              :value="agent.id"
              @click="changeAgent(agent.id)"
            >
              <template v-slot:prepend>
                <v-avatar :color="getAgentColor(agent.id)" size="36">
                  <v-icon color="white">{{ agent.icon }}</v-icon>
                </v-avatar>
              </template>
              
              <template v-slot:append>
                <v-icon v-if="agent.id === selectedAgent.id">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showAgentSelector = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../../stores/chat';

export default {
  name: 'ChatContextPanel',
  emits: ['close', 'delete-conversation', 'export-conversation'],
  setup(props, { emit }) {
    const chatStore = useChatStore();
    const { 
      selectedConversation, 
      selectedAgent,
      agents
    } = storeToRefs(chatStore);
    
    // Local state
    const showAgentSelector = ref(false);
    const temperature = ref(0.7);
    const maxTokens = ref(2000);
    const useMemory = ref(true);
    const useFiles = ref(true);
    
    // Computed properties
    const agentColor = computed(() => {
      const agentColors = {
        'agent-1': 'primary',
        'agent-2': 'info',
        'agent-3': 'success'
      };
      
      return agentColors[selectedAgent.value.id] || 'grey';
    });
    
    // Methods
    const changeAgent = (agentId) => {
      chatStore.changeAgent(agentId);
      showAgentSelector.value = false;
    };
    
    const getAgentColor = (agentId) => {
      const agentColors = {
        'agent-1': 'primary',
        'agent-2': 'info',
        'agent-3': 'success'
      };
      
      return agentColors[agentId] || 'grey';
    };
    
    return {
      // Store refs
      selectedConversation,
      selectedAgent,
      agents,
      
      // Local state
      showAgentSelector,
      temperature,
      maxTokens,
      useMemory,
      useFiles,
      agentColor,
      
      // Methods
      changeAgent,
      getAgentColor
    };
  }
};
</script>

<style scoped>
.context-panel {
  height: 100%;
}
</style>
