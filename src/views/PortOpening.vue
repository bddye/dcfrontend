<template>
  <div class="port-opening-page">
    <div class="search-panel">
      <button @click="openCreateModal" class="new-port-btn">新增端口</button>
    </div>

    <hr />

    <div class="port-list">
      <h3>已开放的端口</h3>
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
            <td>{{ portDetail.port }}</td>
            <td>{{ portDetail.type }}</td>
            <td>{{ portDetail.formattedMode }}</td>
            <td class="action-buttons">
              <button @click="showDetails(portDetail)" class="details-btn">
                详情
              </button>
              <button @click="confirmClosePort(portDetail)" class="close-btn">
                关闭
              </button>
            </td>
          </tr>
          <tr v-if="portDetailsWithFormattedMode.length === 0">
            <td colspan="4" class="no-data">没有开放的端口。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>新增端口</h4>
          <span class="modal-close-btn" @click="closeCreateModal">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitNewPort">
            <div class="form-group">
              <label for="new-port-type">类型:</label>
              <select id="new-port-type" v-model="newPortDetail.type">
                <option value="" disabled>请选择端口类型</option>
                <option v-for="type in portTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="new-port">端口:</label>
              <input type="number" id="new-port" v-model.number="newPortDetail.port" required min="1" max="65535" />
            </div>

            <div v-if="newPortDetail.type" class="decoding-options">
              <div class="form-group">
                <label for="new-how2decode">解码协议:</label>
                <select id="new-how2decode" v-model="newPortDetail.how2decode" required>
                  <option value="" disabled>请选择解码协议</option>
                  <option v-for="protocol in how2decodeOptions" :key="protocol" :value="protocol">
                    {{ protocol }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="new-decode2what">解码实体:</label>
                <select id="new-decode2what" v-model="newPortDetail.decode2what" required>
                  <option value="" disabled>请选择解码实体</option>
                  <option v-for="entity in decode2whatOptions" :key="entity" :value="entity">
                    {{ entity }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="newPortDetail.type === 'TCP-only'" class="form-group">
              <label>
                <input type="checkbox" v-model="newPortDetail.useAdvancedOptions" />
                高级选项 (粘拆包配置)
              </label>
            </div>

            <div v-if="newPortDetail.type === 'TCP-only' && newPortDetail.useAdvancedOptions" class="advanced-options">
              <div class="form-group">
                <label>模式:</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" value="DELIMITED" v-model="newPortDetail.bufferProcessMode" />
                    行分隔符模式
                  </label>
                  <label>
                    <input type="radio" value="FIXED_LENGTH" v-model="newPortDetail.bufferProcessMode" />
                    定长头模式 (4字节)
                  </label>
                  <label>
                    <input type="radio" value="CUSTOM" v-model="newPortDetail.bufferProcessMode" />
                    自定义模式
                  </label>
                </div>
              </div>

              <div v-if="newPortDetail.bufferProcessMode === 'CUSTOM'" class="custom-script">
                <div class="form-group">
                  <label for="script-name">脚本名称:</label>
                  <input type="text" id="script-name" v-model="newPortDetail.script.name" required />
                </div>
                <div class="form-group">
                  <label for="script-code">代码块:</label>
                  <textarea id="script-code" v-model="newPortDetail.script.script" rows="6" required></textarea>
                </div>
              </div>
            </div>
            
            <button type="submit" class="submit-btn" :disabled="!isFormValid">
              打开端口
            </button>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showDetailsModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>端口详情: {{ selectedPortDetail.port }}</h4>
          <span class="modal-close-btn" @click="closeDetailsModal">&times;</span>
        </div>
        <div class="modal-body">
          <pre>{{ formattedDetails }}</pre>
        </div>
      </div>
    </div>
    
    <div v-if="showMessageModal" class="modal-overlay">
      <div class="modal message-modal">
        <div class="modal-header">
          <h4>{{ messageTitle }}</h4>
          <span class="modal-close-btn" @click="closeMessageModal">&times;</span>
        </div>
        <div class="modal-body">
          <p>{{ messageContent }}</p>
          <button @click="closeMessageModal" class="submit-btn">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import config from '../config/config';

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
  bufferProcessMode: '',
  script: {
    name: '',
    script: ''
  },
  how2decode: '',
  decode2what: ''
});

// 新增消息模态窗口状态
const showMessageModal = ref(false);
const messageTitle = ref('');
const messageContent = ref('');

const BASE_URL = config.BASE_URL+'/server';
const SUCCESS_CODE = 200; // 假设后端业务成功码是 200

