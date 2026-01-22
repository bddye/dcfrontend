<template>
  <div class="notification-container">
    <TransitionGroup name="list">
      <div
        v-for="note in notifications"
        :key="note.id"
        :class="['notification', `notification-${note.type}`]"
        @click="remove(note.id)"
      >
        <div class="notification-content">
          {{ note.message }}
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { notificationStore } from '../notification';

const notifications = computed(() => notificationStore.notifications);
const remove = (id) => notificationStore.remove(id);
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.notification {
  pointer-events: auto;
  min-width: 18rem;
  max-width: 28rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.notification-success {
  background-color: var(--success-color);
}

.notification-error {
  background-color: var(--danger-color);
}

.notification-info {
  background-color: var(--info-color);
}

.notification-warning {
  background-color: var(--warning-color);
}

.notification-content {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Transitions */
.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
