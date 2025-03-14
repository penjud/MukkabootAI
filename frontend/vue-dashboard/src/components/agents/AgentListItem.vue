<template>
  <v-list-item
    :title="agent.name"
    :subtitle="agent.description || formatModelName(agent.model)"
    :class="{ 'list-item-selected': selected }"
    @click="$emit('click', agent)"
  >
    <template v-slot:prepend>
      <v-avatar color="primary" size="36">
        <v-icon color="white">{{ icon }}</v-icon>
      </v-avatar>
    </template>
    
    <template v-slot:append>
      <div class="d-flex align-center">
        <v-chip
          size="small"
          class="mr-2"
          color="primary-lighten-3"
        >
          {{ formatModelName(agent.model) }}
        </v-chip>
        
        <v-chip
          v-if="agent.lastUsed"
          size="x-small"
          class="mr-2"
          color="grey-lighten-3"
        >
          {{ formatLastUsed(agent.lastUsed) }}
        </v-chip>
        
        <v-btn
          icon="mdi-chat"
          variant="text"
          size="small"
          color="primary"
          class="mr-1"
          @click.stop="$emit('chat')"
          title="Chat with Agent"
        ></v-btn>
        
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
              prepend-icon="mdi-information-outline"
              title="View Details"
              @click.stop="$emit('details')"
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
      </div>
    </template>
  </v-list-item>
</template>

<script>
import { format, formatDistance } from 'date-fns';

export default {
  name: 'AgentListItem',
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
        
        // If it's within the last week, show day
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
          return formatDistance(date, now, { addSuffix: true });
        }
        
        // Otherwise show the date
        return format(date, 'MMM d');
      } catch (error) {
        return 'Unknown';
      }
    }
  }
};
</script>

<style scoped>
.list-item-selected {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>