import { reactive } from 'vue';

export const notificationStore = reactive({
  notifications: [],

  add(message, type = 'info', duration = 3000) {
    const id = Date.now();
    this.notifications.push({ id, message, type });

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    return id;
  },

  remove(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  },

  success(message, duration) {
    return this.add(message, 'success', duration);
  },

  error(message, duration) {
    return this.add(message, 'error', duration);
  },

  info(message, duration) {
    return this.add(message, 'info', duration);
  },

  warning(message, duration) {
    return this.add(message, 'warning', duration);
  }
});
