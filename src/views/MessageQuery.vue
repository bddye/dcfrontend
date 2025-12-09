<template>
  <div class="message-query-page">

    <div class="search-panel">
      <div class="form-group">
        <label for="message-type">消息类型:</label>
        <select 
          id="message-type" 
          v-model="searchCriteria.messageType"
        >
          <option value="">请选择消息类型 (查询全部)</option>
          <option v-for="type in messageTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <div class="action-group">
        <button @click="executeSearch" class="search-btn">查询</button>
        <button @click="resetSearch" class="reset-btn">重置</button>
        <button @click="fetchMessages" class="refresh-btn">刷新全部</button>
      </div>
    </div>

    <hr />

    <div class="message-list">
      <h3>消息列表 (共 {{ messages.length }} 条)</h3>
      <table>
        <thead>
          <tr>
            <th>消息 ID</th> <th>消息类型</th>
            <th>位置</th>
            <th>创建时间</th>
            <th>接收时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(message, index) in messages" :key="index">
            <td>{{ message.id || 'N/A' }}</td> 
            <td>{{ message.type || 'N/A' }}</td>
            <td>{{ message.location || 'N/A' }}</td>
            <td>{{ formatTime(message.createTime) }}</td>
            <td>{{ formatTime(message.receiveTime) }}</td>
            <td class="action-buttons">
              <button @click="showDetails(message)" class="details-btn">
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="messages.length === 0">
            <td colspan="6" class="no-data">没有符合条件的消息。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDetailsModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>消息详情</h4>
          <span class="modal-close-btn" @click="closeDetailsModal">&times;</span>
        </div>
        <div class="modal-body">
            <div class="details-content">
              <p v-for="(value, key) in formattedDetails" :key="key">
                <span class="detail-key">{{ key }}:</span>
                <span class="detail-value">{{ value }}</span>
              </p>
              <p v-if="Object.keys(formattedDetails).length === 0" class="no-data">
                无可用消息详情。
              </p>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import config from '../config/config'; 

const BASE_URL = config.BASE_URL + '/message';
const SUCCESS_CODE = 200; // 假设业务成功码

const messages = ref([]);
const messageTypes = ref([]);
const showDetailsModal = ref(false);
const selectedMessageDetail = ref({});

const detailKeyMap = {
    id: '消息 ID',
    type: '消息类型',
    location: '位置信息',
    createTime: '创建时间 (发送)',
    receiveTime: '接收时间',
    status: '处理状态',
    payload: '消息载荷/内容',
    content: '内容',
    targetUser: '目标用户',
};

const searchCriteria = ref({
  // 移除 mode: 'identifier', 只保留 messageType
  messageType: '',
});

// 移除 isSearchValid 计算属性，查询按钮始终可用 (查询全部或按类型查询)

const formattedDetails = computed(() => {
    const detail = selectedMessageDetail.value;
    const formatted = {};

    // 遍历原始消息的键
    for (const key in detail) {
        if (Object.hasOwnProperty.call(detail, key)) {
            let displayKey = detailKeyMap[key] || key; // 使用中文名或保留原英文名
            let value = detail[key];

            // 对时间字段进行格式化
            if (key.includes('Time') && value) {
                value = formatTime(value);
            }
            // 对载荷 (payload) 等复杂对象进行特殊处理 (例如 JSON.stringify)
            else if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value, null, 2);
            }

            formatted[displayKey] = value === null || value === undefined ? 'N/A' : value;
        }
    }
    
    return formatted;
});
/**
 * 格式化时间 (处理后端 LocalDateTime 字符串)
 * @param {string | number | undefined} timeValue 
 */
const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    
    try {
        if (typeof timeValue === 'number' || (typeof timeValue === 'string' && /^\d+$/.test(timeValue))) {
             const date = new Date(Number(timeValue));
             return date.toLocaleString();
        } 
        
        return String(timeValue).replace('T', ' ').split('.')[0]; // 移除 T 和毫秒
        
    } catch (e) {
        return String(timeValue);
    }
};

/**
 * 获取所有消息类型
 */
