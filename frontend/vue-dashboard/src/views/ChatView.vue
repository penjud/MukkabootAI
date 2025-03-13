<template>
  <div>
    <h1 class="text-h4 mb-4">Chat</h1>
    
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="primary" class="mr-2">mdi-chat</v-icon>
            Conversations
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="(conversation, i) in conversations"
                :key="i"
                :title="conversation.title"
                :subtitle="conversation.timestamp"
                :value="conversation.id"
                @click="selectConversation(conversation)"
                :active="selectedConversation?.id === conversation.id"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="36">
                    <v-icon color="white">mdi-chat</v-icon>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
            
            <v-btn
              block
              color="primary"
              variant="outlined"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="createNewConversation"
            >
              New Conversation
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="9">
        <v-card class="mb-4 chat-container">
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary" class="mr-2">mdi-chat</v-icon>
            {{ selectedConversation ? selectedConversation.title : 'No Conversation Selected' }}
            <v-spacer></v-spacer>
            <v-select
              v-if="selectedConversation"
              v-model="selectedAgent"
              :items="agents"
              item-title="name"
              item-value="id"
              label="Agent"
              hide-details
              density="compact"
              style="max-width: 200px;"
            ></v-select>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="messages-container" ref="messagesContainer">
            <div v-if="!selectedConversation" class="text-center my-8">
              <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
              <div class="text-h6 mt-2">Select a conversation or create a new one</div>
            </div>
            
            <div v-else-if="messages.length === 0" class="text-center my-8">
              <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
              <div class="text-h6 mt-2">No messages yet</div>
              <div class="text-subtitle-1">Start a conversation by sending a message</div>
            </div>
            
            <div v-else>
              <chat-message
                v-for="(message, i) in messages"
                :key="i"
                :message="message"
                :agent-name="getAgentName(selectedAgent)"
                class="mb-4"
              ></chat-message>
            </div>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions class="pa-4">
            <chat-input
              :disabled="!selectedConversation"
              :is-sending="isSending"
              @send-message="handleSendMessage"
              @attach-files="handleAttachFiles"
            ></chat-input>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '../components/chat/ChatMessage.vue';
import ChatInput from '../components/chat/ChatInput.vue';
import { ChatService, FilesystemService } from '../services';

