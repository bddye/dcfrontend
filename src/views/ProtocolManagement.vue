<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">业务协议管理</h2>
      <button @click="openUploadModal" class="btn btn-primary">上传协议</button>
    </div>

    <div class="card">
      <div class="table-container">
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
              <td class="font-medium">{{ protocol.protocolName }}</td>
              <td>{{ protocol.protocolVersion }}</td>
              <td>{{ protocol.description }}</td>
              <td>{{ protocol.type }}</td>
              <td>{{ protocol.creationTime }}</td>
              <td>{{ protocol.modificationTime }}</td>
              <td>
                <span :class="['tag', protocol.enabled ? 'tag-success' : 'tag-danger']">
                  {{ protocol.enabled ? '已启用' : '未启用' }}
                </span>
              </td>
              <td>
                <div class="flex-actions">
                  <button @click="openUpdateModal(protocol)" class="btn btn-secondary btn-sm" title="更改信息">
                    编辑
                  </button>
                  <button @click="confirmDelete(protocol)" class="btn btn-danger btn-sm" title="删除协议">
                    删除
                  </button>
                  <button @click="confirmLoad(protocol)" class="btn btn-primary btn-sm" title="重新加载">
                    重载
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="protocols.length === 0">
              <td colspan="8" class="no-data">没有找到协议。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Upload Modal -->
    <CommonModal
      v-model="showUploadModal"
      title="上传新协议"
      width="50rem"
      confirmText="上传"
      :confirmDisabled="!isUploadFormValid"
      @confirm="submitUpload"
    >
      <form @submit.prevent>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">协议名称</label>
            <input type="text" class="form-input" v-model="newProtocol.protocolName" required />
          </div>
          <div class="form-group">
            <label class="form-label">协议版本</label>
            <input type="text" class="form-input" v-model="newProtocol.protocolVersion" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">说明</label>
          <textarea class="form-textarea" v-model="newProtocol.description" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">类型</label>
          <input type="text" class="form-input" v-model="newProtocol.type" required />
        </div>
        <div class="form-group">
          <label class="flex-label">
            <input type="checkbox" v-model="newProtocol.enabled" />
            <span>是否启用</span>
          </label>
        </div>

        <div class="jar-section">
          <h4 class="section-title">JAR 包信息</h4>
          <div class="table-container compact">
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
                    <div class="file-upload-cell">
                      <span class="file-name" v-if="newProtocol.jarFileNames[index]">{{ newProtocol.jarFileNames[index] }}</span>
                      <input 
                        type="file" 
                        :ref="el => fileInputs[index] = el" 
                        style="display: none;" 
                        accept=".jar"
                        @change="handleSingleFileChange($event, index)"
                      />
                      <button type="button" @click="triggerFileInput(index)" class="btn btn-secondary btn-sm">
                        {{ newProtocol.jarFileNames[index] ? '更改' : '选择文件' }}
                      </button>
                    </div>
                  </td>
                  <td><input type="text" class="form-input input-sm" v-model="newProtocol.jarNames[index]" required /></td>
                  <td><input type="text" class="form-input input-sm" v-model="newProtocol.jarVersions[index]" required /></td>
                  <td class="text-center"><input type="checkbox" v-model="newProtocol.jarEnabled[index]" /></td>
                  <td>
                    <button type="button" @click="removeJarRow(index)" class="btn btn-danger btn-sm">移除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" @click="addJarRow" class="btn btn-secondary btn-sm mt-2">新增 JAR</button>
        </div>
      </form>
    </CommonModal>

    <!-- Update Modal -->
    <CommonModal
      v-model="showUpdateModal"
      title="更改协议信息"
      confirmText="保存修改"
      :confirmDisabled="!isUpdateFormValid"
      @confirm="submitUpdate"
    >
      <form @submit.prevent v-if="selectedProtocol">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">协议名称</label>
            <input type="text" class="form-input bg-gray-50" v-model="selectedProtocol.protocolName" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">协议版本</label>
            <input type="text" class="form-input bg-gray-50" v-model="selectedProtocol.protocolVersion" disabled />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">说明</label>
          <textarea class="form-textarea" v-model="selectedProtocol.description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">类型</label>
          <input type="text" class="form-input" v-model="selectedProtocol.type" />
        </div>
        <div class="form-group">
          <label class="flex-label">
            <input type="checkbox" v-model="selectedProtocol.enabled" />
            <span>是否启用</span>
          </label>
        </div>

        <div class="jar-section">
          <h4 class="section-title">JAR 包信息</h4>
          <div class="table-container compact">
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
                  <td class="text-sm">{{ selectedProtocol.jarFileNames[index] }}</td>
                  <td><input type="text" class="form-input input-sm" v-model="selectedProtocol.jarNames[index]" required /></td>
                  <td><input type="text" class="form-input input-sm" v-model="selectedProtocol.jarVersions[index]" required /></td>
                  <td class="text-center"><input type="checkbox" v-model="selectedProtocol.jarEnabled[index]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </CommonModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import axios from 'axios';
