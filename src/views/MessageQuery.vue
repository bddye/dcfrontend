<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">消息查询</h2>
      <div class="action-group">
        <button @click="fetchMessages" class="btn btn-secondary">
          <span>🔄</span> 刷新全部
        </button>
      </div>
    </div>

    <div class="card">
      <div class="search-panel">
        <div class="form-group mb-0">
          <label class="form-label">消息类型</label>
          <select class="form-select w-64" v-model="searchCriteria.messageType">
            <option value="">全部类型</option>
            <option v-for="type in messageTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <button @click="executeSearch" class="btn btn-primary">查询</button>
        <button @click="resetSearch" class="btn btn-secondary">重置</button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>消息 ID</th>
              <th>消息类型</th>
              <th>位置</th>
              <th>创建时间</th>
              <th>接收时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(message, index) in messages" :key="index">
              <td class="font-mono text-xs">{{ message.id || 'N/A' }}</td>
              <td>
                <span class="tag tag-info">{{ message.type || 'N/A' }}</span>
              </td>
              <td>{{ message.location || 'N/A' }}</td>
              <td class="text-secondary">{{ formatTime(message.createTime) }}</td>
              <td class="text-secondary">{{ formatTime(message.receiveTime) }}</td>
              <td>
                <button @click="showDetails(message)" class="btn btn-secondary btn-sm">
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="messages.length === 0">
              <td colspan="6" class="no-data">没有符合条件的消息。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal -->
    <CommonModal
      v-model="showDetailsModal"
      title="消息详情"
      width="40rem"
      :showConfirm="false"
      cancelText="关闭"
    >
      <div class="details-list" v-if="selectedMessageDetail">
        <div v-for="(value, key) in formattedDetails" :key="key" class="details-item">
          <div class="details-label">{{ key }}</div>
          <div class="details-value">{{ value }}</div>
        </div>
        <div v-if="Object.keys(formattedDetails).length === 0" class="no-data">
          无可用消息详情。
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import config from '../config/config'; 
import CommonModal from '../components/CommonModal.vue';
import { notificationStore } from '../notification';

const BASE_URL = config.BASE_URL + '/message';
const SUCCESS_CODE = 200;

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
  messageType: '',
});

const formattedDetails = computed(() => {
    const detail = selectedMessageDetail.value;
    const formatted = {};
    for (const key in detail) {
        if (Object.hasOwnProperty.call(detail, key)) {
            let displayKey = detailKeyMap[key] || key;
            let value = detail[key];
            if (key.includes('Time') && value) {
                value = formatTime(value);
            } else if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value, null, 2);
            }
            formatted[displayKey] = value === null || value === undefined ? 'N/A' : value;
        }
    }
    return formatted;
});

const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    try {
        if (typeof timeValue === 'number' || (typeof timeValue === 'string' && /^\d+$/.test(timeValue))) {
             const date = new Date(Number(timeValue));
             return date.toLocaleString();
        } 
        return String(timeValue).replace('T', ' ').split('.')[0];
    } catch (e) {
        return String(timeValue);
    }
};

const fetchMessageTypes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllTypes`);
    if (response.data && response.data.code === SUCCESS_CODE) {
      messageTypes.value = response.data.data || [];
    }
  } catch (error) {
    console.error('获取消息类型失败:', error);
  }
};

const fetchMessages = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllMessages`);
    if (response.data && response.data.code === SUCCESS_CODE) {
      messages.value = response.data.data || [];
      notificationStore.info('已更新消息列表');
    } else {
      messages.value = [];
    }
  } catch (error) {
    notificationStore.error('获取消息列表失败');
    messages.value = [];
  }
};

const executeSearch = async () => {
  const type = searchCriteria.value.messageType;
  if (type) {
    try {
        const response = await axios.get(`${BASE_URL}/getAllMessages`);
        if (response.data && response.data.code === SUCCESS_CODE) {
            messages.value = (response.data.data || []).filter(msg => msg.type === type);
        }
    } catch (error) {
        notificationStore.error('查询失败');
    }
  } else {
    await fetchMessages();
  }
};

const resetSearch = () => {
  searchCriteria.value.messageType = '';
  fetchMessages();
};

const showDetails = (messageDetail) => {
  selectedMessageDetail.value = messageDetail;
  showDetailsModal.value = true;
};

onMounted(() => {
  fetchMessageTypes();
  fetchMessages();
});
</script>

<style scoped>
.action-group {
  display: flex;
  gap: 0.75rem;
}

.w-64 {
  width: 16rem;
}

.mb-0 {
  margin-bottom: 0;
}

.text-xs {
  font-size: 0.75rem;
}

.text-secondary {
  color: var(--text-secondary);
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.details-item {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.details-item:last-child {
  border-bottom: none;
}

.details-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.details-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
