<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content" :style="{ maxWidth: width }">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="close-btn" @click="handleClose">&times;</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div v-if="$slots.footer || showDefaultFooter" class="modal-footer">
            <slot name="footer">
              <button class="btn btn-secondary" @click="handleClose">{{ cancelText }}</button>
              <button v-if="showConfirm" class="btn btn-primary" :disabled="confirmDisabled" @click="$emit('confirm')">
                {{ confirmText }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '提示'
  },
  width: {
    type: String,
    default: '32rem'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  showConfirm: {
    type: Boolean,
    default: true
  },
  showDefaultFooter: {
    type: Boolean,
    default: true
  },
  confirmDisabled: {
    type: Boolean,
    default: false
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'close']);

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>

<style scoped>
.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f1f5f9;
  color: var(--text-primary);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content {
  animation: modal-in 0.2s ease-out;
}

.fade-leave-active .modal-content {
  animation: modal-in 0.2s ease-in reverse;
}

@keyframes modal-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
