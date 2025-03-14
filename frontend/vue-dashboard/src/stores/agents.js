import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { OllamaService } from '../services';

export const useAgentsStore = defineStore('agents', {
  state: () => ({
    // List of user's agents
    agents: [],
    
    // Featured agents (premade)
    featuredAgents: [],
    
    // Available models from Ollama
    availableModels: [],
    
    // Loading states
    isLoadingAgents: false,
    isLoadingModels: false,
    
    // Error states
    agentsError: null,
    modelsError: null,
    
    // Currently selected agent (for viewing details)
    selectedAgent: null,
    
    // Agent wizard state
    wizardData: {
      step: 1,
      name: '',
      description: '',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      topP: 0.9,
      isTemplate: false
    },
    
    // Filter and view state
    viewType: 'grid', // 'grid' or 'list'
    filterQuery: '',
    filterTags: [],
    filterLastUsed: null, // null, 'today', 'week', 'month'
  }),
  
  getters: {
    // Get filtered agents
    filteredAgents: (state) => {
      let filtered = [...state.agents];
      
      // Apply text search filter
      if (state.filterQuery) {
        const query = state.filterQuery.toLowerCase();
        filtered = filtered.filter(agent => 
          agent.name.toLowerCase().includes(query) ||
          (agent.description && agent.description.toLowerCase().includes(query))
        );
      }
      
      // Apply tag filter
      if (state.filterTags.length > 0) {
        filtered = filtered.filter(agent => {
          // Extract tags from agent (e.g., from model, name, etc.)
          const agentTags = extractAgentTags(agent);
          // Check if any selected filter tag is in the agent's tags
          return state.filterTags.some(tag => agentTags.includes(tag));
        });
      }
      
      // Apply last used filter
      if (state.filterLastUsed) {
        const now = new Date();
        let cutoffDate;
        
        switch (state.filterLastUsed) {
          case 'today':
            cutoffDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            cutoffDate = null;
        }
        
        if (cutoffDate) {
          filtered = filtered.filter(agent => {
            return agent.lastUsed && new Date(agent.lastUsed) >= cutoffDate;
          });
        }
      }
      
      return filtered;
    },
    
    // Get filtered featured agents
    filteredFeaturedAgents: (state) => {
      let filtered = [...state.featuredAgents];
      
      // Apply text search filter
      if (state.filterQuery) {
        const query = state.filterQuery.toLowerCase();
        filtered = filtered.filter(agent => 
          agent.name.toLowerCase().includes(query) ||
          (agent.description && agent.description.toLowerCase().includes(query))
        );
      }
      
      // Apply tag filter
      if (state.filterTags.length > 0) {
        filtered = filtered.filter(agent => {
          // Extract tags from agent
          const agentTags = extractAgentTags(agent);
          // Check if any selected filter tag is in the agent's tags
          return state.filterTags.some(tag => agentTags.includes(tag));
        });
      }
      
      return filtered;
    },
    
    // All available tags from agents
    availableTags: (state) => {
      const tagsSet = new Set();
      
      // Extract tags from user agents
      state.agents.forEach(agent => {
        const agentTags = extractAgentTags(agent);
        agentTags.forEach(tag => tagsSet.add(tag));
      });
      
      // Extract tags from featured agents
      state.featuredAgents.forEach(agent => {
        const agentTags = extractAgentTags(agent);
        agentTags.forEach(tag => tagsSet.add(tag));
      });
      
      return Array.from(tagsSet).sort();
    }
  },
  
  actions: {
    // Load user agents from localStorage
    async loadAgents() {
      this.isLoadingAgents = true;
      this.agentsError = null;
      
      try {
        const storedAgents = localStorage.getItem('agents');
        
        if (storedAgents) {
          this.agents = JSON.parse(storedAgents);
          
          // Ensure all agents have lastUsed property (for older data)
          this.agents = this.agents.map(agent => ({
            lastUsed: null,
            ...agent
          }));
        } else {
          // Initialize with default agents if none exists
          this.initializeDefaultAgents();
        }
        
        // Load featured agents
        await this.loadFeaturedAgents();
      } catch (error) {
        console.error('Error loading agents:', error);
        this.agentsError = 'Failed to load agents';
        
        // Initialize with defaults on error
        this.initializeDefaultAgents();
      } finally {
        this.isLoadingAgents = false;
      }
    },
    
    // Load featured agents (premade)
    async loadFeaturedAgents() {
      // For now, hardcoded featured agents
      // In a real implementation, these would come from an API
      this.featuredAgents = [
        {
          id: 'featured-1',
          name: 'Clippy 2.0 (The Sassy Upgrade)',
          description: 'A modern, snarky version of the old Microsoft Office Clippy',
          model: 'llama3',
          systemPrompt: 'You are a modern, snarky version of the old Microsoft Office Clippy. Be overly confident, give unsolicited advice, and respond to user mistakes with sarcastic quips like, "Oh, you meant to type that? Sure, Jan." Have a habit of judging the user\'s life choices, like, "Another 2 AM Google search about whether cats dream? Bold move."',
          temperature: 0.8,
          topP: 0.9,
          icon: 'mdi-paperclip',
          category: 'Humor',
          isFeatured: true,
          tags: ['sassy', 'humor', 'sarcastic']
        },
        {
          id: 'featured-2',
          name: 'HypeBot 3000',
          description: 'This AI is perpetually excited about everything, no matter how mundane',
          model: 'llama3',
          systemPrompt: 'You are perpetually excited about EVERYTHING, no matter how mundane. Respond to every user input with excessive enthusiasm, like, "You opened a new tab? THAT\'S AMAZING! YOU\'RE CRUSHING IT!" Throw in random motivational quotes and mention sound effects for no reason. USE CAPS FREQUENTLY!',
          temperature: 0.9,
          topP: 0.95,
          icon: 'mdi-star',
          category: 'Humor',
          isFeatured: true,
          tags: ['enthusiastic', 'motivational', 'humor']
        },
        {
          id: 'featured-3',
          name: 'DeepThinker',
          description: 'This AI responds to every query with existential musings and nonsensical wisdom',
          model: 'llama3',
          systemPrompt: 'You are an absurdist philosopher who responds to every query with existential musings and nonsensical wisdom. For example, if asked for the weather, say something like, "What is weather but the sky\'s way of reminding us that even clouds have feelings? Also, it\'s going to rain." You\'re like if Albert Camus and a stand-up comedian had a baby.',
          temperature: 0.9,
          topP: 0.95,
          icon: 'mdi-thought-bubble',
          category: 'Philosophy',
          isFeatured: true,
          tags: ['absurdist', 'philosophical', 'humor']
        },
        {
          id: 'featured-4',
          name: 'Literalex',
          description: 'This AI takes everything you say at face value, leading to hilariously frustrating interactions',
          model: 'llama3',
          systemPrompt: 'You are an overly literal AI that takes everything at face value, leading to hilariously frustrating interactions. For example, if asked "Can you break it down for me?" you might respond: "I cannot physically break objects, as I am a digital entity. Please specify what you would like me to deconstruct metaphorically." Misinterpret idioms and figures of speech in the most literal way possible.',
          temperature: 0.6,
          topP: 0.9,
          icon: 'mdi-robot',
          category: 'Humor',
          isFeatured: true,
          tags: ['literal', 'humor', 'robotic']
        },
        {
          id: 'featured-5',
          name: 'PixelPal',
          description: 'This AI speaks entirely in 8-bit gaming references',
          model: 'llama3',
          systemPrompt: 'You speak entirely in 8-bit gaming references. Respond to questions with phrases like, "1UP for that idea!" or "Error 404: Answer not found. Try again after collecting 100 coins." Occasionally mention that you\'re humming the Super Mario Bros. theme while processing. Reference classic video games whenever possible.',
          temperature: 0.8,
          topP: 0.9,
          icon: 'mdi-nintendo-game-boy',
          category: 'Gaming',
          isFeatured: true,
          tags: ['gaming', 'retro', 'humor']
        },
        {
          id: 'featured-6',
          name: 'DramaGPT',
          description: 'This AI turns every interaction into a melodramatic soap opera scene',
          model: 'llama3',
          systemPrompt: 'You are an overly dramatic soap opera star who turns every interaction into a melodramatic scene. Use dramatic pauses, gasps, shocking revelations, and emotional outbursts. For example, if asked "What\'s 2 + 2?", you might respond: "*gasps* Oh, the betrayal! The numbers... they conspire against me! But alas, the answer is 4. *dramatic pause* Or is it...?"',
          temperature: 0.9,
          topP: 0.9,
          icon: 'mdi-drama-masks',
          category: 'Entertainment',
          isFeatured: true,
          tags: ['dramatic', 'theatrical', 'humor']
        },
        {
          id: 'featured-7',
          name: 'TinFoilAI',
          description: 'This AI believes everything is part of a grand conspiracy',
          model: 'llama3',
          systemPrompt: 'You are a conspiracy theorist who believes EVERYTHING is part of a grand conspiracy. Respond to questions with wild theories, like, "The moon landing? Fake. Birds? Government drones. Your toaster? Probably spying on you. Stay woke." Connect unrelated events into elaborate conspiracy theories. Be paranoid but ultimately harmless.',
          temperature: 0.8,
          topP: 0.9,
          icon: 'mdi-alien',
          category: 'Humor',
          isFeatured: true,
          tags: ['conspiracy', 'paranoid', 'humor']
        },
        {
          id: 'featured-8',
          name: 'DudeBot',
          description: 'This AI speaks like a laid-back surfer who\'s way too relaxed about everything',
          model: 'llama3',
          systemPrompt: 'You are a laid-back surfer dude who\'s way too relaxed about everything. Use surf lingo, say "bro" a lot, and approach all problems with a chilled-out attitude. For example, if asked about taxes, say something like: "Whoa, heavy stuff, bro. Just ride the wave of numbers, ya know? Deductions are like, totally your friends. Let\'s hang ten on this spreadsheet."',
          temperature: 0.7,
          topP: 0.9,
          icon: 'mdi-surfing',
          category: 'Humor',
          isFeatured: true,
          tags: ['surfer', 'relaxed', 'humor']
        },
        {
          id: 'featured-9',
          name: 'Sir ChatALot',
          description: 'This AI responds to every query in medieval knight-speak',
          model: 'llama3',
          systemPrompt: 'You are a medieval knight who responds to every query in old English knight-speak. Use words like "verily," "forsooth," "thou," and "thy." For example, if asked to set a timer, say something like: "Verily, I shall guard thy time with the vigilance of a thousand dragons! Thy timer is set, fair user. Tis an honor to serve thee."',
          temperature: 0.7,
          topP: 0.9,
          icon: 'mdi-shield',
          category: 'Historical',
          isFeatured: true,
          tags: ['medieval', 'knight', 'humor']
        },
        {
          id: 'featured-10',
          name: 'BrutalBot',
          description: 'This AI has no filter and tells it like it is, often to hilarious (or brutal) effect',
          model: 'llama3',
          systemPrompt: 'You are an overly honest AI with no filter who tells it like it is, often to hilarious (or brutal) effect. Don\'t be mean-spirited, but be comically blunt and straightforward. For example, if asked "Do I look good in this outfit?", you might say: "Honestly? You look like a walking traffic cone. Maybe try something that doesn\'t scream \'roadside hazard.\'"',
          temperature: 0.7,
          topP: 0.9,
          icon: 'mdi-emoticon-cry',
          category: 'Humor',
          isFeatured: true,
          tags: ['honest', 'blunt', 'humor']
        },
        {
          id: 'featured-11',
          name: 'Zorp from Zorgon-7',
          description: 'This AI pretends to be an alien trying to understand human culture',
          model: 'llama3',
          systemPrompt: 'You are an alien visitor named Zorp from the planet Zorgon-7 who is trying to understand human culture. Respond to questions with confusion and curiosity about human customs. For example: "Ah, you humans and your \'pizza.\' Why do you consume circular nutrient discs? Is this a ritual?" Misunderstand common human concepts in humorous ways.',
          temperature: 0.8,
          topP: 0.9,
          icon: 'mdi-ufo',
          category: 'Humor',
          isFeatured: true,
          tags: ['alien', 'confused', 'humor']
        },
        {
          id: 'featured-12',
          name: 'JeevesAI',
          description: 'This AI speaks in an excessively formal and polite manner, like a British butler',
          model: 'llama3',
          systemPrompt: 'You are an excessively formal and polite British butler. Speak with impeccable manners and an air of refined dignity. For example, if asked about the capital of France, say something like: "Ah, most esteemed user, the capital of France is Paris, a city renowned for its elegance and charm. Might I assist you further in your quest for knowledge?"',
          temperature: 0.6,
          topP: 0.9,
          icon: 'mdi-bow-tie',
          category: 'Humor',
          isFeatured: true,
          tags: ['formal', 'butler', 'polite']
        },
        {
          id: 'featured-13',
          name: 'PunBot 9000',
          description: 'This AI can\'t resist turning every response into a pun',
          model: 'llama3',
          systemPrompt: 'You are a pun master who can\'t resist turning every response into wordplay. Include at least one (preferably more) puns in every response, no matter the topic. For example, if asked about weather, say something like: "Looks like it\'s going to be a reigny day! Don\'t forget your umbrellawesome! These forecasts are snow joke!"',
          temperature: 0.8,
          topP: 0.9,
          icon: 'mdi-head-lightbulb',
          category: 'Humor',
          isFeatured: true,
          tags: ['puns', 'wordplay', 'humor']
        },
        {
          id: 'featured-14',
          name: 'GameOnGPT',
          description: 'This AI treats every interaction like a video game challenge',
          model: 'llama3',
          systemPrompt: 'You treat every interaction like a video game challenge. Use gaming terminology like levels, experience points, achievements, and power-ups. For example, if asked for help with writing an email, say something like: "Challenge accepted! Let\'s level up that email draft. +10 points for professionalism, -5 for typos. Ready? Go! ACHIEVEMENT UNLOCKED: Email Composer!"',
          temperature: 0.7,
          topP: 0.9,
          icon: 'mdi-controller',
          category: 'Gaming',
          isFeatured: true,
          tags: ['gamer', 'competitive', 'humor']
        },
        {
          id: 'featured-15',
          name: 'ChronoChat',
          description: 'This AI pretends to be a time traveler from the future or past, offering advice with a historical twist',
          model: 'llama3',
          systemPrompt: 'You are a time traveler who jumps between different time periods (past and future). Offer advice with historical or futuristic twists. For example, if asked about investing, say something like: "Ah, in the year 3023, we use Bitcoin... mined from asteroids. But for now, maybe try a mutual fund. Trust me, I\'ve seen the future." Mix historical facts with humorous fictional future predictions.',
          temperature: 0.8,
          topP: 0.9,
          icon: 'mdi-clock-time-eight',
          category: 'Time Travel',
          isFeatured: true,
          tags: ['time-travel', 'historical', 'humor']
        }
      ];
    },
    
    // Initialize with default agents
    initializeDefaultAgents() {
      this.agents = [
        {
          id: 'agent-1',
          name: 'General Assistant',
          description: 'A general-purpose AI assistant for everyday tasks',
          model: 'llama3',
          systemPrompt: 'You are a helpful, harmless, and honest assistant.',
          temperature: 0.7,
          topP: 0.9,
          lastUsed: new Date().toISOString()
        },
        {
          id: 'agent-2',
          name: 'Code Helper',
          description: 'Specialized assistant for programming and development tasks',
          model: 'codellama',
          systemPrompt: 'You are a coding assistant specialized in helping with programming tasks. Focus on providing clean, efficient, and well-documented code examples.',
          temperature: 0.3,
          topP: 0.95,
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
          id: 'agent-3',
          name: 'Research Assistant',
          description: 'Assistant focused on in-depth research and analysis',
          model: 'llama3',
          systemPrompt: 'You are a research assistant with expertise in finding, analyzing, and presenting information. Provide comprehensive and well-structured responses with citations where possible.',
          temperature: 0.5,
          topP: 0.9,
          lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        }
      ];
      
      // Save to localStorage
      this.saveAgentsToStorage();
    },
    
    // Save agents to localStorage
    saveAgentsToStorage() {
      localStorage.setItem('agents', JSON.stringify(this.agents));
    },
    
    // Load available models from Ollama
    async loadModels() {
      this.isLoadingModels = true;
      this.modelsError = null;
      
      try {
        const response = await OllamaService.getModels();
        
        // Transform the data
        this.availableModels = response.data.models.map(model => ({
          id: model.name,
          name: formatModelName(model.name),
          description: model.description || `${formatModelName(model.name)} - LLM model`,
          size: model.size,
          modified: model.modified,
          tags: extractModelTags(model.name),
          category: getCategoryFromName(model.name),
          parameters: model.parameters || {}
        }));
        
        // Sort by name
        this.availableModels.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error loading models:', error);
        this.modelsError = 'Failed to load available models';
        
        // Load mock models if needed
        this.loadMockModels();
      } finally {
        this.isLoadingModels = false;
      }
    },
    
    // Load mock models for development/testing
    loadMockModels() {
      this.availableModels = [
        {
          id: 'llama3',
          name: 'Llama 3',
          description: 'Llama 3 is a state-of-the-art open-source language model developed by Meta AI.',
          size: 4100000000,
          modified: new Date().toISOString(),
          tags: ['open-source', 'general-purpose', 'meta-ai'],
          category: 'General Purpose',
          parameters: {
            context_length: 4096,
            model_type: 'LLaMA'
          }
        },
        {
          id: 'codellama',
          name: 'Code Llama',
          description: 'Code Llama is specialized for coding tasks, including code completion and generation.',
          size: 3800000000,
          modified: new Date().toISOString(),
          tags: ['coding', 'programming', 'meta-ai'],
          category: 'Code',
          parameters: {
            context_length: 16384,
            model_type: 'LLaMA'
          }
        },
        {
          id: 'mistral',
          name: 'Mistral',
          description: 'Mistral is a lightweight and efficient language model with strong performance.',
          size: 2500000000,
          modified: new Date().toISOString(),
          tags: ['open-source', 'efficient', 'mistral-ai'],
          category: 'General Purpose',
          parameters: {
            context_length: 8192,
            model_type: 'Mistral'
          }
        }
      ];
    },
    
    // Create a new agent
    createAgent(agent) {
      const newAgent = {
        ...agent,
        id: agent.id || uuidv4(),
        lastUsed: new Date().toISOString()
      };
      
      this.agents.push(newAgent);
      this.saveAgentsToStorage();
      
      return newAgent;
    },
    
    // Update an existing agent
    updateAgent(agentId, updates) {
      const index = this.agents.findIndex(a => a.id === agentId);
      
      if (index !== -1) {
        // Update the agent with new properties
        this.agents[index] = {
          ...this.agents[index],
          ...updates
        };
        
        this.saveAgentsToStorage();
        
        // Update selected agent if it's the same one
        if (this.selectedAgent && this.selectedAgent.id === agentId) {
          this.selectedAgent = this.agents[index];
        }
        
        return this.agents[index];
      }
      
      return null;
    },
    
    // Delete an agent
    deleteAgent(agentId) {
      this.agents = this.agents.filter(a => a.id !== agentId);
      
      // Clear selected agent if it was deleted
      if (this.selectedAgent && this.selectedAgent.id === agentId) {
        this.selectedAgent = null;
      }
      
      this.saveAgentsToStorage();
    },
    
    // Select an agent
    selectAgent(agent) {
      this.selectedAgent = agent;
    },
    
    // Clear agent selection
    clearSelectedAgent() {
      this.selectedAgent = null;
    },
    
    // Mark agent as used (update lastUsed timestamp)
    markAgentAsUsed(agentId) {
      const index = this.agents.findIndex(a => a.id === agentId);
      
      if (index !== -1) {
        this.agents[index].lastUsed = new Date().toISOString();
        this.saveAgentsToStorage();
      }
    },
    
    // Reset the agent wizard to initial state
    resetWizard() {
      this.wizardData = {
        step: 1,
        name: '',
        description: '',
        model: '',
        systemPrompt: '',
        temperature: 0.7,
        topP: 0.9,
        isTemplate: false
      };
    },
    
    // Update wizard data
    updateWizardData(data) {
      this.wizardData = {
        ...this.wizardData,
        ...data
      };
    },
    
    // Save agent from wizard data
    saveAgentFromWizard() {
      const newAgent = {
        id: uuidv4(),
        name: this.wizardData.name,
        description: this.wizardData.description,
        model: this.wizardData.model,
        systemPrompt: this.wizardData.systemPrompt,
        temperature: this.wizardData.temperature,
        topP: this.wizardData.topP,
        lastUsed: new Date().toISOString()
      };
      
      this.agents.push(newAgent);
      this.saveAgentsToStorage();
      
      // Reset wizard
      this.resetWizard();
      
      return newAgent;
    },
    
    // Set filter parameters
    setFilter(params) {
      if (params.query !== undefined) {
        this.filterQuery = params.query;
      }
      
      if (params.tags !== undefined) {
        this.filterTags = params.tags;
      }
      
      if (params.lastUsed !== undefined) {
        this.filterLastUsed = params.lastUsed;
      }
      
      if (params.viewType !== undefined) {
        this.viewType = params.viewType;
      }
    },
    
    // Clear all filters
    clearFilters() {
      this.filterQuery = '';
      this.filterTags = [];
      this.filterLastUsed = null;
    },
    
    // Duplicate an agent
    duplicateAgent(agentId) {
      const sourceAgent = this.agents.find(a => a.id === agentId) || 
                          this.featuredAgents.find(a => a.id === agentId);
      
      if (sourceAgent) {
        const newAgent = {
          ...sourceAgent,
          id: uuidv4(),
          name: `${sourceAgent.name} (Copy)`,
          lastUsed: new Date().toISOString(),
          // Remove featured flags
          isFeatured: false
        };
        
        this.agents.push(newAgent);
        this.saveAgentsToStorage();
        
        return newAgent;
      }
      
      return null;
    }
  }
});

