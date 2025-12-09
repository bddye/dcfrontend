<template>
  <div class="sidebar">
    <div class="menu-header">管理选项</div>
    <ul>
      <li>
        <router-link to="/device-management">设备管理</router-link>
      </li>
      <li>
        <router-link to="/port-opening">服务端口开放</router-link>
      </li>
      <li>
        <router-link to="/protocol-management">业务协议管理</router-link>
      </li>
      <li>
        <router-link to="/message-query">消息查询</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
</script>

<style scoped>
.sidebar {
  width: 200px;
  background-color: #f4f4f4;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
}

.menu-header {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

/* 确保激活状态样式继承 */
a.router-link-active {
  font-weight: bold;
  color: #007bff;
  background-color: #e0e0e0; /* 激活时可以稍微加个背景色，视觉效果更好 */
}

a {
  text-decoration: none;
  color: #555;
  display: block;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

a:hover {
  background-color: #e9e9e9;
}
</style>