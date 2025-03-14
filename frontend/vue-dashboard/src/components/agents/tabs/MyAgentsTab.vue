<template>
  <div class="my-agents-tab">
    <!-- Toolbar with actions and filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <div class="d-flex align-center flex-wrap">
          <!-- View type toggle -->
          <v-btn-toggle
            v-model="viewType"
            color="primary"
            density="comfortable"
            class="mr-4 mb-2"
          >
            <v-btn value="grid" icon="mdi-view-grid">
              <v-tooltip activator="parent" location="bottom">Grid View</v-tooltip>
            </v-btn>
            <v-btn value="list" icon="mdi-view-list">
              <v-tooltip activator="parent" location="bottom">List View</v-tooltip>
            </v-btn>
          </v-btn-toggle>
          
          <!-- Filter by last used -->
          <v-select
            v-model="lastUsedFilter"
            :items="lastUsedOptions"
            label="Last Used"
            variant="outlined"
            density="compact"
            hide-details
            class="me-4 mb-2"
            style="width: 140px"
            @update:model-value="applyFilters"
          ></v-select>
          
          <!-- Tag filter -->
          <v-autocomplete
            v-model="selectedTags"
            :items="availableTags"
            label="Filter by Tags"
            variant="outlined"
            density="compact"
            hide-details
            multiple
            chips
            closable-chips
            class="mr-4 mb-2 tag-filter"
            @update:model-value="applyFilters"
          ></v-autocomplete>
          
          <!-- Clear filters button -->
          <v-btn
            variant="text"
            size="small"
            icon="mdi-filter-off"
            class="mb-2"
            @click="clearFilters"
            :disabled="!hasActiveFilters"
          >
            <v-tooltip activator="parent" location="bottom">Clear Filters</v-tooltip>
          </v-btn>
        </div>
      </v-col>
      
      <v-col cols="12" md="4">
        <div class="d-flex align-center justify-md-end">
          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            label="Search Agents"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="mr-2 mb-2"
            @update:model-value="applyFilters"
          ></v-text-field>
          
          <!-- Create new agent button -->
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            class="mb-2"
            @click="$emit('create-agent')"
          >
            New Agent
          </v-btn>
        </div>
      </v-col>
    </v-row>
    
    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="ml-2">Loading agents...</span>
    </div>
    
    <!-- Error state -->
    <v-alert
      v-else-if="error"
      type="error"
      class="mb-4"
    >
      {{ error }}
    </v-alert>
    
    <!-- No agents state -->
    <div v-else-if="filteredAgents.length === 0 && !searchQuery && !hasActiveFilters" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-account-off</v-icon>
      <div class="text-h6 mt-2">No agents created yet</div>
      <div class="text-subtitle-1">
        Create your own agent or use a featured agent as a template.
      </div>
      <v-btn
        color="primary"
        class="mt-4"
        prepend-icon="mdi-plus"
        @click="$emit('create-agent')"
      >
        Create New Agent
      </v-btn>
      
      <v-btn
        variant="text"
        class="mt-4 ml-2"
        prepend-icon="mdi-view-grid"
        @click="$emit('show-featured')"
      >
        Browse Featured Agents
      </v-btn>
    </div>
    
    <!-- No matching agents state -->
    <div v-else-if="filteredAgents.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-filter-off</v-icon>
      <div class="text-h6 mt-2">No matching agents</div>
      <div class="text-subtitle-1">
        Try adjusting your filters or search query.
      </div>
      <v-btn
        variant="outlined"
        class="mt-4"
        prepend-icon="mdi-filter-off"
        @click="clearFilters"
      >
        Clear Filters
      </v-btn>
    </div>
    
    <!-- Grid view -->
    <v-row v-else-if="viewType === 'grid'">
      <v-col
        v-for="agent in filteredAgents"
        :key="agent.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <agent-card
          :agent="agent"
          :selected="selectedAgent && selectedAgent.id === agent.id"
          @click="selectAgent(agent)"
          @chat="chatWithAgent(agent)"
          @edit="editAgent(agent)"
          @details="selectAgent(agent)"
          @duplicate="duplicateAgent(agent)"
          @delete="confirmDeleteAgent(agent)"
        ></agent-card>
      </v-col>
    </v-row>
    
    <!-- List view -->
    <v-card v-else>
      <v-list lines="two">
        <agent-list-item
          v-for="agent in filteredAgents"
          :key="agent.id"
          :agent="agent"
          :selected="selectedAgent && selectedAgent.id === agent.id"
          @click="selectAgent(agent)"
          @chat="chatWithAgent(agent)"
          @edit="editAgent(agent)"
          @details="selectAgent(agent)"
          @duplicate="duplicateAgent(agent)"
          @delete="confirmDeleteAgent(agent)"
        ></agent-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAgentsStore } from '../../../stores/agents';
