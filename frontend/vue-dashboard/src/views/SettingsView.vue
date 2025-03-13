<template>
  <div>
    <h1 class="text-h4 mb-4">Settings</h1>
    
    <v-card class="mb-4">
      <v-card-title>
        <v-icon left color="primary" class="mr-2">mdi-cog</v-icon>
        System Settings
      </v-card-title>
      <v-card-text>
        <v-form>
          <v-checkbox
            v-model="settings.darkMode"
            label="Dark Mode"
            hint="Use dark theme for the application"
            persistent-hint
          ></v-checkbox>
          
          <v-divider class="my-4"></v-divider>
          
          <v-select
            v-model="settings.language"
            :items="languages"
            label="Language"
            item-title="name"
            item-value="code"
          ></v-select>
          
          <v-divider class="my-4"></v-divider>
          
          <v-select
            v-model="settings.defaultModel"
            :items="models"
            label="Default AI Model"
            item-title="name"
            item-value="id"
          ></v-select>
          
          <v-divider class="my-4"></v-divider>
          
          <v-file-input
            v-model="settings.customAvatar"
            label="Custom Avatar"
            accept="image/*"
            prepend-icon="mdi-camera"
            hint="Upload a custom avatar image"
            persistent-hint
          ></v-file-input>
          
          <v-btn color="primary" class="mt-4" @click="saveSettings">
            Save Settings
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-title>
        <v-icon left color="primary" class="mr-2">mdi-server</v-icon>
        Service Status
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
        <v-btn color="primary" class="mt-4" @click="refreshServices">
          Refresh Status
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';

export default {
  name: 'SettingsView',
  setup() {
    const settings = ref({
      darkMode: false,
      language: 'en',
      defaultModel: 'llama3',
      customAvatar: null
    });
    
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'de', name: 'German' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' }
    ];
    
    const models = [
      { id: 'llama3', name: 'Llama 3' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'gemma', name: 'Gemma' },
      { id: 'mixtral', name: 'Mixtral 8x7B' },
      { id: 'phi2', name: 'Phi-2' }
    ];
    
    const services = ref([
      { name: 'Base Service', status: 'running' },
      { name: 'Memory Service', status: 'running' },
      { name: 'Filesystem Service', status: 'running' },
      { name: 'Auth Service', status: 'not implemented' },
      { name: 'Ollama Bridge', status: 'not implemented' }
    ]);
    
    const saveSettings = () => {
      // In a real implementation, this would save to the server
      alert('Settings saved successfully!');
    };
    
    const refreshServices = async () => {
      try {
        // Base Service
        const baseResponse = await axios.get('/api/health');
        services.value[0].status = baseResponse.status === 200 ? 'running' : 'error';
      } catch (error) {
        services.value[0].status = 'error';
      }

      try {
        // Memory Service
        const memoryResponse = await axios.get('/api/memory/health');
        services.value[1].status = memoryResponse.status === 200 ? 'running' : 'error';
      } catch (error) {
        services.value[1].status = 'error';
      }

      try {
        // Filesystem Service
        const filesystemResponse = await axios.get('/api/filesystem/health');
        services.value[2].status = filesystemResponse.status === 200 ? 'running' : 'error';
      } catch (error) {
        services.value[2].status = 'error';
      }
    };
    
    return {
      settings,
      languages,
      models,
      services,
      saveSettings,
      refreshServices
    };
  }
};
</script>