export default {
  name: 'ChatView',
  components: {
    ChatMessage,
    ChatInput
  },
  setup() {
    const conversations = ref([]);
    const selectedConversation = ref(null);
    const messages = ref([]);
    const isSending = ref(false);
    const streamController = ref(null);
    const messagesContainer = ref(null);
    const agents = ref([
      { id: 'agent-1', name: 'General Assistant', model: 'llama3' },
      { id: 'agent-2', name: 'Code Helper', model: 'codellama' },
      { id: 'agent-3', name: 'Research Assistant', model: 'llama3' }
    ]);
    const selectedAgent = ref('agent-1');

    // Fetch conversations on component mount
    onMounted(async () => {
      try {
        const conversationsData = await ChatService.getConversations();
        conversations.value = conversationsData.map(conversation => ({
          ...conversation,
          timestamp: format(new Date(conversation.updatedAt || conversation.timestamp || new Date()), 'MMM d, yyyy h:mm a')
        }));
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // Add mock data if API is not available
        conversations.value = [
          { id: 'conv-1', title: 'General Questions', timestamp: 'Mar 13, 2025 9:15 AM', messageCount: 12 },
          { id: 'conv-2', title: 'Project Planning', timestamp: 'Mar 12, 2025 2:30 PM', messageCount: 8 },
          { id: 'conv-3', title: 'API Documentation', timestamp: 'Mar 10, 2025 4:45 PM', messageCount: 5 }
        ];
      }
    });

    // Watch for changes in messages and scroll to bottom
    watch(messages, async () => {
      await nextTick();
      scrollToBottom();
    }, { deep: true });

    // Select a conversation
    const selectConversation = async (conversation) => {
      selectedConversation.value = conversation;
      messages.value = [];
      
      try {
        const messagesData = await ChatService.getMessages(conversation.id);
        messages.value = messagesData.map(message => ({
          ...message,
          timestamp: format(new Date(message.timestamp || message.createdAt || new Date()), 'h:mm a')
        }));
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Add mock data if API is not available
        loadMockMessages(conversation.id);
      }
    };

    // Load mock messages for development/testing
    const loadMockMessages = (conversationId) => {
      if (conversationId === 'conv-1') {
        messages.value = [
          { id: 'msg-1', role: 'user', content: 'Hello, how can you help me today?', timestamp: '9:10 AM' },
          { id: 'msg-2', role: 'assistant', content: 'I can help with a variety of tasks such as answering questions, providing information, and assisting with tasks. What would you like help with?', timestamp: '9:11 AM' },
          { id: 'msg-3', role: 'user', content: 'Tell me about the MukkabootAI platform.', timestamp: '9:12 AM' },
          { id: 'msg-4', role: 'assistant', content: 'MukkabootAI is a Docker-free implementation of the MukkaAI platform, designed for AI agents and command operations. It maintains a microservices architecture while eliminating containerization dependencies for improved performance and simplified maintenance.', timestamp: '9:15 AM' }
        ];
      } else if (conversationId === 'conv-2') {
        messages.value = [
          { id: 'msg-5', role: 'user', content: 'Let\'s plan a project to implement a new feature.', timestamp: '2:20 PM' },
          { id: 'msg-6', role: 'assistant', content: 'Great! What kind of feature are you thinking about implementing?', timestamp: '2:21 PM' },
          { id: 'msg-7', role: 'user', content: 'A file sharing system that integrates with our existing platform.', timestamp: '2:25 PM' },
          { id: 'msg-8', role: 'assistant', content: 'That sounds like a useful addition. Let\'s break this down into steps: 1) Requirements gathering, 2) Design phase, 3) Implementation, 4) Testing, and 5) Deployment. Would you like to discuss any of these phases in more detail?', timestamp: '2:30 PM' }
        ];
      } else {
        messages.value = [
          { id: 'msg-9', role: 'user', content: 'I need help understanding the API documentation.', timestamp: '4:40 PM' },
          { id: 'msg-10', role: 'assistant', content: 'I\'d be happy to help. Which API are you working with?', timestamp: '4:41 PM' },
          { id: 'msg-11', role: 'user', content: 'The MukkabootAI Memory Service API.', timestamp: '4:43 PM' },
          { id: 'msg-12', role: 'assistant', content: 'The Memory Service API provides endpoints for storing and retrieving conversation history and knowledge entities. The main endpoints are `/api/conversations`, `/api/entities`, and `/api/relations`. Would you like me to explain any specific endpoint in more detail?', timestamp: '4:45 PM' }
        ];
      }
    };

    // Create a new conversation
    const createNewConversation = async () => {
      const newConversationData = {
        title: `New Conversation (${format(new Date(), 'MMM d, h:mm a')})`,
        agentId: selectedAgent.value
      };
      
      try {
        const newConversation = await ChatService.createConversation(newConversationData);
        const formattedConversation = {
          ...newConversation,
          timestamp: format(new Date(newConversation.createdAt || newConversation.timestamp || new Date()), 'MMM d, yyyy h:mm a')
        };
        conversations.value.unshift(formattedConversation);
        selectConversation(formattedConversation);
      } catch (error) {
        console.error('Error creating conversation:', error);
        // Create mock conversation if API is not available
        const mockConversation = {
          id: `conv-${uuidv4()}`,
          title: newConversationData.title,
          timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
          messageCount: 0
        };
        conversations.value.unshift(mockConversation);
        selectConversation(mockConversation);
      }
    };

    // Handle send message from ChatInput component
    const handleSendMessage = async (messageContent) => {
      if (!messageContent.trim() || !selectedConversation.value || isSending.value) {
        return;
      }
      
      isSending.value = true;
      
      // Add user message to the UI immediately
      const userMessage = {
        id: `temp-${uuidv4()}`,
        role: 'user',
        content: messageContent,
        timestamp: format(new Date(), 'h:mm a')
      };
      
      messages.value.push(userMessage);
      
      try {
        // Send the message to the server
        const savedMessage = await ChatService.sendMessage(selectedConversation.value.id, {
          role: 'user',
          content: messageContent,
          model: getSelectedModel()
        });
        
        // Update the user message with the server response if needed
        if (savedMessage && savedMessage.id) {
          const index = messages.value.findIndex(m => m.id === userMessage.id);
          if (index !== -1) {
            messages.value[index] = {
              ...savedMessage,
              timestamp: format(new Date(savedMessage.timestamp || savedMessage.createdAt || new Date()), 'h:mm a')
            };
          }
        }
        
        // Add an initial streaming message
        const streamingMessage = {
          id: `stream-${uuidv4()}`,
          role: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: format(new Date(), 'h:mm a')
        };
        
        messages.value.push(streamingMessage);
        
        // Process the streaming response
        await ChatService.sendStreamingMessage(
          selectedConversation.value.id,
          {
            role: 'user',
            content: messageContent,
            model: getSelectedModel()
          },
          (chunk, fullText) => {
            // Update the streaming message with new content
            const index = messages.value.findIndex(m => m.id === streamingMessage.id);
            if (index !== -1) {
              messages.value[index].content = fullText;
            }
          }
        ).then((finalResponse) => {
          // Update the message to final state when streaming is complete
          const index = messages.value.findIndex(m => m.id === streamingMessage.id);
          if (index !== -1) {
            messages.value[index].isStreaming = false;
            messages.value[index].content = finalResponse;
          }
        });
        
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Handle error state - show error in UI
        const errorIndex = messages.value.findIndex(m => m.isStreaming);
        if (errorIndex !== -1) {
          messages.value[errorIndex].isStreaming = false;
          messages.value[errorIndex].content = "I'm sorry, there was an error processing your request. Please try again later.";
          messages.value[errorIndex].isError = true;
        } else {
          // Add error message if no streaming message exists
          messages.value.push({
            id: `error-${uuidv4()}`,
            role: 'assistant',
            content: "I'm sorry, there was an error processing your request. Please try again later.",
            isError: true,
            timestamp: format(new Date(), 'h:mm a')
          });
        }
      } finally {
        isSending.value = false;
      }
    };

    // Handle file attachments
    const handleAttachFiles = async (files) => {
      if (!files || files.length === 0 || !selectedConversation.value) {
        return;
      }
      
      isSending.value = true;
      
      try {
        // Upload each file
        const uploadPromises = files.map(async file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('conversationId', selectedConversation.value.id);
          
          return await FilesystemService.uploadFile(`/conversations/${selectedConversation.value.id}/attachments`, formData);
        });
        
        const uploadedFiles = await Promise.all(uploadPromises);
        
        // Add a message with the file attachments
        const fileList = uploadedFiles.map(file => `[${file.name}](${file.url})`).join('\n');
        
        const attachmentMessage = {
          role: 'user',
          content: `Attached file(s):\n${fileList}`,
          files: uploadedFiles,
          timestamp: format(new Date(), 'h:mm a')
        };
        
        // Send the message with attachments
        await handleSendMessage(attachmentMessage.content);
      } catch (error) {
        console.error('Error uploading files:', error);
        // Show error message
        messages.value.push({
          id: `error-${uuidv4()}`,
          role: 'system',
          content: "Failed to upload files. Please try again.",
          isError: true,
          timestamp: format(new Date(), 'h:mm a')
        });
      } finally {
        isSending.value = false;
      }
    };

    // Helper function to scroll to bottom of messages container
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    // Helper function to get agent name
    const getAgentName = (agentId) => {
      const agent = agents.value.find(a => a.id === agentId);
      return agent ? agent.name : 'Assistant';
    };

    // Helper function to get selected model
    const getSelectedModel = () => {
      const agent = agents.value.find(a => a.id === selectedAgent.value);
      return agent ? agent.model : 'llama3';
    };

    return {
      conversations,
      selectedConversation,
      messages,
      isSending,
      messagesContainer,
      agents,
      selectedAgent,
      selectConversation,
      createNewConversation,
      handleSendMessage,
      handleAttachFiles,
      getAgentName
    };
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
