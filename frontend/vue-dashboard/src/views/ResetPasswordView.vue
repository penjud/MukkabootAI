<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Reset Password</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert v-if="authStore.hasError" type="error" dismissible @click="authStore.clearError()">
              {{ authStore.errorMessage }}
            </v-alert>
            <v-alert v-if="successMessage" type="success" dismissible @click="successMessage = ''">
              {{ successMessage }}
            </v-alert>
            
            <v-form ref="form" v-model="valid" @submit.prevent="requestReset">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                prepend-inner-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" @click="$router.push('/login')">
              Back to Login
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="authStore.isLoading"
              :disabled="!valid || authStore.isLoading"
              @click="requestReset"
            >
              Reset Password
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Form data and validation
const form = ref(null);
const valid = ref(false);
const email = ref('');
const successMessage = ref('');

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
];

// Request password reset
const requestReset = async () => {
  if (!valid.value || !form.value) return;
  
  try {
    await authStore.requestPasswordReset(email.value);
    
    // Show success message
    successMessage.value = 'Password reset instructions have been sent to your email.';
    
    // Clear form
    email.value = '';
    form.value.reset();
  } catch (error) {
    // Error is handled in the store
    console.error('Password reset request failed:', error);
  }
};
</script>
