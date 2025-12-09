import { createRouter, createWebHistory } from 'vue-router'

import DeviceManagement from '../views/DeviceManagement.vue'
import PortOpening from '../views/PortOpening.vue'
import ProtocolManagement from '../views/ProtocolManagement.vue'
import MessageQuery from '../views/MessageQuery.vue' 

const routes = [
  // 默认路由，当访问根路径时
  { path: '/', redirect: '/device-management' },

  // 设备管理
  {
    path: '/device-management',
    component: DeviceManagement,
    props: { title: '设备管理' }
  },

  // 服务端口开放
  {
    path: '/port-opening',
    component: PortOpening,
    props: { title: '服务端口开放' }
  },

  // 业务协议管理
  {
    path: '/protocol-management',
    component: ProtocolManagement,
    props: { title: '业务协议管理' }
  },
  {
     path: '/message-query',
     component: MessageQuery,
    props: { title: '消息查询' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router