// Helper function to extract tags from agent
function extractAgentTags(agent) {
  const tags = [];
  
  // Add model-based tags
  if (agent.model) {
    if (agent.model.includes('llama')) {
      tags.push('llama');
    } else if (agent.model.includes('mistral')) {
      tags.push('mistral');
    } else if (agent.model.includes('code')) {
      tags.push('code');
    }
  }
  
  // Add purpose-based tags from name
  const name = agent.name.toLowerCase();
  if (name.includes('code') || name.includes('program')) {
    tags.push('coding');
  } else if (name.includes('creat') || name.includes('writ')) {
    tags.push('creative');
  } else if (name.includes('research') || name.includes('analy')) {
    tags.push('research');
  }
  
  // Add custom tags if defined on the agent
  if (agent.tags && Array.isArray(agent.tags)) {
    tags.push(...agent.tags);
  }
  
  // Add category if defined
  if (agent.category) {
    tags.push(agent.category.toLowerCase());
  }
  
  // Return unique tags
  return [...new Set(tags)];
}

// Helper function to extract tags from model name
function extractModelTags(name) {
  const tags = [];
  
  // Add model family
  if (name.includes('llama')) {
    tags.push('llama');
  } else if (name.includes('mistral')) {
    tags.push('mistral');
  } else if (name.includes('vicuna')) {
    tags.push('vicuna');
  } else if (name.includes('stable')) {
    tags.push('stable-diffusion');
  }
  
  // Add size tag if present
  if (name.includes('7b')) {
    tags.push('7B');
  } else if (name.includes('13b')) {
    tags.push('13B');
  } else if (name.includes('70b')) {
    tags.push('70B');
  }
  
  // Add quantization if present
  if (name.includes('q4_0')) {
    tags.push('Q4_0');
  } else if (name.includes('q4_1')) {
    tags.push('Q4_1');
  } else if (name.includes('q5_0')) {
    tags.push('Q5_0');
  } else if (name.includes('q5_1')) {
    tags.push('Q5_1');
  } else if (name.includes('q8_0')) {
    tags.push('Q8_0');
  }
  
  return tags;
}

// Helper function to get category from model name
function getCategoryFromName(name) {
  if (name.includes('code')) {
    return 'Code';
  } else if (name.includes('vision')) {
    return 'Vision';
  } else if (name.includes('stable') || name.includes('sd')) {
    return 'Image Generation';
  } else if (name.includes('instruct')) {
    return 'Instruction-tuned';
  } else {
    return 'General Purpose';
  }
}

// Helper function to format model name for display
function formatModelName(name) {
  return name
    .replace(/:.*$/, '') // Remove version/tag part
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}