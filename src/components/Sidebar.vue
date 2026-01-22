<template>
  <div class="sidebar">
    <div class="sidebar-logo">
      <img src="/vite.svg" alt="logo" class="logo-img" />
      <span class="logo-text">设备管理系统</span>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li>
          <router-link to="/device-management" class="nav-item">
            <span class="nav-icon">📊</span>
            设备管理
          </router-link>
        </li>
        <li>
          <router-link to="/port-opening" class="nav-item">
            <span class="nav-icon">🔌</span>
            服务端口开放
          </router-link>
        </li>
        <li>
          <router-link to="/protocol-management" class="nav-item">
            <span class="nav-icon">📜</span>
            业务协议管理
          </router-link>
        </li>
        <li>
          <router-link to="/message-query" class="nav-item">
            <span class="nav-icon">🔍</span>
            消息查询
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background-color: #001529;
  color: rgba(255, 255, 255, 0.65);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: all 0.2s;
}

.sidebar-logo {
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #002140;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;
}

.nav-item:hover {
  color: white;
}

.nav-item.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.nav-icon {
  font-size: 16px;
}
</style>
