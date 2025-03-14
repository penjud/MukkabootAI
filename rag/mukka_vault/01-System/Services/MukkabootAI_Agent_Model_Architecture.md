# MukkabootAI Agent Communication & Model Interaction Architecture - Revised

## Model Inventory

The system currently has access to these AI models through Ollama:

| Model | Size | Family | Format | Quantization |
|-------|------|--------|--------|-------------|
| **llama3.1:8b** | 8.0B | llama | gguf | Q4_K_M |
| **gemma2:9b** | 9.2B | gemma2 | gguf | Q4_0 |
| **mistral:7b** | 7.2B | llama | gguf | Q4_0 |
| **dolphin-mistral:7b** | 7B | llama | gguf | Q4_0 |
| **llama2-uncensored:latest** | 7B | llama | gguf | Q4_0 |
| **nomic-embed-text:latest** | 137M | nomic-bert | gguf | F16 |

## Current Architecture

The MukkabootAI system has a microservices architecture with these key components:

```
+---------------------+     +---------------------+     +-------------------------+
|                     |     |                     |     |                         |
|  Frontend (Vue.js)  |<--->|  Backend Services  |<--->|  Ollama Bridge Service  |
|                     |     |                     |     |                         |
+---------------------+     +---------------------+     +-------------------------+
                                                               |
                                                               v
                                                        +----------------+
                                                        |                |
                                                        |  Ollama Models |
                                                        |                |
                                                        +----------------+
```

### Backend Services

| Service | Port | Status | Primary Role |
|---------|------|--------|--------------|
| Base Service | 3010 | ✅ Complete | Central registry and gateway |
| Auth Service | 3013 | ✅ Complete | User authentication and management |
| Memory Service | 3011 | ✅ Complete | Conversation storage and memory entities |
| Filesystem Service | 3012 | ✅ Complete | File storage and management |
| Brave Search Service | 3014 | ✅ Complete | Web search capabilities |
| Ollama Bridge Service | 3015 | ✅ Complete | Integration with Ollama for AI models |

### Current Agent-Model Interaction Flow

```
+-------------+     +------------+     +---------------+     +-----------------+
|             |     |            |     |               |     |                 |
| User Input  |---->| Vue.js     |---->| OllamaService |---->| Ollama Bridge   |
| (Chat UI)   |     | Component  |     | (API Client)  |     | Service         |
|             |     |            |     |               |     |                 |
+-------------+     +------------+     +---------------+     +-----------------+
                                                                      |
                                                                      v
+-------------+     +------------+     +---------------+     +-----------------+
|             |     |            |     |               |     |                 |
| User        |<----| Vue.js     |<----| OllamaService |<----| Ollama Model    |
| Display     |     | Component  |     | (API Client)  |     | (gguf format)   |
|             |     |            |     |               |     |                 |
+-------------+     +------------+     +---------------+     +-----------------+
```

## Strength Areas

1. **Service Registration**: All services are properly registering with the Base Service
2. **Authentication Flow**: JWT-based auth is implemented and working across services
3. **Basic Model Integration**: API endpoints exist for basic model operations through Ollama Bridge
4. **Frontend Integration**: OllamaService provides methods for model interaction with proper streaming support
5. **Available Models**: System has access to several capable models (LLaMA 3.1, Mistral, Gemma 2)

## Gap Analysis

### 1. Agent Configuration & Persistence

**Current State**:
- Basic communication pathway established
- No clear agent configuration storage or retrieval mechanism
- Missing agent-specific model customization

**Missing Components**:
- Agent configuration schema and persistence
- Agent-model binding mechanism
- Agent capability definitions

### 2. Context Management

**Current State**:
- Simple conversation storage implemented in Memory Service
- Basic message passing to models
- No sophisticated context handling

**Missing Components**:
- Context window optimization
- Long-term memory integration
- Message summarization for extended conversations

### 3. Model Parameter Customization

**Current State**:
- Basic model selection implemented
- Generic parameters passed to models
- No agent-specific tuning

**Missing Components**:
- Model parameter mapping to agent requirements
- Agent-specific model configuration
- Model capability detection and validation

## Recommended Implementation

### 1. Agent Configuration Service

Create a dedicated agent configuration endpoint in the Memory Service:

