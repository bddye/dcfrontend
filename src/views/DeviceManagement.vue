<template>
  <div class="device-management-page">
    <div class="search-panel">
      <div class="search-form">
        <label for="device-type">设备种类:</label>
        <select id="device-type" v-model="selectedType">
          <option value="">所有设备</option>
          <option v-for="type in deviceTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
        <button @click="searchDevices">查询</button>
      </div>

      <button @click="openCreateModal" class="new-device-btn">新增设备</button>
    </div>

    <hr />

    <div class="device-list">
      <h3>设备列表</h3>
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>ID</th> <th>创建时间</th>
            <th>位置</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in devices" :key="device.id">
            <td>{{ device.name }}</td>
            <td>{{ device.id }}</td>
            <td>{{ formatTime(device.createTime) }}</td>
            <td>{{ device.location || 'N/A' }}</td>
            <td class="action-buttons">
              <span 
                :class="{'status-indicator': true, 'connected': simulatorStatus[device.id], 'disconnected': !simulatorStatus[device.id]}"
                :title="simulatorStatus[device.id] ? '模拟器已连接' : '模拟器未连接'"
              ></span>
              
              <button @click="showDetails(device)" class="detail-btn">
                详情
              </button>
              <button @click="confirmDelete(device)" class="delete-btn">
                删除
              </button>
              <button @click="simulateBehavior(device)" class="simulate-btn">
                模拟行为 </button>
            </td>
          </tr>
          <tr v-if="devices.length === 0">
            <td colspan="5" class="no-data">没有找到设备。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>设备详情</h4>
          <span class="close-btn" @click="showModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <pre>{{ JSON.stringify(selectedDevice, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>新增设备</h4>
          <span class="close-btn" @click="closeCreateModal">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitNewDevice">
            <div class="form-group">
              <label for="new-device-type">设备种类:</label>
              <select id="new-device-type" v-model="newDeviceType" @change="fetchTemplate">
                <option value="" disabled>请选择设备种类</option>
                <option v-for="type in deviceTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>

            <div v-if="templateDevice" class="form-fields">
              <div v-for="(value, key) in templateDevice" :key="key" class="form-group">
                <div v-if="key !== 'id' && key !== 'createTime' && key !== 'type'">
                  <label :for="key">{{ key }}:</label>
                  <input type="text" :id="key" v-model="templateDevice[key]" />
                </div>
              </div>
            </div>

            <button type="submit" class="submit-btn" :disabled="!templateDevice">创建</button>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showCustomModal" class="modal-overlay top-level-overlay">
      <div class="modal message-modal">
        <div class="modal-header">
          <h4>{{ modalTitle }}</h4>
          <span class="close-btn" @click="closeCustomModal">&times;</span>
        </div>
        <div class="modal-body">
          <p>{{ modalContent }}</p>
          <div class="modal-actions">
            <button v-if="modalConfirmAction" @click="performConfirmedAction" class="confirm-btn">确定</button>
            <button @click="closeCustomModal" class="close-modal-btn">{{ modalConfirmAction ? '取消' : '确定' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showSimulatorModal" class="modal-overlay">
    <div class="modal simulator-modal">
      <div class="modal-header">
        <h4>模拟设备行为: {{ simulatingDevice?.name }} (ID: {{ simulatingDevice?.id }})</h4>
        <span class="close-btn" @click="closeSimulatorModal">&times;</span>
      </div>
      <div class="modal-body">
        
        <div v-if="!simulatorStatus[simulatingDevice?.id]" class="connection-panel">
          <div class="form-group type-group">
            <label for="sim-type">类型:</label>
            <select id="sim-type" v-model="simulatorForm.type">
              <option value="" disabled>请选择类型</option>
              <option v-for="type in simulatorTypeOptions" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="connection-info">
            <div class="form-group ip-group">
              <label for="sim-ip">IP:</label>
              <input type="text" id="sim-ip" v-model="simulatorForm.ip" placeholder="服务器 IP">
            </div>
            <div class="form-group port-group">
              <label for="sim-port">端口:</label>
              <input type="number" id="sim-port" v-model.number="simulatorForm.port" placeholder="端口号">
            </div>
          </div>

          <button @click="executeSimulateAction('CONNECT')" class="connect-btn" 
                  :disabled="!simulatorForm.type || !simulatorForm.ip || !simulatorForm.port">
            连接
          </button>
        </div>

        <div v-else class="connection-panel connected-info">
          <p>✅ 已连接到 **{{ simulatorForm.type }}** 服务器 ({{ simulatorForm.ip }}:{{ simulatorForm.port }})</p>
        </div>
        
        <hr v-if="simulatorForm.type" />
        
        <div v-if="simulatorForm.type && simulatorStatus[simulatingDevice?.id]" class="send-panel">
          <h4>发送报文 (类型: {{ simulatorForm.type }})</h4>
          
          <div v-if="simulatorForm.type === 'MQTT'">
            <div class="form-group">
              <label for="sim-payload">Payload (明文):</label>
              <textarea id="sim-payload" v-model="simulatorForm.payload" rows="4"></textarea>
            </div>
          </div>
          
          <div v-else-if="simulatorForm.type === 'TCP-only'">
            <div class="form-group data-format-group">
              <label>报文格式:</label>
              <div class="radio-group horizontal-radio-group">
                <label>
                  <input type="radio" value="plaintext" v-model="tcpDataFormat" />
                  明文报文 (UTF-8)
                </label>
                <label>
                  <input type="radio" value="hex" v-model="tcpDataFormat" />
                  二进制报文 (Hex)
                </label>
              </div>
            </div>

            <div class="form-group">
              <label for="sim-data">{{ tcpDataFormat === 'plaintext' ? '明文输入' : '二进制 Hex (如: 50 61 79...)' }}:</label>
              <textarea id="sim-data" v-model="simulatorForm.data" rows="4"></textarea>
            </div>
          </div>
          
          <div class="modal-actions simulate-actions">
            <button @click="executeSimulateAction('SEND')" class="confirm-btn" :disabled="!simulatingDevice">
              发送报文
            </button>
            <button @click="executeSimulateAction('DISCONNECT')" class="close-modal-btn">
              断开连接
            </button>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import axios from 'axios';
import config from '../config/config';

const devices = ref([]);
const deviceTypes = ref([]);
const selectedType = ref('');
const showModal = ref(false);
const selectedDevice = ref(null);

const showCreateModal = ref(false);
const newDeviceType = ref('');
const templateDevice = ref(null);

const showCustomModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');
const modalConfirmAction = ref(null);

const BASE_URL = config.BASE_URL+'/deviceControl';
const SUCCESS_CODE = 200; // 假设后端业务成功码是 200

const showSimulatorModal = ref(false); // 模拟器主弹窗
const simulatingDevice = ref(null);    // 当前正在操作的设备对象

const simulatorForm = ref({
    // ⚠️ 使用 deviceId 替换 deviceIdentifier
    id: null,
    choice: null, 
    // 记录连接成功的 IP、Port 和 Type
    connectedIP: '',
    connectedPort: null,
    connectedType: '',

    ip: '',   // 输入框的临时值
    port: null, // 输入框的临时值
    type: '', 
    // ❗ 【修改点 2】删除 topic 字段
    payload: '',
    data: '',
});

const simulatorTypeOptions = ref([]);  // 从 BASE_URL/server/getAllTypes 获取

// 报文相关状态 (仅用于 TCPo)
const tcpDataFormat = ref('plaintext'); // 'plaintext' 或 'hex'

// ⚠️ 连接状态，key: device.id, value: boolean (true=已连接)
const simulatorStatus = ref({}); 

// 通用消息提示函数
const showMessage = (title, content) => {
    modalTitle.value = title;
    modalContent.value = content;
    modalConfirmAction.value = null;
    showCustomModal.value = true;
};

// 通用确认提示函数
const showConfirmation = (title, content, action) => {
    modalTitle.value = title;
    modalContent.value = content;
    modalConfirmAction.value = action;
    showCustomModal.value = true;
};

// 执行确认操作
const performConfirmedAction = () => {
    if (modalConfirmAction.value) {
        modalConfirmAction.value();
    }
    closeCustomModal();
};

// 关闭自定义模态窗口
const closeCustomModal = () => {
    showCustomModal.value = false;
    modalTitle.value = '';
    modalContent.value = '';
    modalConfirmAction.value = null;
};

// 时间格式化函数
const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    try {
        if (typeof timeValue === 'string') {
             return timeValue.replace('T', ' ').split('.')[0];
        } 
        const date = new Date(timeValue);
        return date.toLocaleString();
    } catch (e) {
        return String(timeValue);
    }
};

defineProps({
    title: {
        type: String,
        default: '设备管理'
    }
});

watch(tcpDataFormat, (newFormat, oldFormat) => {
    // 只有在 data 字段有内容时才进行转换
    if (simulatorForm.value.data) {
        if (newFormat === 'plaintext' && oldFormat === 'hex') {
            // Hex -> 明文
            const cleanHex = simulatorForm.value.data.replace(/\s/g, '');
            simulatorForm.value.data = hexToPlaintext(cleanHex);
        } else if (newFormat === 'hex' && oldFormat === 'plaintext') {
            // 明文 -> Hex
            simulatorForm.value.data = plaintextToHex(simulatorForm.value.data);
        }
    }
});

/**
 * 监听模拟器类型变化，重置表单部分字段
 */
watch(() => simulatorForm.value.type, (newType) => {
    // 确保报文类型和数据格式一致
    tcpDataFormat.value = 'plaintext';
    // ❗ 【修改点 3】删除对 topic 的重置
    simulatorForm.value.payload = '';
    simulatorForm.value.data = '';
});

/**
 * 获取所有设备种类
 */
const fetchDeviceTypes = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllDeviceTypes`);
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            deviceTypes.value = response.data.data || [];
        } else {
            console.error('获取设备种类失败:', response.data.message);
            showMessage('错误', response.data.message || '获取设备种类失败。');
        }
    } catch (error) {
        console.error('获取设备种类失败:', error);
        showMessage('错误', '获取设备种类失败，请检查网络或服务器状态。');
    }
};

/**
 * 获取所有设备或根据类型查询
 */
const fetchDevices = async (type = '') => {
    try {
        const url = type ? `${BASE_URL}/getDevicesByType?type=${type}` : `${BASE_URL}/getAllDevices`;
        const response = await axios.get(url);
        
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            devices.value = response.data.data || [];
        } else {
            console.error('获取设备列表失败:', response.data.message);
            devices.value = [];
            showMessage('错误', response.data.message || '获取设备列表失败。');
        }
    } catch (error) {
        console.error('获取设备列表失败:', error);
        devices.value = [];
        showMessage('错误', '获取设备列表失败，请检查网络或服务器状态。');
    }
};

// 搜索按钮点击事件
const searchDevices = () => {
    // 搜索时依然需要检查新列表设备的状态
    fetchDevicesAndStatus(selectedType.value); 
};

// 详情按钮点击事件
const showDetails = (device) => {
    selectedDevice.value = device;
    showModal.value = true;
};

// 打开新建设备弹窗
const openCreateModal = () => {
    showCreateModal.value = true;
    newDeviceType.value = '';
    templateDevice.value = null;
};

// 关闭新建设备弹窗
const closeCreateModal = () => {
    showCreateModal.value = false;
};

/**
 * 根据设备类型获取模板
 */
const fetchTemplate = async () => {
    if (!newDeviceType.value) {
        templateDevice.value = null;
        return;
    }
    try {
        const url = `${BASE_URL}/getTemplateDeviceByType?type=${newDeviceType.value}`;
        const response = await axios.get(url);
        
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            templateDevice.value = response.data.data;
            // ⚠️ 移除对 deviceIdentifier 的处理
            // if (!templateDevice.value.deviceIdentifier) {
            //     templateDevice.value.deviceIdentifier = ''; 
            // }
        } else {
            console.error('获取设备模板失败:', response.data.message);
            showMessage('错误', response.data.message || '获取设备模板失败。');
            templateDevice.value = null;
        }
    } catch (error) {
        console.error('获取设备模板失败:', error);
        showMessage('错误', '获取设备模板失败，请检查类型或网络。');
        templateDevice.value = null;
    }
};

/**
 * 提交新设备
 */
const submitNewDevice = async () => {
    if (!newDeviceType.value || !templateDevice.value) {
        showMessage('提示', '请选择设备种类并填写完整信息！');
        return;
    }
    
    // ⚠️ 删除了 deviceIdentifier 不能为空的校验

    const payload = {
        type: newDeviceType.value,
        device: { ...templateDevice.value }
    };
    
    // 移除由后端处理的字段
    delete payload.device.id;
    delete payload.device.createTime;

    try {
        const url = `${BASE_URL}/createNewDeviceByType`;
        const response = await axios.post(url, payload);
        
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            showMessage('成功', '设备创建成功！');
            closeCreateModal();
            fetchDevices();
        } else {
            console.error('设备创建失败:', response.data.message);
            showMessage('失败', response.data.message || '设备创建失败：未知错误。');
        }
    } catch (error) {
        console.error('创建设备失败:', error);
        const errorMessage = error.response?.data?.message || '创建设备失败，请检查输入或网络。';
        showMessage('创建设备失败', errorMessage);
    }
};

// 确认删除设备
const confirmDelete = (device) => {
    showConfirmation(
        '确认删除',
        // ⚠️ 使用 device.id 替换 device.deviceIdentifier
        `你确定要删除设备 "${device.name}" (ID: ${device.id}) 吗？`,
        () => deleteDevice(device)
    );
};

/**
 * 删除设备
 */
const deleteDevice = async (device) => {
    try {
        const url = `${BASE_URL}/deleteDeviceByTypeAndId/${device.type}/${device.id}`;
        const response = await axios.delete(url);

        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            showMessage('成功', '设备删除成功！');
            fetchDevices();
        } else {
            console.error('设备删除失败:', response.data.message);
            showMessage('失败', response.data.message || '设备删除失败：未知错误。');
        }
    } catch (error) {
        console.error('删除设备失败:', error);
        const errorMessage = error.response?.data?.message || '删除设备失败，请检查网络。';
        showMessage('删除设备失败', errorMessage);
    }
};

/**
 * 检查模拟器状态
 */
const checkSimulatorStatus = async (deviceId) => {
    try {
        // ⚠️ 使用 id 替换 deviceIdentifier 作为查询参数
        const url = `${BASE_URL}/checkSimulatorStatus?id=${deviceId}`;
        const response = await axios.get(url);

        // 假设后端返回 {status: true/false, ip: '...', port: 1234, type: 'TCPo'}
        const data = response.data.data;
        const isConnected = data.status === true;

        // ⚠️ 使用 deviceId 作为 key
        simulatorStatus.value[deviceId] = isConnected; 

        // 关键修改：更新持久化的 IP/Port/Type 状态
        if (isConnected) {
            simulatorForm.value.connectedIP = data.ip || '';
            simulatorForm.value.connectedPort = data.port || null;

            // ⚠️ 新增/修正：后端类型 ('TCPo') -> 前端类型 ('TCP-only')
            let uiType = data.type || '';
            if (uiType === 'TCPo') {
                uiType = 'TCP-only';
            }
            simulatorForm.value.connectedType = uiType;
        } else {
            simulatorForm.value.connectedIP = '';
            simulatorForm.value.connectedPort = null;
            simulatorForm.value.connectedType = '';
        }

    } catch (error) {
        console.error(`检查设备 ${deviceId} 连接状态失败:`, error);
        // ⚠️ 使用 deviceId 作为 key
        simulatorStatus.value[deviceId] = false;
        // 确保失败时清空持久化状态
        simulatorForm.value.connectedIP = '';
        simulatorForm.value.connectedPort = null;
        simulatorForm.value.connectedType = '';
    }
};

/**
 * 模拟器入口：点击 "模拟设备行为"
 */
const simulateBehavior = async (device) => {
    simulatingDevice.value = device;
    // ⚠️ 使用 deviceId 替换 deviceIdentifier
    simulatorForm.value.deviceId = device.id;
    
    // 必须在打开弹窗前调用，从后端获取最新的连接状态
    await checkSimulatorStatus(device.id); 

    // ⚠️ 使用 device.id 检查连接状态
    const isConnected = simulatorStatus.value[device.id] === true;
    
    // 2. 获取所有可用类型
    await fetchSimulatorTypes(); 
    
    // 3. 填充表单基础信息
    if (isConnected) {
        // 如果已连接，使用持久化状态填充，保证弹窗能正确显示连接信息和发送面板
        simulatorForm.value.ip = simulatorForm.value.connectedIP;
        simulatorForm.value.port = simulatorForm.value.connectedPort;
        simulatorForm.value.type = simulatorForm.value.connectedType;
    } else {
        // 如果未连接，清空输入框
        simulatorForm.value.ip = '';
        simulatorForm.value.port = null;
        simulatorForm.value.type = ''; 
    }

    // 清空报文相关字段
    // ❗ 【修改点 3.1】删除对 topic 的清空
    simulatorForm.value.payload = '';
    simulatorForm.value.data = '';
    tcpDataFormat.value = 'plaintext'; 
    
    // 4. 显示弹窗
    showSimulatorModal.value = true;
};

/**
 * 获取模拟器类型 (复用 /server/getAllTypes)
 */
const fetchSimulatorTypes = async () => {
      try {
        const response = await axios.get(`${config.BASE_URL}/server/getAllTypes`);
        if (response.status === 200 && response.data.code === SUCCESS_CODE) {
            // 过滤出我们需要的类型，并确保它们是 MQTT 和 TCP-only (对应后端变量 MQTT/TCPo)
            simulatorTypeOptions.value = response.data.data.filter(type => 
                type === 'MQTT' || type === 'TCP-only'
            );
        }
    } catch (error) {
        console.error('获取模拟器类型失败:', error);
    }
}


/**
 * 执行模拟器操作 (连接/断开/发送)
 */
const executeSimulateAction = async (choice) => {
    const form = simulatorForm.value;
    
    // 1. ⚠️ 使用 id 替换 deviceIdentifier
    const payload = {
        id: form.deviceId,
        choice: choice,
        ip: null,
        port: null,
        type: null,
    };

    // 2. 连接/断开逻辑
    if (choice === 'CONNECT' || choice === 'DISCONNECT') {
        // CONNECT 使用输入框值，DISCONNECT 使用已连接的持久化值
        const targetIP = (choice === 'CONNECT') ? form.ip : form.connectedIP;
        const targetPort = (choice === 'CONNECT') ? form.port : form.connectedPort;
        const targetType = (choice === 'CONNECT') ? form.type : form.connectedType;

        if (!targetIP || !targetPort) {
            // ⚠️ 使用 id 检查连接状态
            if (choice === 'DISCONNECT' && !simulatorStatus.value[form.deviceId]) {
                closeSimulatorModal();
                return;
            }
            showMessage('校验错误', `${choice} 操作需要 IP 和端口！`);
            return;
        }
        payload.ip = targetIP;
        payload.port = targetPort;
        // 确保 payload 的 type 是正确的 (TCP-only -> TCPo)
        payload.type = targetType === 'TCP-only' ? 'TCPo' : targetType;
    }

    // 3. SEND 逻辑
    if (choice === 'SEND') {
        // ⚠️ 使用 id 检查连接状态
        if (!simulatorStatus.value[form.deviceId]) {
            showMessage('警告', '请先连接到服务器才能发送报文。');
            return;
        }

        // 使用已连接的持久化状态构建 payload
        payload.ip = form.connectedIP;
        payload.port = form.connectedPort;
        const connectedType = form.connectedType;
        
        // 确保 payload.type 是正确的 (TCP-only -> TCPo)
        payload.type = connectedType === 'TCP-only' ? 'TCPo' : connectedType;

        if (connectedType === 'MQTT') {
            // ❗ 【修改点 4】删除对 topic 的校验和添加
            if (!form.payload) {
                showMessage('校验错误', 'MQTT 报文需要 Payload！');
                return;
            }
            // 假设服务器会根据设备 ID 自动分配或使用默认 Topic
            // payload.topic = form.topic; // <-- 删除
            payload.payload = form.payload; // 明文
        } else if (connectedType === 'TCP-only') {
            if (!form.data) {
                showMessage('校验错误', 'TCPo 报文需要数据内容！');
                return;
            }
            
            // 报文格式处理 (plaintext 或 hex)
            if (tcpDataFormat.value === 'hex') {
                // 如果是 Hex 格式，需要清理空格并进行校验，假设后端需要 Hex 字符串
                const cleanedData = form.data.replace(/\s+/g, '');
                if (!/^[0-9a-fA-F]*$/.test(cleanedData)) {
                    showMessage('校验错误', 'Hex 报文包含无效字符。');
                    return;
                }
                payload.data = cleanedData;
                payload.dataFormat = 'hex';
            } else {
                // 明文
                payload.data = form.data;
                payload.dataFormat = 'plaintext';
            }
        }
    }
    
    // 4. 发送请求
    try {
        const response = await axios.post(`${BASE_URL}/simulateDeviceBehaviour`, payload);

        if (response.status === 200 && response.data.code === SUCCESS_CODE) {

            // ⚠️ 更新连接状态和持久化 IP/Port
            if (choice === 'CONNECT') {
                // ⚠️ 使用 id 替换 deviceIdentifier
                simulatorStatus.value[form.deviceId] = true;
                // 保存连接成功的 IP/Port/Type 到持久化状态
                form.connectedIP = form.ip; 
                form.connectedPort = form.port;
                form.connectedType = form.type;
            } else if (choice === 'DISCONNECT') {
                showMessage('断开连接成功', '已断开连接。');
                // ⚠️ 使用 id 替换 deviceIdentifier
                simulatorStatus.value[form.deviceId] = false;
                // 清空所有状态
                form.connectedIP = '';
                form.connectedPort = null;
                form.connectedType = '';
                form.ip = ''; 
                form.port = null;
                form.type = ''; 
                // 断开连接后关闭弹窗
                closeSimulatorModal(); 
            } else{
                showMessage('成功', `${choice} 操作成功！`);
            }
            
        } else {
            showMessage('操作失败', response.data.message || `${choice} 操作失败，请检查服务器日志。`);
        }
    } catch (error) {
        console.error(`${choice} 操作请求失败:`, error);
        showMessage('请求错误', `无法执行 ${choice} 操作。`);
    }
};

/**
 * 关闭模拟器弹窗 (不执行断开连接)
 */
const closeSimulatorModal = () => {
    showSimulatorModal.value = false
    // 模态框关闭时不改变连接状态
};


// 页面加载时自动获取设备种类和所有设备
onMounted(async () => {
    await fetchDeviceTypes();
    // 修改：调用新的函数以检查状态
    await fetchDevicesAndStatus(); 
});

// 覆盖原有的 fetchDevices 以便在获取列表后检查状态
const fetchDevicesAndStatus = async (type = '') => {
    await fetchDevices(type);
    
    // 异步检查所有设备的模拟器状态
    devices.value.forEach(device => {
        // ⚠️ 检查状态现在使用 device.id
        setTimeout(() => {
            checkSimulatorStatus(device.id);
        }, 0);
    });
};

// 页面加载时自动获取设备种类和所有设备
onMounted(async () => {
    await fetchDevicesAndStatus(); 
});

const hexToPlaintext = (hexString) => {
    try {
        const cleanHex = hexString.replace(/\s/g, '');
        if (cleanHex.length % 2 !== 0) return hexString; // 长度不对，返回原值

        // 将 Hex 字符串转换为 Uint8Array 字节数组
        const bytes = [];
        for (let i = 0; i < cleanHex.length; i += 2) {
            bytes.push(parseInt(cleanHex.substring(i, i + 2), 16));
        }
        const uint8Array = new Uint8Array(bytes);

        // 使用 TextDecoder (默认 UTF-8) 解码为字符串
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(uint8Array);
    } catch (e) {
        console.error("HexToPlaintext Error:", e);
        return hexString; // 转换失败时返回原输入，防止数据丢失
    }
};

/**
 * 将 Plaintext 字符串转换为 Hex 字符串 (UTF-8)
 * 输入: "Payload"
 * 输出: "50 61 79 6C 6F 61 64" (带空格)
 */
const plaintextToHex = (text) => {
    try {
        // 使用 TextEncoder (默认 UTF-8) 编码为 Uint8Array
        const encoder = new TextEncoder();
        const utf8Bytes = encoder.encode(text);
        
        let hex = '';
        for (const byte of utf8Bytes) {
            hex += byte.toString(16).padStart(2, '0');
        }
        // 按用户需求的格式 (带空格分隔)
        return hex.toUpperCase().match(/.{1,2}/g)?.join(' ') || '';
    } catch (e) {
        console.error("PlaintextToHex Error:", e);
        return text; // 转换失败时返回原输入
    }
};

</script>

<style scoped>
/* 样式保持不变 */
.device-management-page {
  font-family: Arial, sans-serif;
}

.search-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-form {
  display: flex;
  gap: 15px;
  align-items: center;
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}

button:hover {
  background-color: #0056b3;
}

.new-device-btn {
  background-color: #28a745;
}

.new-device-btn:hover {
  background-color: #218838;
}

.device-list {
  padding: 20px;
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

.action-buttons {
  white-space: nowrap;
}

.delete-btn {
  background-color: #dc3545;
}

.delete-btn:hover {
  background-color: #c82333;
}

.simulate-btn {
  background-color: #6c757d;
}

.simulate-btn:hover {
  background-color: #5a6268;
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

.modal-overlay.top-level-overlay {
    z-index: 1010; /* 设置一个更高的值，确保覆盖所有其他模态框 */
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

.modal.message-modal {
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

.action-buttons button {
  padding: 6px 10px;
  font-size: 12px;
  margin-right: 5px;
}

.close-btn {
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
}

.modal-body pre {
  background: #f4f4f4;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 新增设备表单样式 */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.submit-btn, .confirm-btn, .close-modal-btn {
  width: 100%;
  padding: 12px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

.submit-btn {
  background-color: #28a745;
}

.submit-btn:hover:not(:disabled) {
  background-color: #218838;
}

.submit-btn:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions button {
  width: auto;
  flex: 1;
}

.confirm-btn {
  background-color: #28a745;
}

.close-modal-btn {
  background-color: #6c757d;
}

.action-buttons {
    display: flex; 
    align-items: center;
    gap: 5px; 
    white-space: nowrap;
}

/* 模拟器状态指示灯样式 */
.status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
    border: 1px solid #999; 
}

.status-indicator.connected {
    background-color: #28aa46; 
    border-color: #218838;
}

.status-indicator.disconnected {
    background-color: #c82333; 
    border-color: #dc3545;
}

/* 调整操作按钮样式，确保它们在 flex 容器中正常显示 */
.action-buttons button {
    margin: 0; 
}
.horizontal-radio-group label {
    /* 强制标签内的元素 (input 和 text) 在同一行垂直居中对齐 */
    display: flex;
    align-items: center;
    gap: 5px; 
    cursor: pointer; 
}

.horizontal-radio-group input[type="radio"] {
    /* 确保 radio 按钮不会被额外的样式影响，通常不需要 margin */
    margin: 0; 
    /* 确保 radio 按钮位于文字之前 */
    order: 1; 
}
</style>