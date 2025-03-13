<template>
  <div class="chat-input">
    <v-textarea
      v-model="messageText"
      placeholder="Type your message here..."
      rows="3"
      auto-grow
      variant="outlined"
      hide-details
      :disabled="disabled"
      @keydown.enter.prevent="sendMessageIfReady"
      class="chat-textarea"
    ></v-textarea>
    <div class="chat-controls">
      <v-btn
        v-if="isAttachmentsEnabled"
        icon="mdi-paperclip"
        size="small"
        class="mr-2"
        :disabled="disabled"
        @click="showAttachmentMenu"
      ></v-btn>
      <v-btn
        color="primary"
        icon="mdi-send"
        :disabled="!messageText || disabled || isSending"
        @click="sendMessageIfReady"
      ></v-btn>
    </div>
    
    <!-- Attachment menu -->
    <v-menu
      v-model="attachmentMenu"
      :close-on-content-click="false"
      location="top"
    >
      <v-card min-width="300">
        <v-card-title>Add attachment</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="selectedFiles"
            label="Select files"
            multiple
            chips
            :disabled="isSending"
            @update:model-value="handleFileSelection"
          ></v-file-input>
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
import { ref, computed } from 'vue';

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
    
    // Check if the message is ready to be sent
    const isMessageReady = computed(() => {
      return messageText.value.trim().length > 0 && !props.disabled && !props.isSending;
    });
    
    // Send message if ready
    const sendMessageIfReady = () => {
      if (isMessageReady.value) {
        const message = messageText.value.trim();
        emit('send-message', message);
        messageText.value = '';
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
      isMessageReady,
      sendMessageIfReady,
      showAttachmentMenu,
      handleFileSelection,
      attachFiles
    };
  }
};
</script>

<style scoped>
.chat-input {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.chat-textarea {
  width: 100%;
}

.chat-controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>