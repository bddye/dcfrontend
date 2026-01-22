<template>
  <div id="app-layout">
    <Sidebar />
    <div class="main-wrapper">
      <Topbar />
      <main class="main-content">
        <router-view></router-view>
      </main>
    </div>
    <Notification />
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Topbar from './components/Topbar.vue';
import Notification from './components/Notification.vue';
</script>

<style>
#app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
}

.main-wrapper {
  flex: 1;
  margin-left: 200px;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
