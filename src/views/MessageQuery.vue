<template>
  <div class="page-container">
    <div class="card">
      <div class="search-panel">
        <select class="form-select w-64" v-model="selectedType">
          <option value="">全部类型</option>
          <option v-for="type in messageTypes" :key="type" :value="type">{{ type }}</option>
        </select>
        <button @click="executeSearch" class="btn btn-primary">查询</button>
        <button @click="resetSearch" class="btn btn-secondary">重置</button>
        <button @click="fetchMessages" class="btn btn-secondary ml-auto">🔄 刷新</button>
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
              <td><span class="tag tag-info">{{ message.type || 'N/A' }}</span></td>
              <td>{{ message.location || 'N/A' }}</td>
              <td class="text-secondary">{{ formatTime(message.createTime) }}</td>
              <td class="text-secondary">{{ formatTime(message.receiveTime) }}</td>
              <td>
                <a @click="showDetails(message)" class="action-link">详情</a>
              </td>
            </tr>
            <tr v-if="messages.length === 0">
              <td colspan="6" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination controls -->
        <div class="pagination mt-4 flex items-center justify-center gap-4" v-if="totalPages > 1">
          <button @click="changePage(pageParam.pageNo - 1)" :disabled="pageParam.pageNo <= 1" class="btn btn-sm btn-secondary">上一页</button>
          <span class="text-sm">第 {{ pageParam.pageNo }} / {{ totalPages }} 页</span>
          <button @click="changePage(pageParam.pageNo + 1)" :disabled="pageParam.pageNo >= totalPages" class="btn btn-sm btn-secondary">下一页</button>
        </div>
      </div>
    </div>

    <CommonModal v-model="showDetailsModal" title="消息详情" :showConfirm="false" cancelText="关闭">
      <div class="details-list">
        <div v-for="(value, key) in formattedDetails" :key="key" class="details-item">
          <div class="details-label">{{ key }}</div>
          <div class="details-value">{{ value }}</div>
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
const selectedType = ref('');
const showDetailsModal = ref(false);
const selectedMessageDetail = ref({});
const totalPages = ref(0);
const pageParam = ref({
    pageNo: 1,
    pageSize: 10,
    param: null
});

const detailKeyMap = {
    id: '消息 ID',
    type: '消息类型',
    location: '位置信息',
    createTime: '创建时间',
    receiveTime: '接收时间',
    status: '处理状态',
    payload: '消息内容',
};

const formattedDetails = computed(() => {
    const detail = selectedMessageDetail.value;
    const formatted = {};
    for (const key in detail) {
        let displayKey = detailKeyMap[key] || key;
        let value = detail[key];
        if (key.includes('Time') && value) value = formatTime(value);
        else if (typeof value === 'object' && value !== null) value = JSON.stringify(value, null, 2);
        formatted[displayKey] = value ?? 'N/A';
    }
    return formatted;
});

const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    try {
        return String(timeValue).replace('T', ' ').split('.')[0];
    } catch (e) { return String(timeValue); }
};

const fetchMessageTypes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllTypes`);
    if (response.data.code === SUCCESS_CODE) messageTypes.value = response.data.data || [];
  } catch (error) { console.error(error); }
};

const fetchMessages = async () => {
  try {
    const type = selectedType.value;
    const url = type ? `${BASE_URL}/getMessagesPageByType` : `${BASE_URL}/getAllMessagesPage`;

    // PageParam<Message>
    const payload = {
      pageNo: pageParam.value.pageNo,
      pageSize: pageParam.value.pageSize,
      param: type ? { type: type } : null
    };

    const response = await axios.post(url, payload);
    if (response.data.code === SUCCESS_CODE) {
      messages.value = response.data.data.records || response.data.data.list || [];
      totalPages.value = response.data.data.pages || (messages.value.length > 0 ? 1 : 0);
    }
  } catch (error) { notificationStore.error('获取列表失败'); }
};

const executeSearch = () => {
    pageParam.value.pageNo = 1;
    fetchMessages();
};

const changePage = (page) => {
    pageParam.value.pageNo = page;
    fetchMessages();
};

const resetSearch = () => {
  selectedType.value = '';
  executeSearch();
};

const showDetails = (msg) => {
  selectedMessageDetail.value = msg;
  showDetailsModal.value = true;
};

onMounted(() => {
  fetchMessageTypes();
  fetchMessages();
});
</script>

<style scoped>
.details-list { display: flex; flex-direction: column; gap: 16px; }
.details-item { border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
.details-item:last-child { border-bottom: none; }
.details-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.details-value { font-size: 14px; white-space: pre-wrap; word-break: break-all; }
.pagination { padding: 10px 0; border-top: 1px solid var(--border-color); }
.justify-center { justify-content: center; }
.items-center { align-items: center; }
</style>
