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
            <th>创建时间</th>
            <th>更新时间</th>
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
            <td>{{ protocol.creationTime }}</td>
            <td>{{ protocol.modificationTime }}</td>
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
            <td colspan="8" class="no-data">没有找到协议。</td>
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

            <div class="jar-files-panel">
              <h5>JAR 包信息:</h5>
              <table>
                <thead>
                  <tr>
                    <th>文件</th>
                    <th>名称</th>
                    <th>版本</th>
                    <th>启用</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(jar, index) in newProtocol.jarFileNames" :key="index">
                                        <td>
                      <span v-if="newProtocol.jarFileNames[index]">{{ newProtocol.jarFileNames[index] }}</span>
                      <input 
                        type="file" 
                        :ref="el => fileInputs[index] = el" 
                        style="display: none;" 
                        accept=".jar"
                        @change="handleSingleFileChange($event, index)"
                      />
                      <button type="button" @click="triggerFileInput(index)" class="single-upload-btn">
                        {{ newProtocol.jarFileNames[index] ? '更改' : '上传文件' }}
                      </button>
                    </td>
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

    <div v-if="showMessageModal" class="modal-overlay top-level-overlay">
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
import { ref, onMounted, computed, nextTick } from 'vue';
import axios from 'axios';
import config from '../config/config';

const protocols = ref([]);
const showUploadModal = ref(false);
const showUpdateModal = ref(false);
const newProtocol = ref({});
const selectedProtocol = ref(null);
// filesToUpload 现在只用于存储实际选择的文件对象。文件名列表由 newProtocol.jarFileNames 维护。
const filesToUpload = ref([]); 
const fileInputs = ref([]);    

// 新增消息模态窗口状态
const showMessageModal = ref(false);
const messageTitle = ref('');
const messageContent = ref('');

const BASE_URL = config.BASE_URL+'/jar';
const API_USER = 'admin';
const SUCCESS_CODE = 200; 

// 【修改 3】Computed property to validate upload form
const isUploadFormValid = computed(() => {
  // 1. 检查核心信息是否填写
  const coreValid = newProtocol.value.protocolName && 
                    newProtocol.value.protocolVersion && 
                    newProtocol.value.type;

  if (!coreValid) return false;

  // 2. 检查 jar 文件列表是否为空
  const jarList = newProtocol.value.jarFileNames || [];
  if (jarList.length === 0) return true; // 如果列表为空，且核心信息有效，则允许上传

  // 3. 如果列表不为空，确保 filesToUpload 包含了列表中所有的文件名
  const uploadedFileNames = filesToUpload.value.map(f => f.name);
  return jarList.every(fileName => uploadedFileNames.includes(fileName));
});

// Computed property to validate update form
const isUpdateFormValid = computed(() => {
  return selectedProtocol.value && 
         selectedProtocol.value.protocolName && 
         selectedProtocol.value.protocolVersion && 
         selectedProtocol.value.type;
});

// 【移除 4】不再使用 formatDateTime 函数

// 通用消息模态窗口函数
const showMessage = (title, content, callback = null) => {
  messageTitle.value = title;
  messageContent.value = content;
  showMessageModal.value = true;
  if (callback) {
    // 可以在这里添加一个确认/取消的逻辑，但为了简洁，暂时只提供展示
    console.log("确认回调暂未实现完整确认框，请使用原生确认。");
  }
};

const closeMessageModal = () => {
  showMessageModal.value = false;
  messageTitle.value = '';
  messageContent.value = '';
};


// ------------------------------------ API 调用 ------------------------------------

// fetchProtocols, fetchExampleProtocol, openUploadModal, closeUploadModal 保持不变

