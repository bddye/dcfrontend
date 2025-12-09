<template>
  <div class="protocol-management-page">
    <div class="header-panel">
      <button @click="openUploadModal" class="upload-btn">上传协议</button>
    </div>

    <hr />

    <div class="protocol-list">
      <h3>协议列表</h3>
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>版本</th>
            <th>说明</th>
            <th>类型</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="protocol in protocols" :key="protocol.id">
            <td>{{ protocol.protocolName }}</td>
            <td>{{ protocol.protocolVersion }}</td>
            <td>{{ protocol.description }}</td>
            <td>{{ protocol.type }}</td>
            <td>
              <span :class="protocol.enabled ? 'status-enabled' : 'status-disabled'">
                {{ protocol.enabled ? '已启用' : '未启用' }}
              </span>
            </td>
            <td class="action-buttons">
              <button @click="openUpdateModal(protocol)" class="update-btn">更改协议信息</button>
              <button @click="confirmDelete(protocol)" class="delete-btn">删除协议</button>
              <button @click="confirmLoad(protocol)" class="load-btn">重新加载</button>
            </td>
          </tr>
          <tr v-if="protocols.length === 0">
            <td colspan="6" class="no-data">没有找到协议。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showUploadModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>上传新协议</h4>
          <span class="close-btn" @click="closeUploadModal">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitUpload">
            <div class="form-group">
              <label for="protocol-name">协议名称:</label>
              <input type="text" id="protocol-name" v-model="newProtocol.protocolName" required />
            </div>
            <div class="form-group">
              <label for="protocol-version">协议版本:</label>
              <input type="text" id="protocol-version" v-model="newProtocol.protocolVersion" required />
            </div>
            <div class="form-group">
              <label for="protocol-description">说明:</label>
              <textarea id="protocol-description" v-model="newProtocol.description"></textarea>
            </div>
            <div class="form-group">
              <label for="protocol-type">类型:</label>
              <input type="text" id="protocol-type" v-model="newProtocol.type" required />
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="newProtocol.enabled" />
                是否启用
              </label>
            </div>
            
            <div class="form-group">
              <label for="files-upload">上传文件:</label>
              <input type="file" id="files-upload" multiple @change="handleFileChange" />
            </div>

            <div class="jar-files-panel">
              <h5>JAR 包信息:</h5>
              <table>
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>名称</th>
                    <th>版本</th>
                    <th>启用</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(jar, index) in newProtocol.jarFileNames" :key="index">
                    <td>{{ newProtocol.jarFileNames[index] }}</td>
                    <td><input type="text" v-model="newProtocol.jarNames[index]" required /></td>
                    <td><input type="text" v-model="newProtocol.jarVersions[index]" required /></td>
                    <td><input type="checkbox" v-model="newProtocol.jarEnabled[index]" /></td>
                    <td>
                      <button type="button" @click="removeJarRow(index)" class="remove-jar-btn">移除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button type="button" @click="addJarRow" class="add-jar-btn">新增JAR</button>
            </div>

            <button type="submit" class="submit-btn" :disabled="!isUploadFormValid">上传</button>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showUpdateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>更改协议信息</h4>
          <span class="close-btn" @click="closeUpdateModal">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitUpdate">
            <div class="form-group">
              <label>协议名称:</label>
              <input type="text" v-model="selectedProtocol.protocolName" disabled />
            </div>
            <div class="form-group">
              <label>协议版本:</label>
              <input type="text" v-model="selectedProtocol.protocolVersion" disabled />
            </div>
            <div class="form-group">
              <label for="update-description">说明:</label>
              <textarea id="update-description" v-model="selectedProtocol.description"></textarea>
            </div>
            <div class="form-group">
              <label for="update-type">类型:</label>
              <input type="text" id="update-type" v-model="selectedProtocol.type" />
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="selectedProtocol.enabled" />
                是否启用
              </label>
            </div>

            <div class="jar-files-panel">
              <h5>JAR 包信息:</h5>
              <table>
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>名称</th>
                    <th>版本</th>
                    <th>启用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(jarName, index) in selectedProtocol.jarNames" :key="index">
                    <td>{{ selectedProtocol.jarFileNames[index] }}</td>
                    <td><input type="text" v-model="selectedProtocol.jarNames[index]" required /></td>
                    <td><input type="text" v-model="selectedProtocol.jarVersions[index]" required /></td>
                    <td><input type="checkbox" v-model="selectedProtocol.jarEnabled[index]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button type="submit" class="submit-btn" :disabled="!isUpdateFormValid">保存修改</button>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showMessageModal" class="modal-overlay">
      <div class="modal message-modal">
        <div class="modal-header">
          <h4>{{ messageTitle }}</h4>
          <span class="close-btn" @click="closeMessageModal">&times;</span>
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
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import config from '../config/config';

