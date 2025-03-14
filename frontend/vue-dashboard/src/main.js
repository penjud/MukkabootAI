import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAgentsStore } from './stores/agents';
import App from './App.vue';
import router from './router';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

// Global components
import SkeletonLoader from './components/SkeletonLoader.vue';
import ActivityFeed from './components/ActivityFeed.vue';
import ServiceStatus from './components/ServiceStatus.vue';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00'
        }
      }
    }
  }
});

// Create the app
const app = createApp(App);

// Register global components
app.component('SkeletonLoader', SkeletonLoader);

// Register agent components
import AgentCard from './components/agents/AgentCard.vue';
import AgentListItem from './components/agents/AgentListItem.vue';
import MyAgentsTab from './components/agents/tabs/MyAgentsTab.vue';
import FeaturedTab from './components/agents/tabs/FeaturedTab.vue';
import AgentWizardTab from './components/agents/tabs/AgentWizardTab.vue';

app.component('AgentCard', AgentCard);
app.component('AgentListItem', AgentListItem);
app.component('MyAgentsTab', MyAgentsTab);
app.component('FeaturedTab', FeaturedTab);
app.component('AgentWizardTab', AgentWizardTab);
app.component('ActivityFeed', ActivityFeed);
app.component('ServiceStatus', ServiceStatus);

// Create pinia
const pinia = createPinia();

// Use plugins
app.use(pinia);
app.use(router);
app.use(vuetify);

// Initialize stores
const agentsStore = useAgentsStore(pinia);

// Mount the app
app.mount('#app');