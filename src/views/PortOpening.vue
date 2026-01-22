<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">服务端口开放</h2>
      <button @click="openCreateModal" class="btn btn-primary">新增端口</button>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>端口</th>
              <th>类型</th>
              <th>模式</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="portDetail in portDetailsWithFormattedMode" :key="portDetail.port">
              <td class="font-bold">{{ portDetail.port }}</td>
              <td>
                <span class="tag tag-info">{{ portDetail.type }}</span>
              </td>
              <td class="text-secondary">{{ portDetail.formattedMode }}</td>
              <td>
                <div class="flex-actions">
                  <button @click="showDetails(portDetail)" class="btn btn-secondary btn-sm">
                    详情
                  </button>
                  <button @click="confirmClosePort(portDetail)" class="btn btn-danger btn-sm">
                    关闭
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="portDetailsWithFormattedMode.length === 0">
              <td colspan="4" class="no-data">没有开放的端口。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <CommonModal
      v-model="showCreateModal"
      title="新增端口"
      confirmText="打开端口"
      :confirmDisabled="!isFormValid"
      @confirm="submitNewPort"
    >
      <form @submit.prevent>
        <div class="form-group">
          <label class="form-label">类型</label>
          <select class="form-select" v-model="newPortDetail.type">
            <option value="" disabled>请选择端口类型</option>
            <option v-for="type in portTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">端口</label>
          <input type="number" class="form-input" v-model.number="newPortDetail.port" required min="1" max="65535" />
        </div>

        <div v-if="newPortDetail.type" class="sub-section">
          <div class="form-group">
            <label class="form-label">解码协议</label>
            <select class="form-select" v-model="newPortDetail.how2decode" required>
              <option value="" disabled>请选择解码协议</option>
              <option v-for="protocol in how2decodeOptions" :key="protocol" :value="protocol">
                {{ protocol }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">解码实体</label>
            <select class="form-select" v-model="newPortDetail.decode2what" required>
              <option value="" disabled>请选择解码实体</option>
              <option v-for="entity in decode2whatOptions" :key="entity" :value="entity">
                {{ entity }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="newPortDetail.type === 'TCP-only'" class="form-group mt-4">
          <label class="flex-label">
            <input type="checkbox" v-model="newPortDetail.useAdvancedOptions" />
            <span>高级选项 (粘拆包配置)</span>
          </label>
        </div>

        <div v-if="newPortDetail.type === 'TCP-only' && newPortDetail.useAdvancedOptions" class="advanced-box">
          <div class="form-group">
            <label class="form-label">模式</label>
            <div class="radio-stack">
              <label class="radio-label">
                <input type="radio" value="DELIMITED" v-model="newPortDetail.bufferProcessMode" />
                <span>行分隔符模式</span>
              </label>
              <label class="radio-label">
                <input type="radio" value="FIXED_LENGTH" v-model="newPortDetail.bufferProcessMode" />
                <span>定长头模式 (4字节)</span>
              </label>
              <label class="radio-label">
                <input type="radio" value="CUSTOM" v-model="newPortDetail.bufferProcessMode" />
                <span>自定义模式</span>
              </label>
            </div>
          </div>

          <div v-if="newPortDetail.bufferProcessMode === 'CUSTOM'" class="script-box">
            <div class="form-group">
              <label class="form-label">脚本名称</label>
              <input type="text" class="form-input" v-model="newPortDetail.script.name" required />
            </div>
            <div class="form-group">
              <label class="form-label">代码块</label>
              <textarea class="form-textarea font-mono text-sm" v-model="newPortDetail.script.script" rows="6" required></textarea>
            </div>
          </div>
        </div>
      </form>
    </CommonModal>

    <!-- Details Modal -->
    <CommonModal
      v-model="showDetailsModal"
      title="端口详情"
      :showConfirm="false"
      cancelText="关闭"
    >
      <div class="details-view">
        <pre class="details-pre">{{ formattedDetails }}</pre>
      </div>
    </CommonModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import config from '../config/config';
import CommonModal from '../components/CommonModal.vue';
import { notificationStore } from '../notification';

const portDetails = ref([]);
const portTypes = ref([]);
const how2decodeOptions = ref([]);
const decode2whatOptions = ref([]);

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const selectedPortDetail = ref({});
const newPortDetail = ref({
  port: null,
  type: '',
  useAdvancedOptions: false,
  bufferProcessMode: 'DELIMITED',
  script: { name: '', script: '' },
  how2decode: '',
  decode2what: ''
});

const BASE_URL = config.BASE_URL+'/server';
const SUCCESS_CODE = 200;

const modeMapping = {
  'DELIMITED': '行分隔符模式',
  'FIXED_LENGTH': '定长头模式 (4字节)',
  'CUSTOM': '自定义模式'
};

const portDetailsWithFormattedMode = computed(() => {
  if (!portDetails.value) return [];
  return portDetails.value.map(portDetail => {
    const mode = portDetail.bufferProcessMode || portDetail.mode; 
    const type = portDetail.type || (portDetail.protocolName ? 'TCP-only' : 'N/A');
    const formattedMode = type === 'TCP-only' && mode ? modeMapping[mode] || mode : 'N/A';
    return { ...portDetail, type, formattedMode };
  });
});

watch(() => newPortDetail.value.type, (newType, oldType) => {
    if (newType !== oldType) {
        newPortDetail.value.how2decode = '';
        newPortDetail.value.decode2what = '';
        newPortDetail.value.useAdvancedOptions = false;
        newPortDetail.value.bufferProcessMode = 'DELIMITED';
    }
});

const isFormValid = computed(() => {
  if (!newPortDetail.value.type || !newPortDetail.value.port) return false;
  if (newPortDetail.value.type === 'TCP-only' && newPortDetail.value.useAdvancedOptions) {
    if (!newPortDetail.value.bufferProcessMode) return false;
    if (newPortDetail.value.bufferProcessMode === 'CUSTOM') {
      return !!newPortDetail.value.script.name && !!newPortDetail.value.script.script;
    }
  } else {
    if (!newPortDetail.value.how2decode || !newPortDetail.value.decode2what) return false;
  }
  return true;
});

const formattedDetails = computed(() => JSON.stringify(selectedPortDetail.value, null, 2));

const fetchHow2DecodeOptions = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllHow2decode`);
        if (response.data.code === SUCCESS_CODE) how2decodeOptions.value = response.data.data || [];
    } catch (error) { console.error(error); }
};

const fetchDecode2WhatOptions = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllDecode2what`);
        if (response.data.code === SUCCESS_CODE) decode2whatOptions.value = response.data.data || [];
    } catch (error) { console.error(error); }
};

