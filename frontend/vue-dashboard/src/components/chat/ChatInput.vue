<template>
  <div class="chat-input">
    <v-card class="pa-3" flat>
      <div class="d-flex align-start">
        <v-textarea
          v-model="messageText"
          placeholder="Type your message here..."
          rows="1"
          auto-grow
          max-rows="6"
          variant="outlined"
          hide-details
          density="comfortable"
          :disabled="disabled"
          @keydown.enter.prevent="handleEnterKey"
          class="chat-textarea flex-grow-1 mr-2"
          ref="textareaElement"
        ></v-textarea>
        
        <div class="d-flex flex-column align-center">
          <v-btn
            v-if="isAttachmentsEnabled"
            icon="mdi-paperclip"
            :color="attachmentMenu ? 'primary' : undefined"
            :disabled="disabled || isSending"
            @click="showAttachmentMenu"
            title="Add attachment"
            class="mb-2"
          ></v-btn>
          
          <v-btn
            color="primary"
            icon="mdi-send"
            :disabled="!messageText.trim() || disabled || isSending"
            @click="sendMessage"
            :loading="isSending"
            title="Send message"
          ></v-btn>
        </div>
      </div>
      
      <div class="text-caption d-flex align-center mt-1">
        <v-icon size="small" class="mr-1">mdi-information</v-icon>
        <span>Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for a new line</span>
        <v-spacer></v-spacer>
        <template v-if="isSending">
          <v-progress-circular indeterminate size="16" width="2" color="primary" class="mr-1"></v-progress-circular>
          <span>Sending...</span>
        </template>
      </div>
    </v-card>
    
    <!-- Attachment menu -->
    <v-menu
      v-model="attachmentMenu"
      :close-on-content-click="false"
      location="top"
    >
      <v-card min-width="320">
        <v-card-title class="d-flex align-center">
          Add attachment
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="attachmentMenu = false"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-file-input
            v-model="selectedFiles"
            label="Select files"
            multiple
            chips
            :disabled="isSending"
            @update:model-value="handleFileSelection"
            accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt, .csv, .json"
            density="comfortable"
            variant="outlined"
            prepend-icon=""
            prepend-inner-icon="mdi-file-upload"
          ></v-file-input>
          
          <div class="text-caption mt-2">
            <strong>Supported file types:</strong> Images, PDFs, Documents, Spreadsheets, Text files
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="attachmentMenu = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedFiles || selectedFiles.length === 0"
            @click="attachFiles"
          >
            Attach
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue';

export default {
  name: 'ChatInput',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    isSending: {
      type: Boolean,
      default: false
    },
    isAttachmentsEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['send-message', 'attach-files'],
  setup(props, { emit }) {
    const messageText = ref('');
    const attachmentMenu = ref(false);
    const selectedFiles = ref([]);
    const textareaElement = ref(null);
    
    // Check if the message is ready to be sent
    const isMessageReady = computed(() => {
      return messageText.value.trim().length > 0 && !props.disabled && !props.isSending;
    });
    
    // Handle enter key
    const handleEnterKey = (event) => {
      // If shift is pressed, allow a new line
      if (event.shiftKey) {
        return;
      }
      
      // Otherwise, send the message
      sendMessage();
    };
    
    // Send message if ready
    const sendMessage = () => {
      if (isMessageReady.value) {
        const message = messageText.value.trim();
        emit('send-message', message);
        messageText.value = '';
        
        // Focus the textarea after sending
        nextTick(() => {
          if (textareaElement.value) {
            textareaElement.value.focus();
          }
        });
      }
    };
    
    // Show attachment menu
    const showAttachmentMenu = () => {
      if (!props.disabled) {
        attachmentMenu.value = true;
      }
    };
    
    // Handle file selection
    const handleFileSelection = (files) => {
      selectedFiles.value = files;
    };
    
    // Attach files
    const attachFiles = () => {
      if (selectedFiles.value && selectedFiles.value.length > 0) {
        emit('attach-files', selectedFiles.value);
        selectedFiles.value = [];
        attachmentMenu.value = false;
      }
    };
    
    return {
      messageText,
      attachmentMenu,
      selectedFiles,
      textareaElement,
      isMessageReady,
      handleEnterKey,
      sendMessage,
      showAttachmentMenu,
      handleFileSelection,
      attachFiles
    };
  }
};
</script>

<style scoped>
.chat-input {
  position: relative;
  width: 100%;
}

.chat-textarea {
  width: 100%;
}

/* Style keyboard shortcuts */
kbd {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.7);
  display: inline-block;
  font-size: 0.75rem;
  line-height: 1;
  padding: 2px 5px;
  text-align: center;
  vertical-align: middle;
  margin: 0 2px;
}

/* Dark theme adjustments */
:root[class*="v-theme--dark"] kbd {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}
</style>