const fetchMessageTypes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllTypes`);
    if (response.data && response.data.code === SUCCESS_CODE) {
      messageTypes.value = response.data.data || [];
    } else {
      console.error('获取消息类型失败:', response.data.message);
    }
  } catch (error) {
    console.error('获取消息类型失败:', error);
  }
};

/**
 * 获取所有消息
 */
const fetchMessages = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllMessages`);
    if (response.data && response.data.code === SUCCESS_CODE) {
      messages.value = response.data.data || [];
      console.log('成功获取所有消息。');
    } else {
      console.error('获取消息列表失败:', response.data.message);
      messages.value = [];
    }
  } catch (error) {
    console.error('获取消息列表失败:', error);
    messages.value = [];
  }
};

/**
 * 执行查询操作
 * 根据是否有 messageType 决定是查询全部还是按类型过滤
 */
const executeSearch = async () => {
  const type = searchCriteria.value.messageType;

  if (type) {
    await searchByMessageType(type);
  } else {
    // 如果没有选择类型，则视为查询全部
    await fetchMessages();
  }
};

/**
 * 根据消息类型查询 (前端过滤)
 * @param {string} type
 */
const searchByMessageType = async (type) => {
    try {
        // 依然调用获取所有消息的接口
        const response = await axios.get(`${BASE_URL}/getAllMessages`);
        if (response.data && response.data.code === SUCCESS_CODE) {
            let allMessages = response.data.data || [];
            // 在前端过滤
            messages.value = allMessages.filter(msg => msg.type === type);
            console.log(`成功查询到类型 ${type} 的消息。`);
        } else {
            console.error('按类型查询失败：获取全部消息失败。', response.data.message);
            messages.value = [];
        }
    } catch (error) {
        console.error('按类型查询失败：网络或API错误。', error);
        messages.value = [];
    }
};


/**
 * 重置查询条件并重新加载所有消息
 */
const resetSearch = () => {
  searchCriteria.value.messageType = '';
  fetchMessages(); // 重置后获取所有消息
};

// 显示消息详情弹窗
const showDetails = (messageDetail) => {
  selectedMessageDetail.value = messageDetail;
  showDetailsModal.value = true;
};

// 关闭消息详情弹窗
const closeDetailsModal = () => {
  showDetailsModal.value = false;
};

// 页面加载时自动获取所有消息和类型
onMounted(() => {
  fetchMessageTypes();
  fetchMessages();
});
</script>

<style scoped>
/* 样式已更新以适应新的布局 */
.message-query-page {
  font-family: Arial, sans-serif;
  padding: 20px;
}

.search-panel {
  display: flex;
  gap: 15px;
  align-items: flex-end; /* 使按钮与下拉框底部对齐 */
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 200px;
}

.action-group {
    display: flex;
    gap: 10px;
}

.search-btn, .reset-btn, .refresh-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  min-width: 80px;
}

.search-btn {
  background-color: #007bff;
}

.search-btn:hover {
  background-color: #0056b3;
}

.reset-btn {
  background-color: #6c757d;
}

.reset-btn:hover {
  background-color: #5a6268;
}

.refresh-btn {
  background-color: #28a745;
}

.refresh-btn:hover {
  background-color: #218838;
}

.message-list {
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.action-buttons button {
  padding: 6px 10px;
  font-size: 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

.details-btn {
  background-color: #007bff;
}

.details-btn:hover {
  background-color: #0056b3;
}

.no-data {
  text-align: center;
  color: #888;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 750px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.modal-close-btn {
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  background-color: transparent;
  color: #666;
  border: none;
  padding: 0;
}

.modal-close-btn:hover {
  color: #000;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  max-height: 400px;
  overflow-y: auto;
}
.modal-body {
    /* 移除 pre 的样式，让内容更灵活 */
    padding: 0;
}

.details-content {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    max-height: 400px;
    overflow-y: auto;
}

.details-content p {
    margin: 8px 0; /* 增加行间距 */
    padding-bottom: 5px;
    border-bottom: 1px dashed #eee; /* 添加虚线分隔 */
    display: flex; /* 使用 flex 布局对齐键值 */
}

.details-content p:last-child {
    border-bottom: none;
}

.detail-key {
    font-weight: bold;
    color: #333;
    flex: 0 0 150px; /* 固定键名宽度 */
    margin-right: 15px;
}

.detail-value {
    color: #555;
    flex-grow: 1;
    white-space: pre-wrap; /* 保持换行和空格，但允许长内容自动换行 */
    word-break: break-all; /* 防止长字符串溢出 */
}

.no-data {
    text-align: center;
    color: #888;
    padding: 20px;
    border: none !important;
}
</style>