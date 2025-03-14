/**
 * Fix for MukkabootAI Agents Page Rendering Issue
 * 
 * This script modifies the necessary files to fix the Agents page
 * rendering issue where components are not properly rendered.
 */

const fs = require('fs');
const path = require('path');

// Paths
const basePath = '/home/mothership/MukkabootAI/frontend/vue-dashboard';
const agentsViewPath = path.join(basePath, 'src/views/AgentsView.vue');
const mainJsPath = path.join(basePath, 'src/main.js');

// Fix 1: Ensure components are registered globally
function fixMainJs() {
  try {
    console.log('Reading main.js...');
    let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    // Check if agent component registration exists
    if (!mainJsContent.includes('app.component(\'AgentCard\'')) {
      console.log('Adding global component registration for agent components...');
      
      // Find the location to insert the component registration (after other global components)
      const registerComponentsRegex = /\/\/ Register global components[\s\S]+?app\.component\('[^']+',\s*[^)]+\);/;
      const registerComponentsMatch = mainJsContent.match(registerComponentsRegex);
      
      if (registerComponentsMatch) {
        const insertPosition = registerComponentsMatch.index + registerComponentsMatch[0].length;
        
        // Add agent component registrations
        const newRegistrations = `

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
app.component('AgentWizardTab', AgentWizardTab);`;
        
        // Insert the new registrations
        mainJsContent = 
          mainJsContent.substring(0, insertPosition) + 
          newRegistrations + 
          mainJsContent.substring(insertPosition);
          
        // Write the updated content
        fs.writeFileSync(mainJsPath, mainJsContent, 'utf8');
        console.log('main.js updated successfully.');
      } else {
        console.error('Could not find component registration section in main.js');
      }
    } else {
      console.log('Agent components are already registered globally. No changes needed.');
    }
  } catch (error) {
    console.error('Error updating main.js:', error);
  }
}

// Fix 2: Update AgentsView.vue to ensure proper component loading
function fixAgentsView() {
  try {
    console.log('Reading AgentsView.vue...');
    let agentsViewContent = fs.readFileSync(agentsViewPath, 'utf8');
    
    // Check and fix component imports if needed
    if (!agentsViewContent.includes('async components')) {
      console.log('Updating AgentsView.vue component imports...');
      
      // Replace the existing import section with updated imports
      const importSectionRegex = /import \{[^}]+\} from 'vue'[\s\S]+?components: \{[^}]+\},/;
      const importSectionMatch = agentsViewContent.match(importSectionRegex);
      
      if (importSectionMatch) {
        const oldImportSection = importSectionMatch[0];
        
        // Create new import section with explicit component registration
        const newImportSection = `import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, formatDistance } from 'date-fns';
import { useAgentsStore } from '../stores/agents';
import { selectAgentForChat } from '../services/chat-agent.service';

// Import components explicitly
import MyAgentsTab from '../components/agents/tabs/MyAgentsTab.vue';
import FeaturedTab from '../components/agents/tabs/FeaturedTab.vue';
import AgentWizardTab from '../components/agents/tabs/AgentWizardTab.vue';
import AgentCard from '../components/agents/AgentCard.vue';
import AgentListItem from '../components/agents/AgentListItem.vue';

export default {
  name: 'AgentsView',
  components: {
    MyAgentsTab,
    FeaturedTab,
    AgentWizardTab,
    AgentCard,
    AgentListItem,
  },`;
        
        // Replace the old import section with the new one
        agentsViewContent = agentsViewContent.replace(oldImportSection, newImportSection);
        
        // Write the updated content
        fs.writeFileSync(agentsViewPath, agentsViewContent, 'utf8');
        console.log('AgentsView.vue updated successfully.');
      } else {
        console.error('Could not find import section in AgentsView.vue');
      }
    } else {
      console.log('AgentsView.vue imports are already updated. No changes needed.');
    }
    
    // Ensure lazy loading is disabled by setting "eager" prop
    if (!agentsViewContent.includes('eager')) {
      console.log('Adding eager prop to v-window-item components...');
      
      // Add eager prop to the v-window-item tags
      agentsViewContent = agentsViewContent.replace(
        /<v-window-item\s+value="my-agents"/g, 
        '<v-window-item value="my-agents" eager'
      );
      
      agentsViewContent = agentsViewContent.replace(
        /<v-window-item\s+value="featured"/g, 
        '<v-window-item value="featured" eager'
      );
      
      agentsViewContent = agentsViewContent.replace(
        /<v-window-item\s+value="wizard"/g, 
        '<v-window-item value="wizard" eager'
      );
      
      // Write the updated content
      fs.writeFileSync(agentsViewPath, agentsViewContent, 'utf8');
      console.log('Added eager prop to window items.');
    } else {
      console.log('Eager prop already exists on window items.');
    }
  } catch (error) {
    console.error('Error updating AgentsView.vue:', error);
  }
}

// Run fixes
console.log('Starting MukkabootAI Agents View fix...');
fixMainJs();
fixAgentsView();
console.log('Fixes completed. Please rebuild the application and restart the server.');
