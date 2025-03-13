<template>
  <div :class="['message', messageClass]">
    <div class="message-header">
      <v-avatar :size="32" :color="avatarColor" class="mr-2">
        <v-icon color="white">
          {{ avatarIcon }}
        </v-icon>
      </v-avatar>
      <span class="font-weight-bold">{{ displayName }}</span>
    </div>
    <div class="message-content" v-if="!message.isStreaming">
      <div v-html="formattedContent"></div>
    </div>
    <div class="message-content streaming" v-else>
      <div v-html="formattedContent"></div>
      <span class="typing-indicator"></span>
    </div>
    <div class="message-timestamp text-caption">
      {{ message.timestamp || 'Just now' }}
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
const marked = require('marked');
const DOMPurify = require('dompurify');

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
      return props.message.role === 'user' ? 'user-message' : 'assistant-message';
    });

    // Compute the avatar color based on the role
    const avatarColor = computed(() => {
      return props.message.role === 'user' ? 'primary' : 'info';
    });

    // Compute the avatar icon based on the role
    const avatarIcon = computed(() => {
      return props.message.role === 'user' ? 'mdi-account' : 'mdi-robot';
    });

    // Compute the display name based on the role
    const displayName = computed(() => {
      return props.message.role === 'user' ? 'You' : props.agentName;
    });

    // Format content with markdown
    const formattedContent = computed(() => {
      // Sanitize the HTML to prevent XSS attacks
      const renderer = new marked.Renderer();
      
      // Custom renderer for code blocks
      renderer.code = (code, language) => {
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      };
      
      // Configure marked
      marked.setOptions({
        renderer,
        breaks: true,
        gfm: true,
      });
      
      // Parse markdown and sanitize HTML
      const html = marked(props.message.content || '');
      return DOMPurify.sanitize(html);
    });

    return {
      messageClass,
      avatarColor,
      avatarIcon,
      displayName,
      formattedContent
    };
  }
};
</script>

<style scoped>
.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
  margin-bottom: 8px;
}

.user-message {
  background-color: #E3F2FD;
  margin-left: auto;
}

.assistant-message {
  background-color: #F5F5F5;
  margin-right: auto;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.message-content {
  white-space: pre-wrap;
}

.message-content :deep(pre) {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.message-content :deep(code) {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
}

.message-timestamp {
  text-align: right;
  margin-top: 4px;
  opacity: 0.7;
}

.typing-indicator {
  display: inline-block;
  position: relative;
  width: 50px;
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
</style>