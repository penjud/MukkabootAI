<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>MukkabootAI Dashboard</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item title="MukkabootAI" subtitle="AI Assistant Platform"></v-list-item>
        <v-divider></v-divider>
        <v-list-item v-for="(item, i) in menuItems" :key="i" :to="item.route" :prepend-icon="item.icon" :title="item.title"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>

    <v-footer app>
      <span class="text-caption">MukkabootAI &copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
import { ref } from 'vue';
import { useTheme } from 'vuetify';

export default {
  name: 'App',
  setup() {
    const drawer = ref(false);
    const theme = useTheme();

    // Navigation menu items
    const menuItems = [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', route: '/' },
      { title: 'Chat', icon: 'mdi-chat', route: '/chat' },
      { title: 'Memory', icon: 'mdi-brain', route: '/memory' },
      { title: 'Files', icon: 'mdi-folder', route: '/files' },
      { title: 'Agents', icon: 'mdi-robot', route: '/agents' },
      { title: 'Settings', icon: 'mdi-cog', route: '/settings' }
    ];

    // Toggle between light and dark theme
    const toggleTheme = () => {
      theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
    };

    return {
      drawer,
      menuItems,
      theme,
      toggleTheme
    };
  }
};
</script>

<style>
/* Global styles */
</style>