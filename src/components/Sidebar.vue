<template>
  <div class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo">DC</div>
      <div class="brand-name">Device Controller</div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">管理菜单</div>
      <ul>
        <li>
          <router-link to="/device-management" class="nav-item">
            <span class="nav-icon">📱</span>
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
  width: 240px;
  background-color: #1e293b;
  color: #f8fafc;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 40;
}

.sidebar-brand {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-logo {
  width: 32px;
  height: 32px;
  background-color: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.brand-name {
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.025em;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
}

.nav-section {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 0.75rem 0.75rem 0.5rem;
  letter-spacing: 0.05em;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.nav-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}
</style>
