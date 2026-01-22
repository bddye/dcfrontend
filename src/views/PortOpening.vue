<template>
  <div class="page-container">
    <div class="card">
      <div class="search-panel">
        <button @click="openCreateModal" class="btn btn-success ml-auto">+ 新增端口</button>
      </div>
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
              <td><span class="tag tag-info">{{ portDetail.type }}</span></td>
              <td class="text-secondary">{{ portDetail.formattedMode }}</td>
              <td>
                <a @click="showDetails(portDetail)" class="action-link">详情</a>
                <a @click="confirmClosePort(portDetail)" class="action-link danger">关闭</a>
              </td>
            </tr>
            <tr v-if="portDetailsWithFormattedMode.length === 0">
              <td colspan="4" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CommonModal v-model="showCreateModal" title="新增端口" confirmText="提交" :confirmDisabled="!isFormValid" @confirm="submitNewPort">
      <div class="form-group">
        <label class="form-label">类型</label>
        <select class="form-select" v-model="newPortDetail.type">
          <option value="" disabled>请选择端口类型</option>
          <option v-for="type in portTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">端口</label>
        <input type="number" class="form-input" v-model.number="newPortDetail.port" />
      </div>

      <div v-if="newPortDetail.type" class="p-4 bg-gray-50 border border-gray-100 rounded mb-4">
        <div class="grid-2">
          <div class="form-group mb-0">
            <label class="form-label">解码协议</label>
            <select class="form-select" v-model="newPortDetail.how2decode">
              <option value="" disabled>选择协议</option>
              <option v-for="p in how2decodeOptions" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">解码实体</label>
            <select class="form-select" v-model="newPortDetail.decode2what">
              <option value="" disabled>选择实体</option>
              <option v-for="e in decode2whatOptions" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="newPortDetail.type === 'TCP-only'" class="form-group">
        <label class="flex-actions items-center cursor-pointer">
          <input type="checkbox" v-model="newPortDetail.useAdvancedOptions" />
          <span class="ml-2">高级选项 (粘拆包配置)</span>
        </label>
      </div>

      <div v-if="newPortDetail.type === 'TCP-only' && newPortDetail.useAdvancedOptions" class="p-4 border border-dashed rounded bg-gray-50">
        <div class="form-group">
          <label class="form-label">模式</label>
          <div class="flex-actions">
            <label class="flex-actions items-center cursor-pointer"><input type="radio" value="DELIMITED" v-model="newPortDetail.bufferProcessMode" /> <span class="ml-1">行分隔符</span></label>
            <label class="flex-actions items-center cursor-pointer"><input type="radio" value="FIXED_LENGTH" v-model="newPortDetail.bufferProcessMode" /> <span class="ml-1">定长</span></label>
            <label class="flex-actions items-center cursor-pointer"><input type="radio" value="CUSTOM" v-model="newPortDetail.bufferProcessMode" /> <span class="ml-1">自定义</span></label>
          </div>
        </div>

        <div v-if="newPortDetail.bufferProcessMode === 'CUSTOM'" class="mt-4 pt-4 border-t border-gray-200">
          <div class="form-group">
            <label class="form-label">脚本名称</label>
            <input type="text" class="form-input" v-model="newPortDetail.script.name" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">代码块</label>
            <textarea class="form-textarea font-mono text-sm" v-model="newPortDetail.script.script" rows="6"></textarea>
          </div>
        </div>
      </div>
    </CommonModal>

    <CommonModal v-model="showDetailsModal" title="端口详情" :showConfirm="false" cancelText="关闭">
      <pre class="details-pre">{{ formattedDetails }}</pre>
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
  port: null, type: '', useAdvancedOptions: false, bufferProcessMode: 'DELIMITED',
  script: { name: '', script: '' }, how2decode: '', decode2what: ''
});

const BASE_URL = config.BASE_URL+'/server';
const SUCCESS_CODE = 200;

const modeMapping = { 'DELIMITED': '行分隔符', 'FIXED_LENGTH': '定长', 'CUSTOM': '自定义' };

