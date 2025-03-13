<template>
  <div>
    <h1 class="text-h4 mb-4">Memory Management</h1>
    
    <v-card class="mb-4 pa-4">
      <div class="text-center">
        <v-icon size="64" color="primary">mdi-brain</v-icon>
        <div class="text-h5 mt-4">Memory Module</div>
        <div class="text-body-1 mt-2">
          This feature is coming soon. Memory management will allow you to view and manage conversation history, 
          knowledge entities, and relations between them.
        </div>
        <v-btn color="primary" class="mt-4" @click="loadSampleData">
          Load Sample Data
        </v-btn>
      </div>
    </v-card>
    
    <v-row v-if="showSampleData">
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="primary" class="mr-2">mdi-database</v-icon>
            Entities
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(entity, i) in entities" :key="i" :title="entity.name" :subtitle="entity.entityType">
                <template v-slot:prepend>
                  <v-avatar color="primary" size="36">
                    <v-icon color="white">mdi-cube</v-icon>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left color="primary" class="mr-2">mdi-relation-many-to-many</v-icon>
            Relations
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(relation, i) in relations" :key="i" :title="`${relation.from} → ${relation.to}`" :subtitle="relation.relationType">
                <template v-slot:prepend>
                  <v-avatar color="info" size="36">
                    <v-icon color="white">mdi-arrow-right</v-icon>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'MemoryView',
  setup() {
    const showSampleData = ref(false);
    const entities = ref([]);
    const relations = ref([]);
    
    const loadSampleData = () => {
      showSampleData.value = true;
      
      // Sample entities
      entities.value = [
        { id: 'e1', name: 'Climate Change', entityType: 'Topic', observations: ['Global warming impacts', 'Rising sea levels'] },
        { id: 'e2', name: 'Green Energy', entityType: 'Topic', observations: ['Solar power', 'Wind energy'] },
        { id: 'e3', name: 'Paris Agreement', entityType: 'Document', observations: ['International treaty', 'Climate goals'] },
        { id: 'e4', name: 'Carbon Emissions', entityType: 'Concept', observations: ['Greenhouse gases', 'Industrial pollution'] },
        { id: 'e5', name: 'Renewable Resources', entityType: 'Category', observations: ['Sustainable materials', 'Recyclable products'] }
      ];
      
      // Sample relations
      relations.value = [
        { id: 'r1', from: 'Climate Change', to: 'Carbon Emissions', relationType: 'caused by' },
        { id: 'r2', from: 'Green Energy', to: 'Renewable Resources', relationType: 'subset of' },
        { id: 'r3', from: 'Paris Agreement', to: 'Climate Change', relationType: 'addresses' },
        { id: 'r4', from: 'Carbon Emissions', to: 'Green Energy', relationType: 'mitigated by' },
        { id: 'r5', from: 'Renewable Resources', to: 'Carbon Emissions', relationType: 'reduces' }
      ];
    };
    
    return {
      showSampleData,
      entities,
      relations,
      loadSampleData
    };
  }
};
</script>
