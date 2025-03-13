# MukkabootAI UI Components

This document provides an overview of the main UI components implemented in the MukkabootAI frontend.

## Chat Interface Components

### ChatView

The main chat interface view that integrates all chat components.

**Key Features:**
- Conversation listing and management
- Chat message display with markdown rendering
- Real-time streaming responses
- Model selection
- File attachment support

**File Location:** `/src/views/ChatView.vue`

### ChatMessage

A reusable component to display individual chat messages.

**Key Features:**
- User and assistant message styling
- Markdown content rendering
- Code syntax highlighting
- Streaming animation for real-time responses
- Timestamp display

**File Location:** `/src/components/chat/ChatMessage.vue`

### ChatInput

Input component for sending messages and attachments.

**Key Features:**
- Message composition
- File attachment handling
- Send button with validation
- Keyboard shortcuts

**File Location:** `/src/components/chat/ChatInput.vue`

## File Management Components

### FileExplorer

A comprehensive file explorer component.

**Key Features:**
- Directory navigation with breadcrumbs
- File and folder listing
- Search functionality
- File operations (upload, download, delete, rename)
- File previews
- Context menu actions

**File Location:** `/src/components/files/FileExplorer.vue`

### FilesView

The main file management view that integrates the FileExplorer.

**Key Features:**
- File selection feedback
- Integration with chat for file utilization
- File information display

**File Location:** `/src/views/FilesView.vue`

## Model Selection Components

### ModelSelector

Component for browsing and selecting AI models.

**Key Features:**
- Model listing with filtering
- Model details display
- Selection capability
- Size and parameter information
- Category and tag display

**File Location:** `/src/components/agents/ModelSelector.vue`

### AgentsView

The main view for model and agent management.

**Key Features:**
- Integration with ModelSelector
- Agent creation and management
- Agent configuration (temperature, top-p, etc.)
- System prompt customization
- Quick chat initiation

**File Location:** `/src/views/AgentsView.vue`

## API Services

The application includes several service modules for API integration:

### ApiService

Base service for API communication with request/response interceptors.

**File Location:** `/src/services/api.service.js`

### AuthService

Handles authentication operations.

**File Location:** `/src/services/auth.service.js`

### ChatService

Manages chat conversations and messages.

**File Location:** `/src/services/chat.service.js`

### FilesystemService

Handles file operations.

**File Location:** `/src/services/filesystem.service.js`

### OllamaService

Interfaces with Ollama models.

**File Location:** `/src/services/ollama.service.js`

## Component Integration

The components are integrated through Vue Router and the main App layout:

### Router Configuration

**File Location:** `/src/router/index.js`

Key routes:
- `/chat` - Chat interface
- `/files` - File management
- `/agents` - Model selection and agent management
- `/memory` - Memory management
- `/settings` - Application settings

### App Layout

**File Location:** `/src/App.vue`

Features:
- Navigation drawer with menu items
- App bar with theme toggle
- Main content area
- Responsive design

## Styling and Theming

The application uses Vuetify 3 for styling with a customizable theme system:

- Light and dark mode support
- Primary color theming
- Responsive grid system
- Material Design components

## State Management

The application primarily uses Vue's Composition API with local component state. For more complex state needs, it leverages:

- `localStorage` for persistent user preferences and authentication
- Vue's provide/inject for deeper component tree communication

## Building and Deployment

The frontend is built with Vite and can be deployed in development or production mode:

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm run serve
```

A restart script (`restart.sh`) is provided for convenient development and production deployment.

## Performance Considerations

The UI is optimized for performance through:

- Lazy loading of route components
- Efficient state management
- Debounced search inputs
- Virtualized lists for long data sets
- Optimized API data fetching

## Accessibility

Accessibility features include:

- ARIA attributes on interactive elements
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatible markup
- Focus management

## Future UI Enhancements

Planned improvements include:

1. Enhanced mobile responsiveness
2. Drag and drop file management
3. Customizable dashboard layouts
4. Advanced visualization for memory entities
5. Theme customization options