import config from '../config/config';
import CommonModal from '../components/CommonModal.vue';
import { notificationStore } from '../notification';

const protocols = ref([]);
const showUploadModal = ref(false);
const showUpdateModal = ref(false);
const newProtocol = ref({});
const selectedProtocol = ref(null);
const filesToUpload = ref([]); 
const fileInputs = ref([]);    

const BASE_URL = config.BASE_URL+'/jar';
const SUCCESS_CODE = 200; 

const isUploadFormValid = computed(() => {
  const coreValid = newProtocol.value.protocolName && 
                    newProtocol.value.protocolVersion && 
                    newProtocol.value.type;

  if (!coreValid) return false;
  const jarList = newProtocol.value.jarFileNames || [];
  if (jarList.length === 0) return true;
  const uploadedFileNames = filesToUpload.value.map(f => f.name);
  return jarList.every(fileName => !fileName || uploadedFileNames.includes(fileName));
});

const isUpdateFormValid = computed(() => {
  return selectedProtocol.value && 
         selectedProtocol.value.protocolName && 
         selectedProtocol.value.protocolVersion && 
         selectedProtocol.value.type;
});

const fetchProtocols = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getAllProtocols`);
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      protocols.value = response.data.data || [];
    } else {
      notificationStore.error(response.data.message || '获取协议列表失败');
    }
  } catch (error) {
    notificationStore.error('获取协议列表失败，请检查网络');
  }
};

const fetchExampleProtocol = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/getExampleProtocol`);
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      const template = response.data.data;
      template.id = null;
      template.jarNames = [];
      template.jarVersions = [];
      template.jarFileNames = [];
      template.jarEnabled = []; 
      template.enabled = true; 
      newProtocol.value = template;
      filesToUpload.value = []; 
      fileInputs.value = [];    
    }
  } catch (error) {
    notificationStore.error('获取协议模板失败');
  }
};

const openUploadModal = async () => {
  await fetchExampleProtocol();
  showUploadModal.value = true;
};

const closeUploadModal = () => {
  showUploadModal.value = false;
};

const handleSingleFileChange = (event, index) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.jar')) {
    notificationStore.warning('只允许上传 .jar 文件！');
    event.target.value = null;
    return;
  }

  const oldFileName = newProtocol.value.jarFileNames[index];
  filesToUpload.value = filesToUpload.value.filter(f => f.name !== oldFileName);
  filesToUpload.value.push(file);
  newProtocol.value.jarFileNames[index] = file.name;
  event.target.value = null;
};

const triggerFileInput = (index) => {
  if (fileInputs.value[index]) {
    fileInputs.value[index].click();
  }
};

