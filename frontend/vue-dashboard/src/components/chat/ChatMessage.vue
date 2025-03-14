<template>
  <div :class="['message', messageClass]">
    <div class="message-header">
      <v-avatar :size="32" :color="avatarColor" class="mr-2">
        <v-icon color="white">
          {{ avatarIcon }}
        </v-icon>
      </v-avatar>
      <span class="font-weight-bold">{{ displayName }}</span>
      <span class="message-timestamp text-caption ml-2">
        {{ message.timestamp || 'Just now' }}
      </span>
      <v-spacer></v-spacer>
      <div class="message-actions">
        <v-btn
          v-if="message.role === 'assistant' && !message.isStreaming"
          icon="mdi-content-copy"
          size="x-small"
          variant="text"
          @click="copyContent"
          title="Copy message"
        ></v-btn>
      </div>
    </div>
    <div class="message-content" v-if="!message.isStreaming">
      <div v-html="formattedContent"></div>
    </div>
    <div class="message-content streaming" v-else>
      <div v-html="formattedContent"></div>
      <span class="typing-indicator"></span>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export default {
  name: 'ChatMessage',
  props: {
    message: {
      type: Object,
      required: true
    },
    agentName: {
      type: String,
      default: 'Assistant'
    }
  },
  setup(props) {
    // Compute the message class based on the role
    const messageClass = computed(() => {
      const classes = [props.message.role === 'user' ? 'user-message' : 'assistant-message'];
      if (props.message.isError) classes.push('error-message');
      return classes;
    });

    // Compute the avatar color based on the role
    const avatarColor = computed(() => {
      if (props.message.isError) return 'error';
      return props.message.role === 'user' ? 'primary' : 'info';
    });

    // Compute the avatar icon based on the role
    const avatarIcon = computed(() => {
      if (props.message.isError) return 'mdi-alert-circle';
      return props.message.role === 'user' ? 'mdi-account' : 'mdi-robot';
    });

    // Compute the display name based on the role
    const displayName = computed(() => {
      if (props.message.isError) return 'System';
      return props.message.role === 'user' ? 'You' : props.agentName;
    });

    // Configure marked for code highlighting
    marked.setOptions({
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      breaks: true,
      gfm: true,
    });

    // Format content with markdown
    const formattedContent = computed(() => {
      // Sanitize the HTML to prevent XSS attacks
      const html = marked(props.message.content || '');
      return DOMPurify.sanitize(html);
    });

    // Copy message content to clipboard
    const copyContent = () => {
      navigator.clipboard.writeText(props.message.content)
        .then(() => {
          // Show a notification or feedback that the content was copied
          console.log('Content copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    };

    return {
      messageClass,
      avatarColor,
      avatarIcon,
      displayName,
      formattedContent,
      copyContent
    };
  }
};
</script>

<style>
.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 85%;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-message {
  background-color: var(--v-theme-primary-lighten-4, #E3F2FD);
  margin-left: auto;
  border-bottom-right-radius: 2px;
}

.assistant-message {
  background-color: var(--v-theme-surface-variant, #F5F5F5);
  margin-right: auto;
  border-bottom-left-radius: 2px;
}

.error-message {
  background-color: var(--v-theme-error-lighten-4, #FFEBEE);
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.message-content {
  white-space: pre-wrap;
  font-size: 0.95rem;
}

.message-content pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 8px;
  margin-bottom: 8px;
}

.message-content code {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.message-content pre code {
  padding: 0;
  background-color: transparent;
}

.message-content p {
  margin-bottom: 0.5em;
}

.message-content p:last-child {
  margin-bottom: 0;
}

.message-content ul, .message-content ol {
  padding-left: 1.5em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.message-content img {
  max-width: 100%;
  border-radius: 4px;
}

.message-content blockquote {
  border-left: 4px solid var(--v-theme-primary, #1976D2);
  padding-left: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin: 8px 0;
}

.message-content a {
  color: var(--v-theme-primary, #1976D2);
  text-decoration: none;
}

.message-content a:hover {
  text-decoration: underline;
}

.message-timestamp {
  opacity: 0.7;
  font-size: 0.75rem;
}

.message-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message:hover .message-actions {
  opacity: 1;
}

.typing-indicator {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 20px;
}

.typing-indicator::after {
  content: "...";
  position: absolute;
  left: 0;
  top: -5px;
  font-size: 20px;
  animation: typingAnimation 1s infinite;
}

@keyframes typingAnimation {
  0% { content: "."; }
  33% { content: ".."; }
  66% { content: "..."; }
}

/* Dark theme adjustments */
:root[class*="v-theme--dark"] .message-content pre {
  background-color: rgba(255, 255, 255, 0.05);
}

:root[class*="v-theme--dark"] .message-content code {
  background-color: rgba(255, 255, 255, 0.05);
}

:root[class*="v-theme--dark"] .message-content blockquote {
  color: rgba(255, 255, 255, 0.7);
}

:root[class*="v-theme--dark"] .user-message {
  background-color: var(--v-theme-primary-darken-1, #1565C0);
}

:root[class*="v-theme--dark"] .assistant-message {
  background-color: var(--v-theme-surface-variant-darken-1, #424242);
}

:root[class*="v-theme--dark"] .error-message {
  background-color: var(--v-theme-error-darken-1, #C62828);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .message {
    max-width: 95%;
  }
}
</style>
