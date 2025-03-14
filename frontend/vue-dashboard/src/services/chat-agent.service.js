/**
 * Chat Agent Service
 * 
 * This service handles the integration between agents and the chat interface.
 * It provides functions for loading, saving, and using agents in chat conversations.
 */

// Save agent to localStorage for chat context
export const selectAgentForChat = (agent) => {
  if (!agent) return;
  
  try {
    // Store a sanitized version of the agent
    const sanitizedAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      model: agent.model || 'llama3',
      systemPrompt: agent.systemPrompt || '',
      temperature: agent.temperature || 0.7,
      topP: agent.topP || 0.9,
      icon: agent.icon || 'mdi-robot'
    };
    
    // Save to localStorage
    localStorage.setItem('selectedAgent', JSON.stringify(sanitizedAgent));
    
    return true;
  } catch (error) {
    console.error('Error selecting agent for chat:', error);
    return false;
  }
};

// Load agent from localStorage
export const getSelectedChatAgent = () => {
  try {
    const agent = localStorage.getItem('selectedAgent');
    return agent ? JSON.parse(agent) : null;
  } catch (error) {
    console.error('Error loading selected agent:', error);
    return null;
  }
};

// Clear selected agent
export const clearSelectedChatAgent = () => {
  localStorage.removeItem('selectedAgent');
};

// Get default agent if none is selected
export const getDefaultAgent = () => {
  return {
    id: 'default-agent',
    name: 'General Assistant',
    description: 'A general-purpose AI assistant for everyday tasks',
    model: 'llama3',
    systemPrompt: 'You are a helpful, harmless, and honest assistant.',
    temperature: 0.7,
    topP: 0.9,
    icon: 'mdi-robot'
  };
};

// Format agent for display in chat
export const formatAgentForChat = (agent) => {
  if (!agent) return getDefaultAgent();
  
  return {
    ...agent,
    // Ensure required properties exist
    description: agent.description || 'AI Assistant',
    model: agent.model || 'llama3',
    systemPrompt: agent.systemPrompt || 'You are a helpful assistant.',
    temperature: agent.temperature || 0.7,
    topP: agent.topP || 0.9,
    icon: agent.icon || 'mdi-robot'
  };
};
