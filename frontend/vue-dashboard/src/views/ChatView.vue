<template>
  <div class="chat-view d-flex flex-column" style="height: 100%;">
    <v-row class="flex-grow-1 flex-nowrap" style="min-height: 0;">
      <!-- Left Sidebar: Agent List -->
      <v-col 
        :cols="leftSidebarCols" 
        class="d-flex flex-column pa-2"
        :class="{ 'd-none': leftSidebarHidden }"
      >
        <agent-sidebar></agent-sidebar>
      </v-col>
      
      <!-- Chat Area -->
      <v-col class="d-flex flex-column pa-2 flex-grow-1">
        <v-card class="flex-grow-1 d-flex flex-column">
          <!-- Chat Header -->
          <v-card-title class="d-flex align-center py-3">
            <!-- Toggle left sidebar on mobile -->
            <v-btn
              icon="mdi-menu"
              variant="text"
              size="small"
              class="d-md-none mr-2"
              @click="toggleLeftSidebar"
              aria-label="Toggle conversation list"
            ></v-btn>
            
            <div v-if="selectedConversation" class="d-flex align-center">
              <v-avatar :color="agentColor" size="32" class="mr-2">
                <v-icon color="white">{{ selectedAgent.icon }}</v-icon>
              </v-avatar>
              <div class="title-container">
                <div class="title text-truncate">{{ selectedConversation.title }}</div>
              </div>
            </div>
            <div v-else class="grey--text">No Conversation Selected</div>
            
            <v-spacer></v-spacer>
            
            <!-- Chat Actions -->
            <template v-if="selectedConversation">
              <!-- Toggle right sidebar on mobile/tablet -->
              <v-btn
                icon="mdi-information"
                variant="text"
                size="small"
                class="d-lg-none"
                :color="rightSidebarVisible ? 'primary' : undefined"
                @click="toggleRightSidebar"
                aria-label="Toggle conversation details"
              ></v-btn>
              
              <!-- Desktop menu -->
              <v-menu location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="props"
                    aria-label="Chat options"
                  ></v-btn>
                </template>
                
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Rename Conversation"
                    @click="openRenameDialog"
                  ></v-list-item>
                  <v-list-item
                    prepend-icon="mdi-content-copy"
                    title="Export Chat"
                    @click="exportConversation"
                  ></v-list-item>
                  <v-divider></v-divider>
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Delete Conversation"
                    @click="openDeleteDialog"
                  ></v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <!-- Messages Area -->
          <v-card-text ref="messagesContainer" class="messages-container flex-grow-1 pa-4">
            <div v-if="!selectedConversation" class="text-center empty-state my-8">
              <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
              <div class="text-h6 mt-2">Select a conversation or create a new one</div>
              <v-btn
                color="primary"
                class="mt-4"
                prepend-icon="mdi-plus"
                @click="createNewConversation"
              >
                New Conversation
              </v-btn>
            </div>
            
            <div v-else-if="isLoadingMessages" class="text-center my-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <div class="text-h6 mt-4">Loading messages...</div>
            </div>
            
            <div v-else-if="messages.length === 0" class="text-center empty-state my-8">
              <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
              <div class="text-h6 mt-2">No messages yet</div>
              <div class="text-subtitle-1">Start a conversation by sending a message</div>
            </div>
            
            <div v-else class="messages-list">
              <chat-message
                v-for="(message, i) in messages"
                :key="i"
                :message="message"
                :agent-name="selectedAgent.name"
              ></chat-message>
            </div>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <!-- Chat Input -->
          <v-card-actions class="pa-0">
            <chat-input
              :disabled="!selectedConversation"
              :is-sending="isSendingMessage"
              @send-message="handleSendMessage"
              @attach-files="handleAttachFiles"
            ></chat-input>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <!-- Right Sidebar: Context Panel -->
      <v-col 
        v-if="rightSidebarVisible"
        :cols="rightSidebarCols" 
        class="d-flex flex-column pa-2"
        :class="{ 'd-none': rightSidebarHidden }"
      >
        <chat-context-panel
          @close="toggleRightSidebar"
          @delete-conversation="deleteConversation"
          @export-conversation="exportConversation"
        ></chat-context-panel>
      </v-col>
    </v-row>
    
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
          Are you sure you want to delete "<strong>{{ selectedConversation?.title }}</strong>"? This action cannot be undone.
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useDisplay } from 'vuetify';
import { useChatStore } from '../stores/chat';
import { FilesystemService } from '../services';
import AgentSidebar from '../components/chat/sidebar/AgentSidebar.vue';
import ChatContextPanel from '../components/chat/context/ChatContextPanel.vue';
import ChatMessage from '../components/chat/ChatMessage.vue';
import ChatInput from '../components/chat/ChatInput.vue';

