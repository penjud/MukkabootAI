<template>
  <div class="not-found-container">
    <v-card class="pa-6 text-center">
      <v-icon size="128" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
      <h1 class="text-h2 mb-4">404</h1>
      <h2 class="text-h4 mb-6">Page Not Found</h2>
      <p class="text-body-1 mb-6">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <v-btn color="primary" size="large" to="/">
        Return to Dashboard
      </v-btn>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 200px);
}
</style>