// 通用消息提示函数
const showMessage = (title, content) => {
  messageTitle.value = title;
  messageContent.value = content;
  showMessageModal.value = true;
};

// 关闭消息提示函数
const closeMessageModal = () => {
  showMessageModal.value = false;
  messageTitle.value = '';
  messageContent.value = '';
};

// 模式名称映射
const modeMapping = {
  'DELIMITED': '行分隔符模式',
  'FIXED_LENGTH': '定长头模式 (4字节)',
  'CUSTOM': '自定义模式'
};

// 计算属性，用于在表格中显示格式化的模式名称
const portDetailsWithFormattedMode = computed(() => {
  // 确保 portDetails.value 存在且可迭代
  if (!portDetails.value) return [];
  
  return portDetails.value.map(portDetail => {
    // 兼容 TCPoServerStartEntity 的字段
    const mode = portDetail.bufferProcessMode || portDetail.mode; 
    const type = portDetail.type || (portDetail.protocolName ? 'TCP-only' : 'N/A'); // 简单推断类型
    
    const formattedMode = type === 'TCP-only' && mode ? modeMapping[mode] || mode : 'N/A';
    
    return {
      ...portDetail,
      type,
      formattedMode
    };
  });
});

watch(() => newPortDetail.value.type, (newType, oldType) => {
    // 当端口类型切换时，重置解码选择和高级选项，保证逻辑清晰
    if (newType !== oldType) {
        newPortDetail.value.how2decode = '';
        newPortDetail.value.decode2what = '';
        newPortDetail.value.useAdvancedOptions = false;
        newPortDetail.value.bufferProcessMode = 'DELIMITED'; // 默认值
    }
});

// 计算属性，用于判断表单是否有效
const isFormValid = computed(() => {
  if (!newPortDetail.value.type || !newPortDetail.value.port) {
    return false;
  }
  
  // 如果是 TCP-only 并且使用了高级选项
  if (newPortDetail.value.type === 'TCP-only' && newPortDetail.value.useAdvancedOptions) {
    if (!newPortDetail.value.bufferProcessMode) {
      return false; // 必须选择模式
    }
    if (newPortDetail.value.bufferProcessMode === 'CUSTOM') {
      return !!newPortDetail.value.script.name && !!newPortDetail.value.script.script; // 自定义模式必须有脚本内容
    }
    // 【注意】高级模式下不校验 how2decode/decode2what
  } else {
    // 【新增校验】简单模式下必须选择解码协议和实体
    if (!newPortDetail.value.how2decode || !newPortDetail.value.decode2what) {
        return false;
    }
  }

  return true;
});

// 计算属性，用于格式化详情弹窗中的数据
const formattedDetails = computed(() => {
  return JSON.stringify(selectedPortDetail.value, null, 2);
});

/**
 * 【新增】获取所有解码协议
 */
const fetchHow2DecodeOptions = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllHow2decode`);
        
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            how2decodeOptions.value = response.data.data || []; 
        } else {
            console.error('获取解码协议失败:', response.data.message);
            how2decodeOptions.value = [];
        }
    } catch (error) {
        console.error('获取解码协议失败:', error);
    }
};

/**
 * 【新增】获取所有解码实体
 */
const fetchDecode2WhatOptions = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllDecode2what`);
        
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            decode2whatOptions.value = response.data.data || []; 
        } else {
            console.error('获取解码实体失败:', response.data.message);
            decode2whatOptions.value = [];
        }
    } catch (error) {
        console.error('获取解码实体失败:', error);
    }
};

/**
 * 【更新】获取所有开放的端口信息
 */
const fetchPorts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllPortsOpened`);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      portDetails.value = response.data.data || [];
    } else {
      console.error('获取端口列表失败:', response.data.message);
      portDetails.value = [];
      showMessage('错误', response.data.message || '获取端口列表失败。');
    }
  } catch (error) {
    console.error('获取端口列表失败:', error);
    portDetails.value = [];
    showMessage('错误', '获取端口列表失败，请检查网络或服务器状态。');
  }
};

/**
 * 【更新】获取所有端口类型
 */
const fetchPortTypes = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllTypes`);
        
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            // *** 确保 portTypes 存储的是 data 字段下的列表 ***
            portTypes.value = response.data.data || []; 
        } else {
            console.error('获取端口类型失败:', response.data.message);
            portTypes.value = [];
        }
    } catch (error) {
        console.error('获取端口类型失败:', error);
    }
};

// 显示端口详情弹窗
const showDetails = (portDetail) => {
  selectedPortDetail.value = portDetail;
  showDetailsModal.value = true;
};

// 关闭端口详情弹窗
const closeDetailsModal = () => {
  showDetailsModal.value = false;
};