const fetchProtocols = async () => {
  try {
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

const fetchExampleProtocol = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getExampleProtocol`);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      const template = response.data.data;
      template.id = null;
      // 初始化空数组以启动上传流程
      template.jarNames = [];
      template.jarVersions = [];
      template.jarFileNames = [];
      template.jarEnabled = []; 
      template.enabled = true; 
      newProtocol.value = template;
      filesToUpload.value = []; 
      fileInputs.value = [];    
    } else {
      console.error('获取协议模板失败:', response.data.message);
      showMessage('错误', response.data.message || '获取协议模板失败。');
    }
  } catch (error) {
    console.error('获取协议模板失败:', error);
    showMessage('错误', '获取协议模板失败，请检查网络。');
  }
};

const openUploadModal = async () => {
  await fetchExampleProtocol();
  showUploadModal.value = true;
};

const closeUploadModal = () => {
  showUploadModal.value = false;
  filesToUpload.value = [];
  fileInputs.value = [];
};

/**
 * 批量文件选择处理
 */
const handleFileChange = (event) => {
  const selectedFiles = Array.from(event.target.files).filter(file => file.name.endsWith('.jar'));
  if (selectedFiles.length === 0 && event.target.files.length > 0) {
    showMessage('提示', '只允许上传 .jar 文件！');
    event.target.value = null; 
    return;
  }

  filesToUpload.value = selectedFiles;
  // 更新 JAR 信息列表
  newProtocol.value.jarFileNames = selectedFiles.map(file => file.name);
  newProtocol.value.jarNames = newProtocol.value.jarFileNames.map(() => '');
  newProtocol.value.jarVersions = newProtocol.value.jarFileNames.map(() => '');
  newProtocol.value.jarEnabled = newProtocol.value.jarFileNames.map(() => true); 
  nextTick(() => {
    fileInputs.value = newProtocol.value.jarFileNames.map(() => null); 
  });
};

/**
 * 单个文件上传处理
 */
const handleSingleFileChange = (event, index) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.jar')) {
    showMessage('提示', '只允许上传 .jar 文件！');
    event.target.value = null;
    return;
  }

  // 1. 移除旧文件 (如果有)
  const oldFileName = newProtocol.value.jarFileNames[index];
  filesToUpload.value = filesToUpload.value.filter(f => f.name !== oldFileName);

  // 2. 添加新文件
  filesToUpload.value.push(file);

  // 3. 更新文件名数组
  newProtocol.value.jarFileNames[index] = file.name;
  
  // 必须清空 input file 的值
  event.target.value = null;
};

const triggerFileInput = (index) => {
  if (fileInputs.value[index]) {
    fileInputs.value[index].click();
  }
};

/**
 * 提交上传协议
 */
const submitUpload = async () => {
  if (!isUploadFormValid.value) {
    showMessage('提示', '请填写所有必填字段，并确保所有表格中的文件都已上传。');
    return;
  }
  
  // 准备协议详情对象
  const protocolData = {
    ...newProtocol.value,
    // 【移除 4】移除 creator, creationTime, modifier, modificationTime
  };
  
  const formData = new FormData();
  
  // 关键：将协议详情作为 Blob 对象上传
  const protocolDetailBlob = new Blob([JSON.stringify(protocolData)], { type: 'application/json' });
  formData.append('protocolDetail', protocolDetailBlob, 'protocolDetail.json'); 
  
  // 添加实际需要上传的文件
  const jarFileNamesSet = new Set(newProtocol.value.jarFileNames);
  filesToUpload.value.forEach(file => {
    // 只有文件名存在于当前协议配置中的文件才上传
    if (jarFileNamesSet.has(file.name)) {
      formData.append('files', file);
    }
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
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
  // 默认启用
  newProtocol.value.jarFileNames.push('');
  newProtocol.value.jarNames.push('');
  newProtocol.value.jarVersions.push('');
  newProtocol.value.jarEnabled.push(true);
  nextTick(() => {
    fileInputs.value.push(null); 
  });
};

// 【修改 3】动态表格 - 移除
const removeJarRow = (index) => {
  // 移除文件对象（如果存在）
  const fileName = newProtocol.value.jarFileNames[index];
  if (fileName) {
    // 从 filesToUpload 中移除对应文件
    filesToUpload.value = filesToUpload.value.filter(f => f.name !== fileName);
  }

  newProtocol.value.jarNames.splice(index, 1);
  newProtocol.value.jarVersions.splice(index, 1);
  newProtocol.value.jarFileNames.splice(index, 1);
  newProtocol.value.jarEnabled.splice(index, 1);
  fileInputs.value.splice(index, 1);
};


// openUpdateModal, closeUpdateModal 保持不变

const openUpdateModal = (protocol) => {
  selectedProtocol.value = { ...protocol };
  selectedProtocol.value.jarNames = selectedProtocol.value.jarNames || [];
  selectedProtocol.value.jarVersions = selectedProtocol.value.jarVersions || [];
  selectedProtocol.value.jarFileNames = selectedProtocol.value.jarFileNames || [];
  selectedProtocol.value.jarEnabled = selectedProtocol.value.jarEnabled || [];
  showUpdateModal.value = true;
};

const closeUpdateModal = () => {
  showUpdateModal.value = false;
  selectedProtocol.value = null;
};

/**
 * 提交修改协议
 */
const submitUpdate = async () => {
  if (!isUpdateFormValid.value) {
    showMessage('提示', '协议信息不完整，请检查必填字段。');
    return;
  }

  const protocolToUpdate = {
    ...selectedProtocol.value,
    // 【移除 4】移除 modifier 和 modificationTime
  };

  try {
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
  if (confirm(`您确定要删除协议 "${protocol.protocolName}" 版本 "${protocol.protocolVersion}" 吗？`)) {
    deleteProtocol(protocol);
  }
};

/**
 * 【修改 1】删除协议 - 确保 URL 和请求方法正确
 */
const deleteProtocol = async (protocol) => {
  try {
    // 确保 URL 编码
    const protocolName = encodeURIComponent(protocol.protocolName);
    const protocolVersion = encodeURIComponent(protocol.protocolVersion);
    const url = `${BASE_URL}/deleteProtocol/${protocolName}/${protocolVersion}`;
    
    const response = await axios.delete(url);
    
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      showMessage('成功', '协议已成功删除！');
      fetchProtocols();
    } else {
      console.error('删除协议失败:', response.data.message);
      showMessage('失败', response.data.message || '删除协议失败：未知错误。');
    }
  } catch (error) {
    console.log('删除协议请求对象:', error);
    const errorMessage = error.response?.data?.message || '删除协议失败，请检查网络或服务器状态。';
    showMessage('删除失败', errorMessage);
  }
};

// 确认并重新加载协议
const confirmLoad = (protocol) => {
  if (confirm(`您确定要重新加载协议 "${protocol.protocolName}" 版本 "${protocol.protocolVersion}" 吗？`)) {
    loadProtocol(protocol);
  }
};

/**
 * 重新加载协议
 */
const loadProtocol = async (protocol) => {
  try {
    // 确保 URL 编码
    const protocolName = encodeURIComponent(protocol.protocolName);
    const protocolVersion = encodeURIComponent(protocol.protocolVersion);
    const url = `${BASE_URL}/loadProtocol/${protocolName}/${protocolVersion}`;
    
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

/* 确保消息弹窗在最上层 */
.modal-overlay.top-level-overlay {
  z-index: 1010; 
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

.form-group input[type="file"] {
  padding: 5px; 
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

.jar-files-panel table input[type="text"] {
  width: 100%;
  padding: 5px;
}

.jar-files-panel .add-jar-btn {
  background-color: #007bff;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.jar-files-panel .add-jar-btn:hover {
  background-color: #0056b3;
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

.single-upload-btn {
  background-color: #6c757d;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.single-upload-btn:hover {
  background-color: #5a6268;
}
</style>