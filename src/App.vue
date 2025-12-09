<template>
  <div id="app-layout">
    <Sidebar />
    <div class="main-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

#app-layout {
  display: flex;
}

.main-content {
  margin-left: 250px;
  padding: 20px;
  width: 100%;
}
</style>