```javascript
// Agent configuration storage in Memory Service
app.post('/api/agents', authenticate, async (req, res) => {
  try {
    const { name, description, modelConfig, capabilities } = req.body;
    
    // Validate model configuration against available models
    const modelValid = await validateModelConfig(modelConfig);
    if (!modelValid) {
      return res.status(400).json({ error: 'Invalid model configuration' });
    }
    
    // Store agent configuration
    const agent = await createAgent({
      name,
      description,
      modelConfig,
      capabilities,
      userId: req.user.id
    });
    
    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Enhanced Context Management

Add context optimization to the Memory Service:

```javascript
// Context optimization in Memory Service
const optimizeContext = async (conversationId, maxTokens = 2048) => {
  // Get full conversation history
  const messages = await getConversationMessages(conversationId);
  
  // If within token limit, return as is
  if (estimateTokenCount(messages) <= maxTokens) return messages;
  
  // Strategy 1: Keep recent messages intact
  const recentMessages = messages.slice(-5);
  const remainingTokens = maxTokens - estimateTokenCount(recentMessages);
  
  // Strategy 2: Summarize older content
  const olderMessages = messages.slice(0, -5);
  const summary = await summarizeMessages(olderMessages);
  
  // Combine for optimized context
  return [
    { role: 'system', content: `Conversation summary: ${summary}` },
    ...recentMessages
  ];
};
```

### 3. Model Parameter Optimization

Enhance the Ollama Bridge Service to support agent-specific model configuration:

```javascript
// Enhanced model configuration in Ollama Bridge
app.post('/api/agent-model/configure', authenticate, async (req, res) => {
  try {
    const { agentId, modelName, parameters } = req.body;
    
    // Get agent configuration
    const agent = await getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Get model details
    const model = await getModelDetails(modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // Validate configuration against model capabilities
    const validationResult = validateModelParameters(model, parameters);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        error: 'Invalid model parameters',
        details: validationResult.errors
      });
    }
    
    // Store optimized configuration
    const configuration = await storeAgentModelConfiguration(agentId, modelName, parameters);
    
    res.status(200).json(configuration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Implementation Priority

1. **Agent Configuration Storage** (High Priority)
   - Define agent schema
   - Create REST endpoints for CRUD operations
   - Implement persistence in MongoDB

2. **Model Parameter Mapping** (High Priority)
   - Create model capability detection
   - Implement parameter validation
   - Store and retrieve agent-specific model configurations

3. **Context Management** (Medium Priority)
   - Implement token counting
   - Add message summarization
   - Create context window optimization

4. **Agent Capabilities Definition** (Medium Priority)
   - Define standard capabilities
   - Create capability-to-model mapping
   - Implement capability validation

5. **UI Components** (Low Priority)
   - Enhance agent creation wizard
   - Add model parameter configuration UI
   - Create agent capability selection interface

## Technical Requirements

1. **MongoDB Schema Updates**:
   ```javascript
   const AgentSchema = new mongoose.Schema({
     name: { type: String, required: true },
     description: { type: String },
     userId: { type: String, required: true },
     modelConfig: {
       modelName: { type: String, required: true },
       parameters: {
         temperature: { type: Number, default: 0.7 },
         topP: { type: Number, default: 0.9 },
         maxTokens: { type: Number, default: 2048 },
         // Other parameters
       }
     },
     capabilities: [String],
     created: { type: Date, default: Date.now },
     updated: { type: Date, default: Date.now }
   });
   ```

2. **API Endpoint Additions**:
   - `/api/agents` - CRUD operations for agents
   - `/api/agent-model/configure` - Model configuration for agents
   - `/api/contexts/optimize` - Context optimization

3. **Frontend Store Updates**:
   ```javascript
   // agent.js store
   import { defineStore } from 'pinia';
   import { ApiService } from '../services';

   export const useAgentStore = defineStore('agent', {
     state: () => ({
       agents: [],
       currentAgent: null,
       loading: false,
       error: null
     }),
     actions: {
       async fetchAgents() {
         this.loading = true;
         try {
           const response = await ApiService.get('/api/agents');
           this.agents = response.data;
           this.error = null;
         } catch (error) {
           this.error = error.message;
         } finally {
           this.loading = false;
         }
       },
       // Other actions
     }
   });
   ```