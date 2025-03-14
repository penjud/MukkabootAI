<template>
  <v-card
    class="agent-card"
    :class="{ 'agent-card-selected': selected }"
    @click="$emit('click', agent)"
    height="100%"
    variant="outlined"
    :color="selected ? 'primary' : undefined"
  >
    <v-card-title class="d-flex align-center">
      <v-avatar color="primary" size="36" class="mr-2">
        <v-icon color="white">{{ icon }}</v-icon>
      </v-avatar>
      <div class="text-truncate">{{ agent.name }}</div>
      <v-spacer></v-spacer>
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
            @click.stop="$emit('chat')"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-pencil"
            title="Edit Agent"
            @click.stop="$emit('edit')"
          ></v-list-item>
          <v-list-item
            v-if="!agent.isFeatured"
            prepend-icon="mdi-content-copy"
            title="Duplicate Agent"
            @click.stop="$emit('duplicate')"
          ></v-list-item>
          <v-list-item
            v-if="agent.isFeatured"
            prepend-icon="mdi-content-copy"
            title="Use as Template"
            @click.stop="$emit('duplicate')"
          ></v-list-item>
          <v-list-item
            v-if="!agent.isFeatured"
            prepend-icon="mdi-delete"
            title="Delete Agent"
            @click.stop="$emit('delete')"
            class="text-error"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>
    
    <v-card-text class="d-flex flex-column">
      <div class="text-caption mb-2 agent-description">
        {{ agent.description || 'No description available' }}
      </div>
      
      <div class="mt-2">
        <v-chip
          size="small"
          class="mr-1 mb-1"
          color="primary-lighten-3"
        >
          {{ formatModelName(agent.model) }}
        </v-chip>
        
        <v-chip
          v-if="agent.category"
          size="small"
          class="mr-1 mb-1"
          color="grey-lighten-2"
        >
          {{ agent.category }}
        </v-chip>
      </div>
      
      <div v-if="agent.lastUsed" class="text-caption text-grey mt-2">
        Last used: {{ formatLastUsed(agent.lastUsed) }}
      </div>
    </v-card-text>
    
    <v-divider></v-divider>
    
    <v-card-actions>
      <v-btn
        variant="text"
        color="primary"
        size="small"
        prepend-icon="mdi-chat"
        @click.stop="$emit('chat')"
      >
        Chat
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-information-outline"
        @click.stop="$emit('details')"
      >
        Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { format, formatDistance } from 'date-fns';

export default {
  name: 'AgentCard',
  props: {
    agent: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    icon() {
      if (!this.agent) return 'mdi-robot';
      
      if (this.agent.icon) {
        return this.agent.icon;
      }
      
      if (this.agent.model && this.agent.model.includes('code')) {
        return 'mdi-code-braces';
      } else if (this.agent.model && this.agent.model.includes('vision')) {
        return 'mdi-eye';
      } else if (this.agent.model && (this.agent.model.includes('stable') || this.agent.model.includes('sd'))) {
        return 'mdi-image';
      } else if (this.agent.name.toLowerCase().includes('assist')) {
        return 'mdi-account-tie';
      } else if (this.agent.name.toLowerCase().includes('creative') || this.agent.name.toLowerCase().includes('write')) {
        return 'mdi-pencil';
      } else {
        return 'mdi-robot';
      }
    }
  },
  methods: {
    formatModelName(model) {
      if (!model) return 'Unknown';
      
      return model
        .replace(/:.*$/, '') // Remove version/tag part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    formatLastUsed(dateString) {
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
    }
  }
};
</script>

<style scoped>
.agent-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.agent-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.agent-card-selected {
  border: 2px solid var(--v-primary-base) !important;
}

.agent-description {
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>