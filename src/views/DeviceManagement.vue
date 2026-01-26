<template>
  <div class="page-container">
    <div class="card">
      <div class="tab-nav mb-4">
        <button :class="['tab-btn', { active: currentTab === 'registration' }]" @click="currentTab = 'registration'">设备注册</button>
        <button :class="['tab-btn', { active: currentTab === 'connected' }]" @click="currentTab = 'connected'">已连接设备管理</button>
      </div>

      <div v-if="currentTab === 'registration'">
        <div class="search-panel">
          <select class="form-select w-64" v-model="selectedType">
            <option value="">全部类型</option>
            <option v-for="type in deviceTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <button @click="searchDevices" class="btn btn-primary">查询</button>
          <button @click="selectedType = ''; searchDevices()" class="btn btn-secondary">重置</button>
          <button @click="openCreateModal" class="btn btn-success ml-auto">+ 创建</button>
        </div>
      </div>

      <div v-else-if="currentTab === 'connected'">
        <div class="search-panel">
          <button @click="searchConnectedDevices" class="btn btn-primary">查询全部</button>
          <button @click="openConnectModal" class="btn btn-success ml-auto">主动连接</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div v-if="currentTab === 'registration'" class="table-container">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>ID</th>
              <th>创建时间</th>
              <th>位置</th>
              <th>模拟器</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="device in devices" :key="device.id">
              <td class="font-medium">{{ device.name }}</td>
              <td class="font-mono text-xs">{{ device.id }}</td>
              <td class="text-secondary">{{ formatTime(device.createTime) }}</td>
              <td>{{ device.location || 'N/A' }}</td>
              <td>
                <span :class="['status-dot', simulatorStatus[device.id] ? 'online' : 'offline']"></span>
              </td>
              <td>
                <a @click="showDetails(device)" class="action-link">详情</a>
                <a @click="simulateBehavior(device)" class="action-link">模拟</a>
                <a @click="confirmDelete(device)" class="action-link danger">删除</a>
              </td>
            </tr>
            <tr v-if="devices.length === 0">
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

      <div v-else-if="currentTab === 'connected'" class="table-container">
        <table>
          <thead>
            <tr>
              <th>设备ID</th>
              <th>设备种类</th>
              <th>状态</th>
              <th>IP和端口</th>
              <th>连接ID</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="device in connectedDevices" :key="device.connectionId">
              <td class="font-mono text-xs">{{ device.deviceId || 'unknown' }}</td>
              <td>{{ device.deviceCat || 'unknown' }}</td>
              <td>
                <span :class="['tag', device.deviceStates === 'ONLINE' ? 'tag-success' : 'tag-danger']">
                  {{ device.deviceStates || 'unknown' }}
                </span>
              </td>
              <td>{{ device.ipAndPort || 'unknown' }}</td>
              <td class="font-mono text-xs">{{ device.connectionId || 'unknown' }}</td>
              <td>
                <a @click="openChangeInfoModal(device)" class="action-link">修改</a>
              </td>
            </tr>
            <tr v-if="connectedDevices.length === 0">
              <td colspan="6" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination for connected devices -->
        <div class="pagination mt-4 flex items-center justify-center gap-4" v-if="connectedTotalPages > 1">
          <button @click="changeConnectedPage(connectedPageParam.pageNo - 1)" :disabled="connectedPageParam.pageNo <= 1" class="btn btn-sm btn-secondary">上一页</button>
          <span class="text-sm">第 {{ connectedPageParam.pageNo }} / {{ connectedTotalPages }} 页</span>
          <button @click="changeConnectedPage(connectedPageParam.pageNo + 1)" :disabled="connectedPageParam.pageNo >= connectedTotalPages" class="btn btn-sm btn-secondary">下一页</button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CommonModal v-model="showModal" title="设备详情" :showConfirm="false" cancelText="关闭">
      <pre class="details-pre">{{ JSON.stringify(selectedDevice, null, 2) }}</pre>
    </CommonModal>

    <CommonModal v-model="showCreateModal" title="新增设备" confirmText="提交" @confirm="submitNewDevice" :confirmDisabled="!templateDevice">
      <div class="form-group">
        <label class="form-label">设备种类</label>
        <select class="form-select" v-model="newDeviceType" @change="fetchTemplate">
          <option value="" disabled>请选择设备种类</option>
          <option v-for="type in deviceTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      <div v-if="templateDevice" class="template-fields">
        <div v-for="(value, key) in templateDevice" :key="key">
          <div v-if="key !== 'id' && key !== 'createTime' && key !== 'type'" class="form-group">
            <label class="form-label">{{ key }}</label>
            <input type="text" class="form-input" v-model="templateDevice[key]" />
          </div>
        </div>
      </div>
    </CommonModal>

    <CommonModal v-model="showConnectModal" title="主动连接设备" confirmText="确定" @confirm="submitConnect">
      <div class="form-group">
        <label class="form-label">连接方式</label>
        <select class="form-select" v-model="connectForm.connectionMethod">
          <option value="TCP">TCP</option>
          <option value="MQTT" disabled>MQTT (暂不支持)</option>
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">IP</label>
          <input type="text" class="form-input" v-model="connectForm.ip" />
        </div>
        <div class="form-group">
          <label class="form-label">端口</label>
          <input type="number" class="form-input" v-model.number="connectForm.port" />
        </div>
      </div>
      <div v-if="connectForm.connectionMethod === 'TCP'">
        <div class="form-group">
          <label class="form-label">粘拆包配置</label>
          <select class="form-select" v-model="connectForm.bufferProcessMode">
            <option value="DELIMITED">行分隔符模式</option>
            <option value="FIXED_LENGTH">定长头模式(4字节)</option>
            <option value="CUSTOM">自定义模式</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">解码协议</label>
            <select class="form-select" v-model="connectForm.how2decode">
              <option value="" disabled>选择协议</option>
              <option v-for="opt in how2decodeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">解码实体</label>
            <select class="form-select" v-model="connectForm.decode2what">
              <option value="" disabled>选择实体</option>
              <option v-for="opt in decode2whatOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
      </div>
    </CommonModal>

    <CommonModal v-model="showChangeInfoModal" title="修改设备信息" confirmText="确定" @confirm="submitChangeInfo">
      <div class="form-group">
        <label class="form-label">设备 ID</label>
        <input type="text" class="form-input" v-model="changeInfoForm.deviceId" />
      </div>
      <div class="form-group">
        <label class="form-label">设备种类</label>
        <input type="text" class="form-input" v-model="changeInfoForm.deviceCat" />
      </div>
      <div class="form-group">
        <label class="form-label">状态</label>
        <select class="form-select" v-model="changeInfoForm.deviceStates">
          <option value="ONLINE">ONLINE</option>
          <option value="OFFLINE">OFFLINE</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">IP 和端口</label>
        <input type="text" class="form-input" v-model="changeInfoForm.ipAndPort" />
      </div>
    </CommonModal>

    <CommonModal v-model="showSimulatorModal" :title="`模拟行为: ${simulatingDevice?.name}`" width="40rem" :showDefaultFooter="false">
      <div class="simulator-box">
        <div v-if="!simulatorStatus[simulatingDevice?.id]" class="setup-panel">
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">类型</label>
              <select class="form-select" v-model="simulatorForm.type">
                <option v-for="type in simulatorTypeOptions" :key="type" :value="type">{{ type }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">IP</label>
              <input type="text" class="form-input" v-model="simulatorForm.ip" />
            </div>
            <div class="form-group">
              <label class="form-label">端口</label>
              <input type="number" class="form-input" v-model.number="simulatorForm.port" />
            </div>
          </div>
          <button @click="executeSimulateAction('CONNECT')" class="btn btn-primary w-full mt-4">连接服务器</button>
        </div>
        <div v-else class="active-panel">
          <div class="tag tag-success w-full text-center p-2 mb-4">
             ✅ 已连接到 {{ simulatorForm.type }} ({{ simulatorForm.ip }}:{{ simulatorForm.port }})
          </div>
          <div v-if="simulatorForm.type === 'MQTT'">
            <div class="form-group">
              <label class="form-label">Payload</label>
              <textarea class="form-textarea" v-model="simulatorForm.payload" rows="3"></textarea>
            </div>
          </div>
          <div v-else-if="simulatorForm.type === 'TCP-only'">
            <div class="form-group">
              <label class="form-label">报文格式</label>
              <div class="flex-actions">
                <label class="flex-actions items-center cursor-pointer">
                  <input type="radio" value="plaintext" v-model="tcpDataFormat" /> <span>明文</span>
                </label>
                <label class="flex-actions items-center cursor-pointer">
                  <input type="radio" value="hex" v-model="tcpDataFormat" /> <span>HEX</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">数据内容</label>
              <textarea class="form-textarea font-mono" v-model="simulatorForm.data" rows="3"></textarea>
            </div>
          </div>
          <div class="flex-actions mt-4">
            <button @click="executeSimulateAction('SEND')" class="btn btn-primary flex-1">发送报文</button>
            <button @click="executeSimulateAction('DISCONNECT')" class="btn btn-danger">断开连接</button>
          </div>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import config from '../config/config';
import CommonModal from '../components/CommonModal.vue';
import { notificationStore } from '../notification';

const currentTab = ref('registration');
const devices = ref([]);
const deviceTypes = ref([]);
const selectedType = ref('');
const totalPages = ref(0);
const pageParam = ref({
    pageNo: 1,
    pageSize: 10,
    param: null
});

const connectedDevices = ref([]);
const connectedTotalPages = ref(0);
const connectedPageParam = ref({
    pageNo: 1,
    pageSize: 10,
    param: null
});

const showModal = ref(false);
const selectedDevice = ref(null);
const showCreateModal = ref(false);
const newDeviceType = ref('');
const templateDevice = ref(null);
const BASE_URL = config.BASE_URL+'/deviceControl';
const SUCCESS_CODE = 200;
const showSimulatorModal = ref(false);
const simulatingDevice = ref(null);
const simulatorForm = ref({
    deviceId: null, connectedIP: '', connectedPort: null, connectedType: '',
    ip: '', port: null, type: '', payload: '', data: '',
});
const simulatorTypeOptions = ref([]);
const tcpDataFormat = ref('plaintext');
const showConnectModal = ref(false);
const showChangeInfoModal = ref(false);
const how2decodeOptions = ref([]);
const decode2whatOptions = ref([]);
const connectForm = ref({
    connectionMethod: 'TCP', ip: '', port: null, bufferProcessMode: 'DELIMITED',
    script: null, how2decode: '', decode2what: ''
});
const changeInfoForm = ref({
    deviceId: '', deviceCat: '', deviceStates: '', ipAndPort: '', connectionId: ''
});
const simulatorStatus = ref({}); 

const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    try {
        return typeof timeValue === 'string' ? timeValue.replace('T', ' ').split('.')[0] : new Date(timeValue).toLocaleString();
    } catch (e) { return String(timeValue); }
};