const protocols = ref([]);
const showUploadModal = ref(false);
const showUpdateModal = ref(false);
const newProtocol = ref({});
const selectedProtocol = ref(null);
const filesToUpload = ref([]);

// 新增消息模态窗口状态
const showMessageModal = ref(false);
const messageTitle = ref('');
const messageContent = ref('');

const BASE_URL = config.BASE_URL+'/jar';
const API_USER = 'admin';
const SUCCESS_CODE = 200; // 假设后端业务成功码是 200

// Computed property to validate upload form
const isUploadFormValid = computed(() => {
  return newProtocol.value.protocolName && newProtocol.value.protocolVersion && newProtocol.value.type;
});

// Computed property to validate update form
const isUpdateFormValid = computed(() => {
  return selectedProtocol.value && selectedProtocol.value.protocolName && selectedProtocol.value.protocolVersion && selectedProtocol.value.type;
});

// Helper function to format date
const formatDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  // 匹配后端的 LocalDateTime 格式
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// 通用消息模态窗口函数
const showMessage = (title, content) => {
  messageTitle.value = title;
  messageContent.value = content;
  showMessageModal.value = true;
};

const closeMessageModal = () => {
  showMessageModal.value = false;
  messageTitle.value = '';
  messageContent.value = '';
};


// ------------------------------------ API 调用 ------------------------------------

/**
 * 【更新】获取所有协议
 */
const fetchProtocols = async () => {
  try {
    // 接口为 /getAllProtocols
    const response = await axios.get(`${BASE_URL}/getAllProtocols`);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      protocols.value = response.data.data || [];
    } else {
      console.error('获取协议列表失败:', response.data.message);
      protocols.value = [];
      showMessage('错误', response.data.message || '获取协议列表失败，请检查网络或服务器状态。');
    }
  } catch (error) {
    console.error('获取协议列表请求失败:', error);
    protocols.value = [];
    showMessage('错误', '获取协议列表失败，请检查网络或服务器状态。');
  }
};

/**
 * 【更新】获取协议模板
 */