const submitUpload = async () => {
  const protocolData = { ...newProtocol.value };
  const formData = new FormData();
  const protocolDetailBlob = new Blob([JSON.stringify(protocolData)], { type: 'application/json' });
  formData.append('protocolDetail', protocolDetailBlob, 'protocolDetail.json'); 
  
  const jarFileNamesSet = new Set(newProtocol.value.jarFileNames);
  filesToUpload.value.forEach(file => {
    if (jarFileNamesSet.has(file.name)) {
      formData.append('files', file);
    }
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/upload`, formData);
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      notificationStore.success('协议上传成功！');
      showUploadModal.value = false;
      fetchProtocols();
    } else {
      notificationStore.error(response.data.message || '协议上传失败');
    }
  } catch (error) {
    notificationStore.error('上传协议失败，请检查文件和网络');
  }
};

const addJarRow = () => {
  newProtocol.value.jarFileNames.push('');
  newProtocol.value.jarNames.push('');
  newProtocol.value.jarVersions.push('');
  newProtocol.value.jarEnabled.push(true);
  nextTick(() => {
    fileInputs.value.push(null); 
  });
};

const removeJarRow = (index) => {
  const fileName = newProtocol.value.jarFileNames[index];
  if (fileName) {
    filesToUpload.value = filesToUpload.value.filter(f => f.name !== fileName);
  }
  newProtocol.value.jarNames.splice(index, 1);
  newProtocol.value.jarVersions.splice(index, 1);
  newProtocol.value.jarFileNames.splice(index, 1);
  newProtocol.value.jarEnabled.splice(index, 1);
  fileInputs.value.splice(index, 1);
};

const openUpdateModal = (protocol) => {
  selectedProtocol.value = JSON.parse(JSON.stringify(protocol));
  showUpdateModal.value = true;
};

const submitUpdate = async () => {
  try {
    const response = await axios.put(`${BASE_URL}/updateProtocol`, selectedProtocol.value);
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      notificationStore.success('协议信息更新成功！');
      showUpdateModal.value = false;
      fetchProtocols();
    } else {
      notificationStore.error(response.data.message || '更新失败');
    }
  } catch (error) {
    notificationStore.error('更新协议失败');
  }
};

const confirmDelete = (protocol) => {
  if (confirm(`您确定要删除协议 "${protocol.protocolName}" 吗？`)) {
    deleteProtocol(protocol);
  }
};

const deleteProtocol = async (protocol) => {
  try {
    const response = await axios.delete(`${BASE_URL}/deleteProtocol/${encodeURIComponent(protocol.protocolName)}/${encodeURIComponent(protocol.protocolVersion)}`);
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      notificationStore.success('协议已成功删除！');
      fetchProtocols();
    } else {
      notificationStore.error(response.data.message || '删除失败');
    }
  } catch (error) {
    notificationStore.error('删除协议失败');
  }
};

const confirmLoad = (protocol) => {
  if (confirm(`您确定要重新加载协议 "${protocol.protocolName}" 吗？`)) {
    loadProtocol(protocol);
  }
};

const loadProtocol = async (protocol) => {
  try {
    const response = await axios.post(`${BASE_URL}/loadProtocol/${encodeURIComponent(protocol.protocolName)}/${encodeURIComponent(protocol.protocolVersion)}`);
    if (response.status === 200 && response.data.code === SUCCESS_CODE) {
      notificationStore.success('协议已成功重新加载！');
      fetchProtocols();
    } else {
      notificationStore.error(response.data.message || '重载失败');
    }
  } catch (error) {
    notificationStore.error('重新加载协议失败');
  }
};

onMounted(fetchProtocols);
</script>

<style scoped>
.flex-actions {
  display: flex;
  gap: 0.5rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.flex-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.jar-section {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.compact td, .compact th {
  padding: 0.5rem;
}

.input-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.file-upload-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-center {
  text-align: center;
}

.mt-2 {
  margin-top: 0.5rem;
}

.bg-gray-50 {
  background-color: #f8fafc;
}
</style>
