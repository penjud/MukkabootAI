<template>
  <div
    :class="['conversation-item pa-2 mb-1 rounded', { 'selected': selected }]"
    @click="$emit('select')"
  >
    <div class="d-flex align-center">
      <v-avatar :color="getAgentColor(conversation.agentId)" size="36" class="mr-2">
        <v-icon color="white">{{ getAgentIcon(conversation.agentId) }}</v-icon>
      </v-avatar>
      
      <div class="conversation-info flex-grow-1 text-truncate">
        <div class="title font-weight-medium text-truncate">{{ conversation.title }}</div>
        <div class="subtitle text-caption text-truncate">
          {{ conversation.timestamp }} · {{ conversation.messageCount || 0 }} messages
        </div>
      </div>
      
      <div class="conversation-actions">
        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              v-bind="props"
              @click.stop
            ></v-btn>
          </template>
          
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-pencil"
              title="Rename"
              @click.stop="$emit('rename')"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              @click.stop="$emit('delete')"
            ></v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../../stores/chat';

export default {
  name: 'ConversationListItem',
  props: {
    conversation: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'rename', 'delete'],
  setup(props) {
    const chatStore = useChatStore();
    const { agents } = storeToRefs(chatStore);
    
    // Get agent icon
    const getAgentIcon = (agentId) => {
      const agent = agents.value.find(a => a.id === agentId);
      return agent ? agent.icon : 'mdi-robot';
    };
    
    // Get agent color
    const getAgentColor = (agentId) => {
      const agentColors = {
        'agent-1': 'primary',
        'agent-2': 'info',
        'agent-3': 'success'
      };
      
      return agentColors[agentId] || 'grey';
    };
    
    return {
      getAgentIcon,
      getAgentColor
    };
  }
};
</script>

<style scoped>
.conversation-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.conversation-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.conversation-item.selected {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.conversation-info {
  overflow: hidden;
}

.conversation-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.conversation-item:hover .conversation-actions,
.conversation-item.selected .conversation-actions {
  opacity: 1;
}
</style>
