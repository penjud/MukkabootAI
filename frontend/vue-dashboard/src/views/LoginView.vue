<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>MukkabootAI Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert v-if="authStore.hasError" type="error" dismissible @click="authStore.clearError()">
              {{ authStore.errorMessage }}
            </v-alert>
            <v-form ref="form" v-model="valid" @submit.prevent="login">
              <v-text-field
                v-model="username"
                :rules="usernameRules"
                label="Username"
                name="username"
                prepend-inner-icon="mdi-account"
                type="text"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                :rules="passwordRules"
                label="Password"
                name="password"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                :type="showPassword ? 'text' : 'password'"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="authStore.isLoading"
              :disabled="!valid || authStore.isLoading"
              @click="login"
            >
              Login
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            <v-btn variant="text" @click="$router.push('/reset-password')">
              Forgot Password?
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form data and validation
const form = ref(null);
const valid = ref(false);
const username = ref('');
const password = ref('');
const showPassword = ref(false);

// Validation rules
const usernameRules = [
  v => !!v || 'Username is required',
  v => v.length >= 3 || 'Username must be at least 3 characters'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

// Login function
const login = async () => {
  if (!valid.value || !form.value) return;
  
  try {
    await authStore.login({
      username: username.value,
      password: password.value
    });
    
    // Redirect to dashboard on success (root path where dashboard is mounted)
    router.push('/');
  } catch (error) {
    // Error is handled in the store
    console.error('Login failed:', error);
  }
};
</script>