const portDetailsWithFormattedMode = computed(() => {
  return (portDetails.value || []).map(p => {
    const mode = p.bufferProcessMode || p.mode;
    const type = p.type || (p.protocolName ? 'TCP-only' : 'N/A');
    return { ...p, type, formattedMode: type === 'TCP-only' && mode ? modeMapping[mode] || mode : 'N/A' };
  });
});

const isFormValid = computed(() => {
  if (!newPortDetail.value.type || !newPortDetail.value.port) return false;
  if (newPortDetail.value.type === 'TCP-only' && newPortDetail.value.useAdvancedOptions) {
    if (newPortDetail.value.bufferProcessMode === 'CUSTOM') {
      return !!newPortDetail.value.script.name && !!newPortDetail.value.script.script;
    }
  } else {
    if (!newPortDetail.value.how2decode || !newPortDetail.value.decode2what) return false;
  }
  return true;
});

const formattedDetails = computed(() => JSON.stringify(selectedPortDetail.value, null, 2));

const fetchPorts = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/getAllPortsOpened`);
    if (res.data.code === SUCCESS_CODE) portDetails.value = res.data.data || [];
  } catch (e) { notificationStore.error('获取列表失败'); }
};

const fetchPortTypes = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/getAllTypes`);
    if (res.data.code === SUCCESS_CODE) portTypes.value = res.data.data || [];
  } catch (e) {}
};

const confirmClosePort = (p) => { if (confirm(`确认关闭端口 ${p.port}？`)) closePort(p); };

const closePort = async (p) => {
  try {
    const res = await axios.delete(`${BASE_URL}/closePort/${p.port}`);
    if (res.data.code === SUCCESS_CODE) { notificationStore.success('端口已关闭'); fetchPorts(); }
  } catch (e) { notificationStore.error('关闭失败'); }
};

const submitNewPort = async () => {
  try {
    let res;
    if (newPortDetail.value.type === 'TCP-only' && newPortDetail.value.useAdvancedOptions) {
      const payload = {
        port: newPortDetail.value.port,
        enabled: true,
        bufferProcessMode: newPortDetail.value.bufferProcessMode,
        script: newPortDetail.value.bufferProcessMode === 'CUSTOM' ? newPortDetail.value.script : null,
        how2decode: newPortDetail.value.how2decode,
        decode2what: newPortDetail.value.decode2what
      };
      res = await axios.post(`${BASE_URL}/openTCPoPort`, payload);
    } else {
      const payload = {
        type: newPortDetail.value.type,
        port: newPortDetail.value.port,
        how2decode: newPortDetail.value.how2decode,
        decode2what: newPortDetail.value.decode2what
      };
      res = await axios.post(`${BASE_URL}/openPort`, payload);
    }
    if (res.data.code === SUCCESS_CODE) { notificationStore.success('端口已开放'); showCreateModal.value = false; fetchPorts(); }
    else { notificationStore.error(res.data.message || '开放失败'); }
  } catch (e) { notificationStore.error('开放失败'); }
};

const openCreateModal = () => {
  newPortDetail.value = { port: null, type: '', useAdvancedOptions: false, bufferProcessMode: 'DELIMITED', script: { name: '', script: '' }, how2decode: '', decode2what: '' };
  showCreateModal.value = true;
};

const showDetails = (p) => { selectedPortDetail.value = p; showDetailsModal.value = true; };

onMounted(() => {
  fetchPorts(); fetchPortTypes();
  axios.get(`${BASE_URL}/getAllHow2decode`).then(r => how2decodeOptions.value = r.data.data);
  axios.get(`${BASE_URL}/getAllDecode2what`).then(r => decode2whatOptions.value = r.data.data);
});
</script>

<style scoped>
.bg-gray-50 { background-color: #f9fafb; }
.border-gray-100 { border-color: #f3f4f6; }
.border-gray-200 { border-color: #e5e7eb; }
.ml-2 { margin-left: 8px; }
.ml-1 { margin-left: 4px; }
.details-pre { background: #f5f5f5; padding: 12px; border-radius: 2px; font-size: 13px; }
.rounded { border-radius: 4px; }
.mb-0 { margin-bottom: 0; }
.items-center { align-items: center; }
</style>
