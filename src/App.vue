<template>
  <div id="app-layout">
    <Sidebar />
    <div class="main-content">
      <router-view></router-view>
    </div>
    <Notification />
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Notification from './components/Notification.vue';
</script>

<style>
#app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 240px; /* Matching sidebar width */
  min-height: 100vh;
  transition: margin-left 0.3s;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
}
</style>
