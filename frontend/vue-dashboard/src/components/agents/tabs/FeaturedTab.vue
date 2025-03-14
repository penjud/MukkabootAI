<template>
  <div class="featured-tab">
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
          
          <!-- Category filter -->
          <v-select
            v-model="selectedCategory"
            :items="categories"
            label="Category"
            variant="outlined"
            density="compact"
            hide-details
            class="me-4 mb-2"
            style="width: 180px"
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
            label="Search Featured Agents"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
            @update:model-value="applyFilters"
          ></v-text-field>
        </div>
      </v-col>
    </v-row>
    
    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="ml-2">Loading featured agents...</span>
    </div>
    
    <!-- Error state -->
    <v-alert
      v-else-if="error"
      type="error"
      class="mb-4"
    >
      {{ error }}
    </v-alert>
    
    <!-- No matching agents state -->
    <div v-else-if="filteredAgents.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-filter-off</v-icon>
      <div class="text-h6 mt-2">No matching featured agents</div>
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
          @details="selectAgent(agent)"
          @duplicate="duplicateAgent(agent)"
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
          @details="selectAgent(agent)"
          @duplicate="duplicateAgent(agent)"
        ></agent-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAgentsStore } from '../../../stores/agents';
import { selectAgentForChat } from '../../../services/chat-agent.service';
import AgentCard from '../AgentCard.vue';
import AgentListItem from '../AgentListItem.vue';

export default {
  name: 'FeaturedTab',
  components: {
    AgentCard,
    AgentListItem
  },
  emits: [
    'show-details',
    'select-agent'
  ],
  setup(props, { emit }) {
    const router = useRouter();
    const agentsStore = useAgentsStore();
    
    // Local state
    const viewType = ref(agentsStore.viewType);
    const searchQuery = ref(agentsStore.filterQuery);
    const selectedTags = ref([...agentsStore.filterTags]);
    const selectedCategory = ref(null);
    
    // Computed properties
    const loading = computed(() => agentsStore.isLoadingAgents);
    const error = computed(() => agentsStore.agentsError);
    const featuredAgents = computed(() => agentsStore.featuredAgents);
    const availableTags = computed(() => agentsStore.availableTags);
    const selectedAgent = computed(() => agentsStore.selectedAgent);
    
    // Get categories from featured agents
    const categories = computed(() => {
      const categorySet = new Set();
      categorySet.add({ title: 'All Categories', value: null });
      
      featuredAgents.value.forEach(agent => {
        if (agent.category) {
          categorySet.add({ title: agent.category, value: agent.category });
        }
      });
      
      return Array.from(categorySet);
    });
    
    // Get filtered agents
    const filteredAgents = computed(() => {
      let filtered = [...featuredAgents.value];
      
      // Apply category filter
      if (selectedCategory.value) {
        filtered = filtered.filter(agent => 
          agent.category === selectedCategory.value
        );
      }
      
      // Apply text search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(agent => 
          agent.name.toLowerCase().includes(query) ||
          (agent.description && agent.description.toLowerCase().includes(query))
        );
      }
      
      // Apply tag filter
      if (selectedTags.value.length > 0) {
        filtered = filtered.filter(agent => {
          // Extract tags from agent
          const agentTags = extractAgentTags(agent);
          // Check if any selected filter tag is in the agent's tags
          return selectedTags.value.some(tag => agentTags.includes(tag));
        });
      }
      
      return filtered;
    });
    
    const hasActiveFilters = computed(() => {
      return searchQuery.value || selectedTags.value.length > 0 || selectedCategory.value;
    });
    
    // Watch for changes in view type and sync with store
    watch(viewType, (newValue) => {
      agentsStore.setFilter({ viewType: newValue });
    });
    
    // Extract tags from agent
    const extractAgentTags = (agent) => {
      const tags = [];
      
      // Add model-based tags
      if (agent.model) {
        if (agent.model.includes('llama')) {
          tags.push('llama');
        } else if (agent.model.includes('mistral')) {
          tags.push('mistral');
        } else if (agent.model.includes('code')) {
          tags.push('code');
        }
      }
      
      // Add purpose-based tags from name
      const name = agent.name.toLowerCase();
      if (name.includes('code') || name.includes('program')) {
        tags.push('coding');
      } else if (name.includes('creat') || name.includes('writ')) {
        tags.push('creative');
      } else if (name.includes('research') || name.includes('analy')) {
        tags.push('research');
      }
      
      // Add custom tags if defined on the agent
      if (agent.tags && Array.isArray(agent.tags)) {
        tags.push(...agent.tags);
      }
      
      // Add category if defined
      if (agent.category) {
        tags.push(agent.category.toLowerCase());
      }
      
      // Return unique tags
      return [...new Set(tags)];
    };
    
    // Methods
    const applyFilters = () => {
      agentsStore.setFilter({
        query: searchQuery.value,
        tags: selectedTags.value
      });
    };
    
    const clearFilters = () => {
      searchQuery.value = '';
      selectedTags.value = [];
      selectedCategory.value = null;
      agentsStore.clearFilters();
    };
    
    const selectAgent = (agent) => {
      agentsStore.selectAgent(agent);
      emit('select-agent', agent);
    };
    
    const chatWithAgent = (agent) => {
      // First, create a copy of the featured agent for the user
      const userAgent = agentsStore.duplicateAgent(agent.id);
      
      if (userAgent) {
        // Use the chat agent service to safely store the agent
        const success = selectAgentForChat(userAgent);
        
        if (success) {
          // Navigate to chat view
          router.push({
            path: '/chat',
            query: { agent: userAgent.id }
          });
        } else {
          console.error('Failed to select agent for chat');
        }
      }
    };
    
    const duplicateAgent = (agent) => {
      const newAgent = agentsStore.duplicateAgent(agent.id);
      if (newAgent) {
        // Select the new agent
        selectAgent(newAgent);
      }
    };
    
    // Load featured agents on mount
    onMounted(() => {
      if (featuredAgents.value.length === 0) {
        agentsStore.loadFeaturedAgents();
      }
    });
    
    return {
      // State
      viewType,
      searchQuery,
      selectedTags,
      selectedCategory,
      
      // Computed
      loading,
      error,
      filteredAgents,
      categories,
      availableTags,
      selectedAgent,
      hasActiveFilters,
      
      // Methods
      applyFilters,
      clearFilters,
      selectAgent,
      chatWithAgent,
      duplicateAgent
    };
  }
};
</script>

<style scoped>
.tag-filter {
  max-width: 300px;
}
</style>