import { selectAgentForChat } from '../../../services/chat-agent.service';
import AgentCard from '../AgentCard.vue';
import AgentListItem from '../AgentListItem.vue';

export default {
  name: 'MyAgentsTab',
  components: {
    AgentCard,
    AgentListItem
  },
  emits: [
    'create-agent',
    'edit-agent',
    'delete-agent',
    'show-details',
    'show-featured',
    'select-agent'
  ],
  setup(props, { emit }) {
    const router = useRouter();
    const agentsStore = useAgentsStore();
    
    // Local state
    const viewType = ref(agentsStore.viewType);
    const searchQuery = ref(agentsStore.filterQuery);
    const selectedTags = ref([...agentsStore.filterTags]);
    const lastUsedFilter = ref(agentsStore.filterLastUsed);
    
    // Options for last used filter
    const lastUsedOptions = [
      { title: 'Any time', value: null },
      { title: 'Today', value: 'today' },
      { title: 'This week', value: 'week' },
      { title: 'This month', value: 'month' }
    ];
    
    // Computed properties
    const loading = computed(() => agentsStore.isLoadingAgents);
    const error = computed(() => agentsStore.agentsError);
    const filteredAgents = computed(() => agentsStore.filteredAgents);
    const availableTags = computed(() => agentsStore.availableTags);
    const selectedAgent = computed(() => agentsStore.selectedAgent);
    
    const hasActiveFilters = computed(() => {
      return searchQuery.value || selectedTags.value.length > 0 || lastUsedFilter.value;
    });
    
    // Watch for changes in view type and sync with store
    watch(viewType, (newValue) => {
      agentsStore.setFilter({ viewType: newValue });
    });
    
    // Methods
    const applyFilters = () => {
      agentsStore.setFilter({
        query: searchQuery.value,
        tags: selectedTags.value,
        lastUsed: lastUsedFilter.value
      });
    };
    
    const clearFilters = () => {
      searchQuery.value = '';
      selectedTags.value = [];
      lastUsedFilter.value = null;
      agentsStore.clearFilters();
    };
    
    const selectAgent = (agent) => {
      agentsStore.selectAgent(agent);
      emit('select-agent', agent);
    };
    
    const chatWithAgent = (agent) => {
      // Use the chat agent service to safely store the agent
      const success = selectAgentForChat(agent);
      
      if (success) {
        // Mark the agent as used
        agentsStore.markAgentAsUsed(agent.id);
        
        // Navigate to chat view
        router.push({
          path: '/chat',
          query: { agent: agent.id }
        });
      } else {
        console.error('Failed to select agent for chat');
      }
    };
    
    const editAgent = (agent) => {
      emit('edit-agent', agent);
    };
    
    const duplicateAgent = (agent) => {
      const newAgent = agentsStore.duplicateAgent(agent.id);
      if (newAgent) {
        // Select the new agent
        selectAgent(newAgent);
      }
    };
    
    const confirmDeleteAgent = (agent) => {
      emit('delete-agent', agent);
    };
    
    return {
      // State
      viewType,
      searchQuery,
      selectedTags,
      lastUsedFilter,
      lastUsedOptions,
      
      // Computed
      loading,
      error,
      filteredAgents,
      availableTags,
      selectedAgent,
      hasActiveFilters,
      
      // Methods
      applyFilters,
      clearFilters,
      selectAgent,
      chatWithAgent,
      editAgent,
      duplicateAgent,
      confirmDeleteAgent
    };
  }
};
</script>

<style scoped>
.tag-filter {
  max-width: 300px;
}
</style>