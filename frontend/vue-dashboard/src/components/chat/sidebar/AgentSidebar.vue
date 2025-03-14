<template>
  <div class="agent-sidebar">
    <v-card height="100%" class="d-flex flex-column">
      <v-card-title class="d-flex align-center py-3">
        <v-icon color="primary" class="mr-2">mdi-chat</v-icon>
        Conversations
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-plus"
          size="small"
          color="primary"
          @click="createNewConversation"
          aria-label="Create new conversation"
          title="New Conversation"
        ></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <div class="px-3 py-2">
        <v-text-field
          v-model="searchQuery"
          label="Search conversations"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          clearable
        ></v-text-field>
      </div>
      
      <v-divider></v-divider>
      
      <div class="agent-filters px-3 py-2">
        <v-chip-group
          v-model="selectedAgentFilter"
          @update:model-value="filterByAgent"
          mandatory
          class="agent-chip-group"
        >
          <v-chip label value="all">All</v-chip>
          <v-chip 
            v-for="agent in agents"
            :key="agent.id"
            :value="agent.id"
            :prepend-icon="agent.icon"
          >
            {{ agent.name }}
          </v-chip>
        </v-chip-group>
      </div>
      
      <v-divider></v-divider>
      
      <v-container class="conversation-list py-1 flex-grow-1" style="overflow-y: auto;">
        <div v-if="isLoadingConversations" class="d-flex justify-center align-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <div v-else-if="filteredConversations.length === 0" class="text-center py-4">
          <v-icon size="48" color="grey-lighten-1">mdi-chat-question</v-icon>
          <div class="mt-2">No conversations found</div>
          <v-btn
            color="primary"
            class="mt-4"
            prepend-icon="mdi-plus"
            @click="createNewConversation"
          >
            Start a new conversation
          </v-btn>
        </div>
        
        <div v-else>
          <conversation-list-item
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            :conversation="conversation"
            :selected="selectedConversationId === conversation.id"
            @select="selectConversation(conversation.id)"
            @rename="openRenameDialog(conversation)"
            @delete="openDeleteDialog(conversation)"
          ></conversation-list-item>
        </div>
      </v-container>
      
      <v-divider></v-divider>
      
      <div class="sidebar-actions pa-3">
        <v-btn
          block
          color="primary"
          prepend-icon="mdi-plus"
          @click="createNewConversation"
          class="mb-2"
        >
          New Conversation
        </v-btn>
      </div>
    </v-card>
    
    <!-- Rename Conversation Dialog -->
    <v-dialog v-model="renameDialog" max-width="500px">
      <v-card>
        <v-card-title>Rename Conversation</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="renameTitle"
            label="Conversation name"
            variant="outlined"
            hide-details="auto"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="renameDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="renameConversation"
            :disabled="!renameTitle"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Conversation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Conversation</v-card-title>
        <v-card-text>
          Are you sure you want to delete "<strong>{{ conversationToDelete?.title }}</strong>"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteConversation"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../../stores/chat';
import ConversationListItem from './ConversationListItem.vue';

export default {
  name: 'AgentSidebar',
  components: {
    ConversationListItem
  },
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-collapse'],
  setup(props, { emit }) {
    const chatStore = useChatStore();
    const { 
      conversations, 
      filteredConversations, 
      selectedConversationId, 
      isLoadingConversations,
      agents
    } = storeToRefs(chatStore);
    
    // Local state
    const searchQuery = ref('');
    const selectedAgentFilter = ref('all');
    const renameDialog = ref(false);
    const deleteDialog = ref(false);
    const conversationToRename = ref(null);
    const conversationToDelete = ref(null);
    const renameTitle = ref('');
    
    // Watch for changes in the search query
    watch(searchQuery, (newQuery) => {
      chatStore.setSearchQuery(newQuery);
    });
    
    // Methods
    const createNewConversation = () => {
      chatStore.createNewConversation();
    };
    
    const selectConversation = (conversationId) => {
      chatStore.selectConversation(conversationId);
    };
    
    const filterByAgent = (agentId) => {
      // If 'all' is selected, show all conversations
      if (agentId === 'all') {
        chatStore.setSearchQuery(searchQuery.value);
        return;
      }
      
      // Filter by agent ID
      const filteredConversations = conversations.value.filter(
        conversation => conversation.agentId === agentId
      );
      
      // We're maintaining the filter in the chat store for centralized state
      if (filteredConversations.length > 0) {
        chatStore.setSearchQuery(searchQuery.value);
      }
    };
    
    const openRenameDialog = (conversation) => {
      conversationToRename.value = conversation;
      renameTitle.value = conversation.title;
      renameDialog.value = true;
    };
    
    const renameConversation = async () => {
      if (conversationToRename.value && renameTitle.value) {
        await chatStore.updateConversation(conversationToRename.value.id, { title: renameTitle.value });
        renameDialog.value = false;
        conversationToRename.value = null;
        renameTitle.value = '';
      }
    };
    
    const openDeleteDialog = (conversation) => {
      conversationToDelete.value = conversation;
      deleteDialog.value = true;
    };
    
    const deleteConversation = async () => {
      if (conversationToDelete.value) {
        await chatStore.deleteConversation(conversationToDelete.value.id);
        deleteDialog.value = false;
        conversationToDelete.value = null;
      }
    };
    
    return {
      // Store refs
      conversations,
      filteredConversations,
      selectedConversationId,
      isLoadingConversations,
      agents,
      
      // Local state
      searchQuery,
      selectedAgentFilter,
      renameDialog,
      deleteDialog,
      conversationToRename,
      conversationToDelete,
      renameTitle,
      
      // Methods
      createNewConversation,
      selectConversation,
      filterByAgent,
      openRenameDialog,
      renameConversation,
      openDeleteDialog,
      deleteConversation
    };
  }
};
</script>

<style scoped>
.agent-sidebar {
  height: 100%;
}

.agent-chip-group {
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.agent-chip-group::-webkit-scrollbar {
  height: 4px;
}

.agent-chip-group::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.conversation-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .conversation-list {
    max-height: calc(100vh - 350px);
  }
}
</style>