watch(tcpDataFormat, (newFormat, oldFormat) => {
    if (simulatorForm.value.data) {
        if (newFormat === 'plaintext' && oldFormat === 'hex') {
            const cleanHex = simulatorForm.value.data.replace(/\s/g, '');
            simulatorForm.value.data = hexToPlaintext(cleanHex);
        } else if (newFormat === 'hex' && oldFormat === 'plaintext') {
            simulatorForm.value.data = plaintextToHex(simulatorForm.value.data);
        }
    }
});

const fetchDeviceTypes = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/getAllDeviceTypes`);
        if (response.data.code === SUCCESS_CODE) deviceTypes.value = response.data.data || [];
    } catch (error) { notificationStore.error('获取设备种类失败'); }
};

const fetchDevices = async () => {
    try {
        const type = selectedType.value;
        const url = type ? `${BASE_URL}/getDevicesPageByType` : `${BASE_URL}/getAllDevicesPage`;

        // Prepare PageParam<DeviceDal>
        const payload = {
          pageNo: pageParam.value.pageNo,
          pageSize: pageParam.value.pageSize,
          param: type ? { type: type } : null
        };

        const response = await axios.request({
            method: 'get',
            url: url,
            data: payload
        });
        if (response.data.code === SUCCESS_CODE) {
            devices.value = response.data.data.list || [];
            totalPages.value = response.data.data.pages || 0;
            devices.value.forEach(d => checkSimulatorStatus(d.id));
        }
    } catch (error) { notificationStore.error('获取设备列表失败'); }
};

const searchDevices = () => {
    pageParam.value.pageNo = 1;
    fetchDevices();
};

const changePage = (page) => {
    pageParam.value.pageNo = page;
    fetchDevices();
};

const fetchConnectedDevices = async () => {
    try {
        const response = await axios.request({
            method: 'get',
            url: `${BASE_URL}/getAllConnectedDeviceStatesPage`,
            data: connectedPageParam.value
        });
        if (response.data.code === SUCCESS_CODE) {
          connectedDevices.value = response.data.data.list || [];
          connectedTotalPages.value = response.data.data.pages || 0;
        }
    } catch (error) { notificationStore.error('获取失败'); }
};

const searchConnectedDevices = () => {
    connectedPageParam.value.pageNo = 1;
    fetchConnectedDevices();
};

const changeConnectedPage = (page) => {
    connectedPageParam.value.pageNo = page;
    fetchConnectedDevices();
};

const showDetails = (device) => {
    selectedDevice.value = device;
    showModal.value = true;
};

const openCreateModal = () => {
    newDeviceType.value = '';
    templateDevice.value = null;
    showCreateModal.value = true;
};

const fetchTemplate = async () => {
    if (!newDeviceType.value) return;
    try {
        const response = await axios.get(`${BASE_URL}/getTemplateDeviceByType?type=${newDeviceType.value}`);
        if (response.data.code === SUCCESS_CODE) templateDevice.value = response.data.data;
    } catch (error) { notificationStore.error('获取模板失败'); }
};

const submitNewDevice = async () => {
    const payload = { type: newDeviceType.value, device: { ...templateDevice.value } };
    delete payload.device.id;
    delete payload.device.createTime;
    try {
        const response = await axios.post(`${BASE_URL}/createNewDeviceByType`, payload);
        if (response.data.code === SUCCESS_CODE) {
            notificationStore.success('设备创建成功');
            showCreateModal.value = false;
            fetchDevices();
        }
    } catch (error) { notificationStore.error('创建设备失败'); }
};

const confirmDelete = (device) => {
    if (confirm(`确认删除设备 ${device.name}？`)) {
        deleteDevice(device);
    }
};

const deleteDevice = async (device) => {
    try {
        const response = await axios.post(`${BASE_URL}/deleteDeviceByTypeAndId/${device.id}`);
        if (response.data.code === SUCCESS_CODE) {
            notificationStore.success('设备删除成功');
            fetchDevices();
        }
    } catch (error) { notificationStore.error('删除失败'); }
};

const checkSimulatorStatus = async (deviceId) => {
    try {
        const response = await axios.get(`${BASE_URL}/checkSimulatorStatus?id=${deviceId}`);
        const data = response.data.data;
        simulatorStatus.value[deviceId] = data.status === true;
        if (data.status) {
            simulatorForm.value.connectedIP = data.ip || '';
            simulatorForm.value.connectedPort = data.port || null;
            simulatorForm.value.connectedType = data.type === 'TCPo' ? 'TCP-only' : (data.type || '');
        }
    } catch (error) { simulatorStatus.value[deviceId] = false; }
};

const simulateBehavior = async (device) => {
    simulatingDevice.value = device;
    simulatorForm.value.deviceId = device.id;
    await checkSimulatorStatus(device.id); 
    await fetchSimulatorTypes(); 
    if (simulatorStatus.value[device.id]) {
        simulatorForm.value.ip = simulatorForm.value.connectedIP;
        simulatorForm.value.port = simulatorForm.value.connectedPort;
        simulatorForm.value.type = simulatorForm.value.connectedType;
    } else {
        simulatorForm.value.ip = ''; simulatorForm.value.port = null; simulatorForm.value.type = '';
    }
    simulatorForm.value.payload = ''; simulatorForm.value.data = '';
    tcpDataFormat.value = 'plaintext'; 
    showSimulatorModal.value = true;
};

const fetchSimulatorTypes = async () => {
    try {
        const response = await axios.get(`${config.BASE_URL}/server/getAllTypes`);
        if (response.data.code === SUCCESS_CODE) {
            simulatorTypeOptions.value = response.data.data.filter(t => t === 'MQTT' || t === 'TCP-only');
        }
    } catch (error) { console.error(error); }
};

const executeSimulateAction = async (choice) => {
    const form = simulatorForm.value;
    const payload = { id: form.deviceId, choice, ip: null, port: null, type: null };
    if (choice === 'CONNECT' || choice === 'DISCONNECT') {
        payload.ip = choice === 'CONNECT' ? form.ip : form.connectedIP;
        payload.port = choice === 'CONNECT' ? form.port : form.connectedPort;
        const t = choice === 'CONNECT' ? form.type : form.connectedType;
        payload.type = t === 'TCP-only' ? 'TCPo' : t;
    }
    if (choice === 'SEND') {
        payload.ip = form.connectedIP; payload.port = form.connectedPort;
        payload.type = form.connectedType === 'TCP-only' ? 'TCPo' : form.connectedType;
        if (form.connectedType === 'MQTT') payload.payload = form.payload;
        else if (form.connectedType === 'TCP-only') {
            payload.data = tcpDataFormat.value === 'hex' ? form.data.replace(/\s+/g, '') : form.data;
            payload.dataFormat = tcpDataFormat.value;
        }
    }
    try {
        const response = await axios.post(`${BASE_URL}/simulateDeviceBehaviour`, payload);
        if (response.data.code === SUCCESS_CODE) {
            if (choice === 'CONNECT') {
                simulatorStatus.value[form.deviceId] = true;
                form.connectedIP = form.ip; form.connectedPort = form.port; form.connectedType = form.type;
                notificationStore.success('连接成功');
            } else if (choice === 'DISCONNECT') {
                simulatorStatus.value[form.deviceId] = false;
                notificationStore.info('已断开连接');
                showSimulatorModal.value = false;
            } else notificationStore.success('发送成功');
        } else notificationStore.error(response.data.message || '操作失败');
    } catch (error) { notificationStore.error('请求失败'); }
};

const openConnectModal = async () => {
    connectForm.value = { connectionMethod: 'TCP', ip: '', port: null, bufferProcessMode: 'DELIMITED', script: null, how2decode: '', decode2what: '' };
    showConnectModal.value = true;
    try {
        const [howRes, whatRes] = await Promise.all([
            axios.get(`${config.BASE_URL}/server/getAllHow2decode`),
            axios.get(`${config.BASE_URL}/server/getAllDecode2what`)
        ]);
        if (howRes.data.code === SUCCESS_CODE) how2decodeOptions.value = howRes.data.data || [];
        if (whatRes.data.code === SUCCESS_CODE) decode2whatOptions.value = whatRes.data.data || [];
    } catch (error) { console.error(error); }
};

const submitConnect = async () => {
    try {
        const response = await axios.post(`${config.BASE_URL}/deviceControl/ConnectDeviceByTCPo`, connectForm.value);
        if (response.data.code === SUCCESS_CODE) {
            notificationStore.success('连接成功');
            showConnectModal.value = false;
            fetchConnectedDevices();
        }
    } catch (error) { notificationStore.error('连接失败'); }
};

const openChangeInfoModal = (device) => {
    changeInfoForm.value = { ...device };
    showChangeInfoModal.value = true;
};

const submitChangeInfo = async () => {
    try {
        const response = await axios.post(`${config.BASE_URL}/deviceControl/ChangeConnectedDeviceInformation`, changeInfoForm.value);
        if (response.data.code === SUCCESS_CODE) {
            notificationStore.success('更新成功');
            showChangeInfoModal.value = false;
            fetchConnectedDevices();
        }
    } catch (error) { notificationStore.error('更新失败'); }
};

onMounted(async () => {
    await fetchDeviceTypes();
    await fetchDevices();
    await fetchConnectedDevices();
});

const hexToPlaintext = (hex) => {
    try {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substring(i, i + 2), 16));
        return new TextDecoder().decode(new Uint8Array(bytes));
    } catch (e) { return hex; }
};

const plaintextToHex = (text) => {
    try {
        return Array.from(new TextEncoder().encode(text)).map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
    } catch (e) { return text; }
};
</script>

<style scoped>
.tab-nav {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.tab-btn {
  padding: 12px 0;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.status-dot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot.online { background-color: var(--success-color); }
.status-dot.offline { background-color: var(--text-secondary); }

.details-pre { background: #f5f5f5; padding: 12px; border-radius: 2px; font-size: 13px; }

.mb-4 { margin-bottom: 16px; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.cursor-pointer { cursor: pointer; }
.p-2 { padding: 8px; }
.pagination { padding: 10px 0; border-top: 1px solid var(--border-color); }
</style>