const fetchExampleProtocol = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getExampleProtocol`);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      const template = response.data.data;
      // 初始化字段
      template.id = null;
      template.jarNames = template.jarNames || [''];
      template.jarVersions = template.jarVersions || [''];
      template.jarFileNames = template.jarFileNames || [''];
      template.jarEnabled = template.jarEnabled || [true];
      newProtocol.value = template;
    } else {
      console.error('获取协议模板失败:', response.data.message);
      showMessage('错误', response.data.message || '获取协议模板失败。');
    }
  } catch (error) {
    console.error('获取协议模板失败:', error);
    showMessage('错误', '获取协议模板失败，请检查网络。');
  }
};

// 打开上传模态窗口
const openUploadModal = async () => {
  await fetchExampleProtocol();
  showUploadModal.value = true;
};

// 关闭上传模态窗口
const closeUploadModal = () => {
  showUploadModal.value = false;
  filesToUpload.value = [];
};

// 处理文件选择
const handleFileChange = (event) => {
  filesToUpload.value = Array.from(event.target.files);
  // 将选择的文件名按顺序添加到 jarFileNames 数组中
  newProtocol.value.jarFileNames = filesToUpload.value.map(file => file.name);
  // 确保其他 jar 相关的数组长度匹配
  newProtocol.value.jarNames = newProtocol.value.jarFileNames.map(() => '');
  newProtocol.value.jarVersions = newProtocol.value.jarFileNames.map(() => '');
  newProtocol.value.jarEnabled = newProtocol.value.jarFileNames.map(() => true);
};

/**
 * 【更新】提交上传协议 (Multipart/form-data 结构化)
 */
const submitUpload = async () => {
  if (!isUploadFormValid.value || filesToUpload.value.length === 0) {
    showMessage('提示', '请填写所有必填字段并上传至少一个文件。');
    return;
  }
  
  // 准备协议详情对象
  const protocolData = {
    ...newProtocol.value,
    creator: API_USER,
    creationTime: formatDateTime(),
    modifier: API_USER,
    modificationTime: formatDateTime(),
  };
  
  const formData = new FormData();
  
  // 关键：将协议详情作为 Blob 对象上传，并指定 Content-Type 为 application/json
  const protocolDetailBlob = new Blob([JSON.stringify(protocolData)], { type: 'application/json' });
  formData.append('protocolDetail', protocolDetailBlob, 'protocolDetail.json'); 
  
  // 添加文件
  filesToUpload.value.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // axios 会自动处理边界，这里可以省略，但为了明确写上
      },
    });

    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', '协议上传成功！');
      closeUploadModal();
      fetchProtocols();
    } else {
      console.error('协议上传失败:', response.data.message);
      showMessage('失败', response.data.message || '协议上传失败：未知错误。');
    }
  } catch (error) {
    console.error('上传协议请求失败:', error);
    const errorMessage = error.response?.data?.message || '上传协议失败，请检查文件和网络。';
    showMessage('上传失败', errorMessage);
  }
};

// 动态表格 - 上传
const addJarRow = () => {
  newProtocol.value.jarFileNames.push('');
  newProtocol.value.jarNames.push('');
  newProtocol.value.jarVersions.push('');
  newProtocol.value.jarEnabled.push(true);
};

const removeJarRow = (index) => {
  newProtocol.value.jarNames.splice(index, 1);
  newProtocol.value.jarVersions.splice(index, 1);
  newProtocol.value.jarFileNames.splice(index, 1);
  newProtocol.value.jarEnabled.splice(index, 1);
};


// 打开修改协议模态窗口
const openUpdateModal = (protocol) => {
  selectedProtocol.value = { ...protocol };
  // 确保数组存在且有默认值
  selectedProtocol.value.jarNames = selectedProtocol.value.jarNames || [];
  selectedProtocol.value.jarVersions = selectedProtocol.value.jarVersions || [];
  selectedProtocol.value.jarFileNames = selectedProtocol.value.jarFileNames || [];
  selectedProtocol.value.jarEnabled = selectedProtocol.value.jarEnabled || [];
  showUpdateModal.value = true;
};

// 关闭修改协议模态窗口
const closeUpdateModal = () => {
  showUpdateModal.value = false;
  selectedProtocol.value = null;
};

/**
 * 【更新】提交修改协议
 */
const submitUpdate = async () => {
  if (!isUpdateFormValid.value) {
    showMessage('提示', '协议信息不完整，请检查必填字段。');
    return;
  }

  // 准备更新数据
  const protocolToUpdate = {
    ...selectedProtocol.value,
    modifier: API_USER,
    modificationTime: formatDateTime(),
  };

  try {
    // 接口为 PUT
    const response = await axios.put(`${BASE_URL}/updateProtocol`, protocolToUpdate, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', '协议信息更新成功！');
      closeUpdateModal();
      fetchProtocols();
    } else {
      console.error('协议信息更新失败:', response.data.message);
      showMessage('失败', response.data.message || '协议信息更新失败：未知错误。');
    }
  } catch (error) {
    console.error('更新协议请求失败:', error);
    const errorMessage = error.response?.data?.message || '更新协议失败，请检查网络或服务器状态。';
    showMessage('更新失败', errorMessage);
  }
};


// 确认并删除协议
const confirmDelete = (protocol) => {
  // 可以增加一个确认对话框，这里直接调用删除
  deleteProtocol(protocol);
};

/**
 * 【更新】删除协议
 */
const deleteProtocol = async (protocol) => {
  try {
    const url = `${BASE_URL}/deleteProtocol/${protocol.protocolName}/${protocol.protocolVersion}`;
    const response = await axios.delete(url);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', '协议已成功删除！');
      fetchProtocols();
    } else {
      console.error('删除协议失败:', response.data.message);
      showMessage('失败', response.data.message || '删除协议失败：未知错误。');
    }
  } catch (error) {
    console.error('删除协议请求失败:', error);
    const errorMessage = error.response?.data?.message || '删除协议失败，请检查网络或服务器状态。';
    showMessage('删除失败', errorMessage);
  }
};

// 确认并重新加载协议
const confirmLoad = (protocol) => {
  // 可以增加一个确认对话框，这里直接调用加载
  loadProtocol(protocol);
};

/**
 * 【更新】重新加载协议
 */
const loadProtocol = async (protocol) => {
  try {
    const url = `${BASE_URL}/loadProtocol/${protocol.protocolName}/${protocol.protocolVersion}`;
    // 接口为 POST
    const response = await axios.post(url);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', '协议已成功重新加载！');
      fetchProtocols();
    } else {
      console.error('重新加载协议失败:', response.data.message);
      showMessage('失败', response.data.message || '重新加载协议失败：未知错误。');
    }
  } catch (error) {
    console.error('重新加载协议请求失败:', error);
    const errorMessage = error.response?.data?.message || '重新加载协议失败，请检查网络或服务器状态。';
    showMessage('重新加载失败', errorMessage);
  }
};

// 页面加载时自动获取所有协议
onMounted(() => {
  fetchProtocols();
});
</script>

<style scoped>
.protocol-management-page {
  font-family: Arial, sans-serif;
  padding: 20px;
}

.header-panel {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.upload-btn {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
}

.upload-btn:hover {
  background-color: #218838;
}

.protocol-list {
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

.status-enabled {
  color: green;
  font-weight: bold;
}

.status-disabled {
  color: red;
  font-weight: bold;
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

.update-btn {
  background-color: #007bff;
}

.update-btn:hover {
  background-color: #0056b3;
}

.delete-btn {
  background-color: #ffc107;
}

.delete-btn:hover {
  background-color: #e0a800;
}

.load-btn {
  background-color: #17a2b8;
}

.load-btn:hover {
  background-color: #138496;
}

.no-data {
  text-align: center;
  color: #888;
}

/* 模态窗口样式 */
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
  width: 800px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

/* 新增的紧凑型弹窗样式，只用于消息提示 */
.message-modal {
  width: 400px; 
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.close-btn {
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input, .form-group textarea, .form-group select {
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
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #218838;
}

.submit-btn:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.jar-files-panel {
  margin-top: 20px;
}

.jar-files-panel table {
  width: 100%;
  margin-bottom: 10px;
}

.jar-files-panel table th, .jar-files-panel table td {
  padding: 8px;
  border: 1px solid #ddd;
}

.jar-files-panel table input {
  width: 100%;
}

.jar-files-panel .add-jar-btn {
  background-color: #6c757d;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.jar-files-panel .add-jar-btn:hover {
  background-color: #5a6268;
}

.jar-files-panel .remove-jar-btn {
  background-color: #dc3545;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.jar-files-panel .remove-jar-btn:hover {
  background-color: #c82333;
}
</style>