// 确认并关闭端口
const confirmClosePort = (portDetail) => {
  // 使用更友好的确认框，而不是原生 alert
  if (window.confirm(`你确定要关闭端口 ${portDetail.port} 吗？此操作不可逆！`)) {
    closePort(portDetail);
  }
};

/**
 * 【更新】关闭端口 (DELETE)
 */
const closePort = async (portDetail) => {
  try {
    const url = `${BASE_URL}/closePort/${portDetail.port}`;
    const response = await axios.delete(url); 
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', response.data.message || `端口 ${portDetail.port} 已成功关闭！`);
      fetchPorts();
    } else {
      console.error('关闭端口失败:', response.data.message);
      showMessage('失败', response.data.message || `关闭端口 ${portDetail.port} 失败：未知错误。`);
    }
  } catch (error) {
    console.error('关闭端口失败:', error);
    const errorMessage = error.response?.data?.message || '关闭端口失败，请检查网络或服务器状态。';
    showMessage('关闭失败', errorMessage);
  }
};

// 打开新增端口弹窗
const openCreateModal = () => {
  showCreateModal.value = true;
  // 重置表单
  newPortDetail.value = {
    port: null,
    type: '',
    useAdvancedOptions: false,
    bufferProcessMode: 'DELIMITED', // 默认选中一个模式
    script: {
      name: '',
      script: ''
    },
    how2decode: '', // 【重置】
    decode2what: '' // 【重置】
  };
};

// 关闭新增端口弹窗
const closeCreateModal = () => {
  showCreateModal.value = false;
};

/**
 * 【更新】提交新端口 - 调整了 openPort 的 payload
 */
const submitNewPort = async () => {
  if (!isFormValid.value) {
    showMessage('提示', '请检查所有必填字段是否已填写！');
    return;
  }
    
  try {
    let response;
    
    if (newPortDetail.value.type === 'TCP-only' && newPortDetail.value.useAdvancedOptions) {
      // 1. 调用 openTCPoPort (高级 TCP 模式)
      const payload = {
          port: newPortDetail.value.port,
          enabled: true,
          bufferProcessMode: newPortDetail.value.bufferProcessMode,
          script: newPortDetail.value.bufferProcessMode === 'CUSTOM' ? {
              name: newPortDetail.value.script.name,
              script: newPortDetail.value.script.script
          } : null,
          how2decode: newPortDetail.value.how2decode,
          decode2what: newPortDetail.value.decode2what
      };
      
      const url = `${BASE_URL}/openTCPoPort`;
      response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // 2. 调用 openPort (简单模式: 包含 MQTT 和 非高级 TCP)
      const url = `${BASE_URL}/openPort`;
      const payload = {
          type: newPortDetail.value.type,
          port: newPortDetail.value.port,
          how2decode: newPortDetail.value.how2decode, // 【新增】
          decode2what: newPortDetail.value.decode2what // 【新增】
      };
      response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' }
      });
    }

    // ... (省略成功/失败处理) ...
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', response.data.message || '端口开放成功！');
      closeCreateModal();
      fetchPorts();
    } else {
      console.error('端口开放失败:', response.data.message);
      showMessage('失败', response.data.message || '端口开放失败：未知错误。');
    }
  } catch (error) {
    console.error('开放端口失败:', error);
    const errorMessage = error.response?.data?.message || '开放端口失败，请检查网络或端口是否被占用。';
    showMessage('开放失败', errorMessage);
  }
};

// 页面加载时自动获取所有端口信息和类型
onMounted(() => {
  fetchPorts();
  fetchPortTypes();
  fetchHow2DecodeOptions();
  fetchDecode2WhatOptions();
});
</script>

<style scoped>
.port-opening-page {
  font-family: Arial, sans-serif;
  padding: 20px;
}

.search-panel {
  display: flex;
  justify-content: flex-end; /* 将按钮放在右边 */
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.new-port-btn {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
}

.new-port-btn:hover {
  background-color: #218838;
}

.port-list {
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

.close-btn {
  background-color: #dc3545;
}

.close-btn:hover {
  background-color: #c82333;
}

.no-data {
  text-align: center;
  color: #888;
}

/* 弹窗样式 */
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
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

/* 消息弹窗的紧凑样式 */
.message-modal {
  width: 400px;
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="number"], 
.form-group input[type="text"], 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-btn:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.advanced-options {
  border: 1px dashed #ccc;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-script {
  margin-top: 15px;
  padding: 10px;
  background-color: #f4f4f4;
  border-radius: 4px;
}.decoding-options {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  background-color: #fcfcfc;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}
</style>