export default {
  name: 'ChatView',
  components: {
    AgentSidebar,
    ChatContextPanel,
    ChatMessage,
    ChatInput
  },
  setup() {
    const chatStore = useChatStore();
    const display = useDisplay();
    
    // Store refs
    const {
      conversations,
      selectedConversation,
      selectedAgent,
      messages,
      isLoadingMessages,
      isSendingMessage
    } = storeToRefs(chatStore);
    
    // Local state
    const messagesContainer = ref(null);
    const leftSidebarVisible = ref(true);
    const rightSidebarVisible = ref(true);
    const renameDialog = ref(false);
    const deleteDialog = ref(false);
    const renameTitle = ref('');
    
    // Computed for responsive layout
    const leftSidebarCols = computed(() => {
      if (display.mdAndDown.value) return 12;
      return 3;
    });
    
    const rightSidebarCols = computed(() => {
      if (display.mdAndDown.value) return 12;
      return 3;
    });
    
    const leftSidebarHidden = computed(() => {
      if (display.mdAndUp.value) return false;
      return !leftSidebarVisible.value;
    });
    
    const rightSidebarHidden = computed(() => {
      if (display.lgAndUp.value) return false;
      return !rightSidebarVisible.value;
    });
    
    const agentColor = computed(() => {
      const agentColors = {
        'agent-1': 'primary',
        'agent-2': 'info',
        'agent-3': 'success'
      };
      
      return agentColors[selectedAgent.value?.id] || 'grey';
    });
    
    // Initialize the chat view
    onMounted(async () => {
      await chatStore.fetchConversations();
      
      // Set responsive sidebar visibility based on screen size
      leftSidebarVisible.value = display.mdAndUp.value;
      rightSidebarVisible.value = display.lgAndUp.value;
    });
    
    // Watch for changes in messages and scroll to bottom
    watch(messages, () => {
      scrollToBottom();
    }, { deep: true });
    
    // Scroll to bottom of messages container
    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // Create a new conversation
    const createNewConversation = () => {
      chatStore.createNewConversation();
    };
    
    // Handle send message
    const handleSendMessage = (messageContent) => {
      chatStore.sendMessage(messageContent);
    };
    
    // Handle file attachments
    const handleAttachFiles = async (files) => {
      if (!files || files.length === 0 || !selectedConversation.value) {
        return;
      }
      
      try {
        // Upload each file
        const uploadPromises = files.map(async file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('conversationId', selectedConversation.value.id);
          
          return await FilesystemService.uploadFile(
            `/conversations/${selectedConversation.value.id}/attachments`, 
            formData
          );
        });
        
        const uploadedFiles = await Promise.all(uploadPromises);
        
        // Add a message with the file attachments
        const fileList = uploadedFiles.map(file => `[${file.name}](${file.url})`).join('\n');
        
        // Send the message with attachments
        chatStore.sendMessage(`Attached file(s):\n${fileList}`);
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    };
    
    // Toggle the left sidebar
    const toggleLeftSidebar = () => {
      leftSidebarVisible.value = !leftSidebarVisible.value;
      
      // If on mobile, hide the right sidebar when showing the left
      if (leftSidebarVisible.value && display.mdAndDown.value) {
        rightSidebarVisible.value = false;
      }
    };
    
    // Toggle the right sidebar
    const toggleRightSidebar = () => {
      rightSidebarVisible.value = !rightSidebarVisible.value;
      
      // If on mobile, hide the left sidebar when showing the right
      if (rightSidebarVisible.value && display.mdAndDown.value) {
        leftSidebarVisible.value = false;
      }
    };
    
    // Open rename dialog
    const openRenameDialog = () => {
      if (selectedConversation.value) {
        renameTitle.value = selectedConversation.value.title;
        renameDialog.value = true;
      }
    };
    
    // Rename conversation
    const renameConversation = async () => {
      if (selectedConversation.value && renameTitle.value) {
        await chatStore.updateConversation(selectedConversation.value.id, { title: renameTitle.value });
        renameDialog.value = false;
        renameTitle.value = '';
      }
    };
    
    // Open delete dialog
    const openDeleteDialog = () => {
      if (selectedConversation.value) {
        deleteDialog.value = true;
      }
    };
    
    // Delete conversation
    const deleteConversation = async () => {
      if (selectedConversation.value) {
        await chatStore.deleteConversation(selectedConversation.value.id);
        deleteDialog.value = false;
      }
    };
    
    // Export conversation
    const exportConversation = async () => {
      if (!selectedConversation.value) return;
      
      try {
        // Format messages for export
        const exportData = {
          title: selectedConversation.value.title,
          agent: selectedAgent.value.name,
          timestamp: new Date().toISOString(),
          messages: messages.value.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        };
        
        // Convert to JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedConversation.value.title.replace(/\s+/g, '_')}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting conversation:', error);
      }
    };
    
    return {
      // Store refs
      conversations,
      selectedConversation,
      selectedAgent,
      messages,
      isLoadingMessages,
      isSendingMessage,
      
      // Local state
      messagesContainer,
      leftSidebarVisible,
      rightSidebarVisible,
      renameDialog,
      deleteDialog,
      renameTitle,
      
      // Computed
      leftSidebarCols,
      rightSidebarCols,
      leftSidebarHidden,
      rightSidebarHidden,
      agentColor,
      
      // Methods
      createNewConversation,
      handleSendMessage,
      handleAttachFiles,
      toggleLeftSidebar,
      toggleRightSidebar,
      openRenameDialog,
      renameConversation,
      openDeleteDialog,
      deleteConversation,
      exportConversation
    };
  }
};
</script>
<style>
.messages-container {
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  background-color: var(--v-theme-surface-lighten-1, #FAFAFA);
}

.messages-list {
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

.empty-state {
  opacity: 0.7;
}

.title-container {
  max-width: 200px;
  overflow: hidden;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .messages-container {
    padding: 12px !important;
  }
}

@media (min-width: 1200px) {
  .title-container {
    max-width: 300px;
  }
}

/* Dark theme adjustments */
:root[class*="v-theme--dark"] .messages-container {
  background-color: var(--v-theme-surface-darken-1, #121212);
}
</style>
