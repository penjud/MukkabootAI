<template>
  <div>
    <h1 class="text-h4 mb-4">MukkabootAI Dashboard</h1>

    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="primary" class="mr-2">mdi-robot</v-icon>
            Agents
          </v-card-title>
          <v-card-text>
            <div class="text-h5 text-center">{{ agentCount }}</div>
            <div class="text-subtitle-1 text-center">Available AI Agents</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="info" class="mr-2">mdi-chat</v-icon>
            Conversations
          </v-card-title>
          <v-card-text>
            <div class="text-h5 text-center">{{ conversationCount }}</div>
            <div class="text-subtitle-1 text-center">Total Conversations</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="success" class="mr-2">mdi-brain</v-icon>
            Memory
          </v-card-title>
          <v-card-text>
            <div class="text-h5 text-center">{{ memoryEntities }}</div>
            <div class="text-subtitle-1 text-center">Memory Entities</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="warning" class="mr-2">mdi-folder</v-icon>
            Files
          </v-card-title>
          <v-card-text>
            <div class="text-h5 text-center">{{ fileCount }}</div>
            <div class="text-subtitle-1 text-center">Managed Files</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="primary" class="mr-2">mdi-server</v-icon>
            System Services
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(service, i) in services" :key="i">
                <template v-slot:prepend>
                  <v-icon :color="service.status === 'running' ? 'success' : 'error'">
                    {{ service.status === 'running' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ service.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip :color="service.status === 'running' ? 'success' : 'error'" text-color="white" size="small">
                    {{ service.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="info" class="mr-2">mdi-calendar</v-icon>
            Recent Activity
          </v-card-title>
          <v-card-text>
            <div v-if="recentActivity.length === 0" class="text-center py-4">
              No recent activity to display
            </div>
            <v-timeline v-else density="compact" align="start">
              <v-timeline-item
                v-for="(activity, i) in recentActivity"
                :key="i"
                :dot-color="activity.color"
                size="small"
              >
                <div class="text-subtitle-2">{{ activity.title }}</div>
                <div class="text-caption">{{ activity.time }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'DashboardView',
  setup() {
    const agentCount = ref(0);
    const conversationCount = ref(0);
    const memoryEntities = ref(0);
    const fileCount = ref(0);
    const services = ref([]);
    const recentActivity = ref([]);

    // Ignore common Chrome DevTools extension errors
    window.addEventListener('error', (event) => {
      if (event.message.includes('Receiving end does not exist') || 
          event.message.includes('request-get-recorder-state')) {
        event.preventDefault();
        return true;
      }
    });

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      const servicesMap = [
        { name: 'Base Service', url: 'http://localhost:3010/health' },
        { name: 'Memory Service', url: 'http://localhost:3011/health' },
        { name: 'Filesystem Service', url: 'http://localhost:3012/health' },
        { name: 'Auth Service', url: 'http://localhost:3013/health' }
      ];

      // Check all services directly
      for (const service of servicesMap) {
        try {
          const response = await fetch(service.url);
          services.value.push({
            name: service.name,
            status: response.ok ? 'running' : 'error'
          });
        } catch (error) {
          console.error(`Error checking ${service.name}:`, error);
          services.value.push({
            name: service.name,
            status: service.name === 'Auth Service' ? 'not implemented' : 'error'
          });
        }
      }

      try {
        // If there are conversations - access directly with fetch to avoid proxy issues
        const conversationsResponse = await fetch('http://localhost:3011/api/conversations');
        if (conversationsResponse.ok) {
          const data = await conversationsResponse.json();
          conversationCount.value = data.length || 0;
        } else {
          conversationCount.value = 0;
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        conversationCount.value = 0;
      }

      try {
        // If there are memory entities - access directly with fetch to avoid proxy issues
        const memoryResponse = await fetch('http://localhost:3011/api/memory/entities');
        if (memoryResponse.ok) {
          const data = await memoryResponse.json();
          memoryEntities.value = data.length || 0;
        } else {
          memoryEntities.value = 0;
        }
      } catch (error) {
        console.error('Error fetching memory entities:', error);
        memoryEntities.value = 0;
      }

      // Set some demo data
      agentCount.value = 3;
      fileCount.value = 15;
      recentActivity.value = [
        { title: 'Memory Service started', time: '2 minutes ago', color: 'success' },
        { title: 'Filesystem Service started', time: '3 minutes ago', color: 'success' },
        { title: 'Base Service started', time: '5 minutes ago', color: 'success' },
        { title: 'MukkabootAI system initialized', time: '5 minutes ago', color: 'primary' }
      ];
    };

    // Fetch data on mounted
    onMounted(fetchDashboardData);

    return {
      agentCount,
      conversationCount,
      memoryEntities,
      fileCount,
      services,
      recentActivity
    };
  }
};
</script>