const fetchPorts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllPortsOpened`);
    if (response.data.code === SUCCESS_CODE) portDetails.value = response.data.data || [];
  } catch (error) { notificationStore.error('获取端口列表失败'); }
};

const fetchPortTypes = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllTypes`);
        if (response.data.code === SUCCESS_CODE) portTypes.value = response.data.data || [];
    } catch (error) { console.error(error); }
};

const showDetails = (portDetail) => {
  selectedPortDetail.value = portDetail;
  showDetailsModal.value = true;
};

const confirmClosePort = (portDetail) => {
  if (window.confirm(`你确定要关闭端口 ${portDetail.port} 吗？`)) {
    closePort(portDetail);
  }
};

const closePort = async (portDetail) => {
  try {
    const response = await axios.delete(`${BASE_URL}/closePort/${portDetail.port}`);
    if (response.data.code === SUCCESS_CODE) {
      notificationStore.success(`端口 ${portDetail.port} 已成功关闭`);
      fetchPorts();
    } else {
      notificationStore.error(response.data.message || '关闭端口失败');
    }
  } catch (error) { notificationStore.error('网络错误，关闭端口失败'); }
};

const openCreateModal = () => {
  newPortDetail.value = {
    port: null, type: '', useAdvancedOptions: false,
    bufferProcessMode: 'DELIMITED', script: { name: '', script: '' },
    how2decode: '', decode2what: ''
  };
  showCreateModal.value = true;
};

const submitNewPort = async () => {
  try {
    let response;
    if (newPortDetail.value.type === 'TCP-only' && newPortDetail.value.useAdvancedOptions) {
      const payload = {
          port: newPortDetail.value.port, enabled: true,
          bufferProcessMode: newPortDetail.value.bufferProcessMode,
          script: newPortDetail.value.bufferProcessMode === 'CUSTOM' ? newPortDetail.value.script : null,
          how2decode: newPortDetail.value.how2decode,
          decode2what: newPortDetail.value.decode2what
      };
      response = await axios.post(`${BASE_URL}/openTCPoPort`, payload);
    } else {
      const payload = {
          type: newPortDetail.value.type, port: newPortDetail.value.port,
          how2decode: newPortDetail.value.how2decode, decode2what: newPortDetail.value.decode2what
      };
      response = await axios.post(`${BASE_URL}/openPort`, payload);
    }

    if (response.data.code === SUCCESS_CODE) {
      notificationStore.success('端口开放成功');
      showCreateModal.value = false;
      fetchPorts();
    } else {
      notificationStore.error(response.data.message || '端口开放失败');
    }
  } catch (error) { notificationStore.error('开放端口失败，请检查网络或端口状态'); }
};

onMounted(() => {
  fetchPorts();
  fetchPortTypes();
  fetchHow2DecodeOptions();
  fetchDecode2WhatOptions();
});
</script>

<style scoped>
.flex-actions {
  display: flex;
  gap: 0.5rem;
}

.sub-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.advanced-box {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
}

.radio-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.script-box {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.flex-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.details-pre {
  background-color: #f1f5f9;
  padding: 1rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  overflow-x: auto;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
