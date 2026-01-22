<template>
  <header class="topbar">
    <div class="topbar-left">
      <span class="toggle-sidebar">☰</span>
      <div class="breadcrumbs">
        <span class="breadcrumb-item">首页</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{ currentRouteName }}</span>
      </div>
    </div>
    <div class="topbar-right">
      <div class="user-info">
        <span class="user-avatar">👤</span>
        <span class="user-name">管理员</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const currentRouteName = computed(() => {
  const names = {
    '/device-management': '设备管理',
    '/port-opening': '服务端口开放',
    '/protocol-management': '业务协议管理',
    '/message-query': '消息查询'
  };
  return names[route.path] || '概览';
});
</script>

<style scoped>
.topbar {
  height: 64px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px #00152914;
  position: sticky;
  top: 0;
  z-index: 90;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-sidebar {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-primary);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-separator {
  color: var(--text-secondary);
}

.breadcrumb-item {
  color: var(--text-secondary);
}

.breadcrumb-item.active {
  color: var(--text-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  font-size: 20px;
}

.user-name {
  font-size: 14px;
  color: var(--text-primary);
}
</style>
