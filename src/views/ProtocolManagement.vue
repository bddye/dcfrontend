<template>
  <div class="page-container">
    <div class="card">
      <div class="search-panel">
        <button @click="openUploadModal" class="btn btn-success ml-auto">+ 上传协议</button>
      </div>
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
              <td class="text-secondary">{{ protocol.modificationTime }}</td>
              <td>
                <span :class="['tag', protocol.enabled ? 'tag-success' : 'tag-danger']">
                  {{ protocol.enabled ? '已启用' : '未启用' }}
                </span>
              </td>
              <td>
                <a @click="openUpdateModal(protocol)" class="action-link">修改</a>
                <a @click="confirmDelete(protocol)" class="action-link danger">删除</a>
                <a @click="confirmLoad(protocol)" class="action-link">重载</a>
              </td>
            </tr>
            <tr v-if="protocols.length === 0">
              <td colspan="7" class="no-data">暂无数据</td>
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

    <!-- Upload Modal -->
    <CommonModal v-model="showUploadModal" title="上传新协议" width="60rem" confirmText="提交" :confirmDisabled="!isUploadFormValid" @confirm="submitUpload">
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
       <div class="grid-2">
         <div class="form-group">
           <label class="form-label">类型</label>
           <input type="text" class="form-input" v-model="newProtocol.type" required />
         </div>
         <div class="form-group flex items-end">
           <label class="flex-actions items-center cursor-pointer mb-2">
             <input type="checkbox" v-model="newProtocol.enabled" />
             <span class="ml-2">立即启用</span>
           </label>
         </div>
       </div>

       <div class="mt-4 pt-4 border-t border-gray-200">
         <div class="flex items-center justify-between mb-2">
           <h4 class="font-bold">JAR 包信息</h4>
           <button type="button" @click="addJarRow" class="btn btn-secondary btn-sm">+ 新增 JAR</button>
         </div>
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
                   <div class="flex items-center gap-2">
                     <span class="text-xs truncate max-w-[120px]" v-if="newProtocol.jarFileNames[index]">{{ newProtocol.jarFileNames[index] }}</span>
                     <input
                       type="file"
                       :ref="el => fileInputs[index] = el"
                       style="display: none;"
                       accept=".jar"
                       @change="handleSingleFileChange($event, index)"
                     />
                     <button type="button" @click="triggerFileInput(index)" class="btn btn-secondary btn-sm">
                       {{ newProtocol.jarFileNames[index] ? '更改' : '选择' }}
                     </button>
                   </div>
                 </td>
                 <td><input type="text" class="form-input input-sm" v-model="newProtocol.jarNames[index]" required /></td>
                 <td><input type="text" class="form-input input-sm" v-model="newProtocol.jarVersions[index]" required /></td>
                 <td class="text-center"><input type="checkbox" v-model="newProtocol.jarEnabled[index]" /></td>
                 <td><button type="button" @click="removeJarRow(index)" class="btn btn-danger btn-sm">移除</button></td>
               </tr>
             </tbody>
           </table>
         </div>
       </div>
    </CommonModal>

    <!-- Update Modal -->
    <CommonModal v-model="showUpdateModal" title="修改协议信息" confirmText="提交" :confirmDisabled="!isUpdateFormValid" @confirm="submitUpdate">
       <div v-if="selectedProtocol">
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
           <textarea class="form-textarea" v-model="selectedProtocol.description" rows="2"></textarea>
         </div>
         <div class="grid-2">
            <div class="form-group">
              <label class="form-label">类型</label>
              <input type="text" class="form-input" v-model="selectedProtocol.type" />
            </div>
            <div class="form-group flex items-end">
              <label class="flex-actions items-center cursor-pointer mb-2">
                <input type="checkbox" v-model="selectedProtocol.enabled" />
                <span class="ml-2">启用状态</span>
              </label>
            </div>
         </div>

         <div class="mt-4 pt-4 border-t border-gray-200">
           <h4 class="font-bold mb-2">JAR 包信息</h4>
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
                   <td class="text-xs">{{ selectedProtocol.jarFileNames[index] }}</td>
                   <td><input type="text" class="form-input input-sm" v-model="selectedProtocol.jarNames[index]" required /></td>
                   <td><input type="text" class="form-input input-sm" v-model="selectedProtocol.jarVersions[index]" required /></td>
                   <td class="text-center"><input type="checkbox" v-model="selectedProtocol.jarEnabled[index]" /></td>
                 </tr>
               </tbody>
             </table>
           </div>
         </div>
       </div>
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
const totalPages = ref(0);
const pageParam = ref({
    pageNo: 1,
    pageSize: 10,
    param: ''
});

const BASE_URL = config.BASE_URL+'/jar';
const SUCCESS_CODE = 200;

const isUploadFormValid = computed(() => {
  const core = newProtocol.value.protocolName && newProtocol.value.protocolVersion && newProtocol.value.type;
  if (!core) return false;
  const jarList = newProtocol.value.jarFileNames || [];
  const uploaded = filesToUpload.value.map(f => f.name);
  return jarList.every(name => !name || uploaded.includes(name));
});

const isUpdateFormValid = computed(() => {
  return selectedProtocol.value && selectedProtocol.value.protocolName && selectedProtocol.value.type;
});

const fetchProtocols = async () => {
  try {
    const response = await axios.request({
      method: 'get',
      url: `${BASE_URL}/getAllProtocolsPage`,
      data: pageParam.value
    });
    if (response.data.code === SUCCESS_CODE) {
      protocols.value = response.data.data.list || [];
      totalPages.value = response.data.data.pages || 0;
    }
  } catch (e) { notificationStore.error('获取列表失败'); }
};

const changePage = (page) => {
    pageParam.value.pageNo = page;
    fetchProtocols();
};

const openUploadModal = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/getExampleProtocol`);
    if (res.data.code === SUCCESS_CODE) {
      const template = res.data.data;
      template.id = null;
      template.jarNames = [];
      template.jarVersions = [];
      template.jarFileNames = [];
      template.jarEnabled = [];
      template.enabled = true;
      newProtocol.value = template;
      filesToUpload.value = [];
      fileInputs.value = [];
      showUploadModal.value = true;
    }
  } catch (e) { notificationStore.error('获取模板失败'); }
};

const handleSingleFileChange = (event, index) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.name.endsWith('.jar')) {
    notificationStore.warning('只允许 .jar 文件');
    event.target.value = null;
    return;
  }
  const old = newProtocol.value.jarFileNames[index];
  filesToUpload.value = filesToUpload.value.filter(f => f.name !== old);
  filesToUpload.value.push(file);
  newProtocol.value.jarFileNames[index] = file.name;
  event.target.value = null;
};

const triggerFileInput = (index) => { if (fileInputs.value[index]) fileInputs.value[index].click(); };

const addJarRow = () => {
  newProtocol.value.jarFileNames.push('');
  newProtocol.value.jarNames.push('');
  newProtocol.value.jarVersions.push('');
  newProtocol.value.jarEnabled.push(true);
  nextTick(() => fileInputs.value.push(null));
};

const removeJarRow = (index) => {
  const name = newProtocol.value.jarFileNames[index];
  if (name) filesToUpload.value = filesToUpload.value.filter(f => f.name !== name);
  newProtocol.value.jarFileNames.splice(index, 1);
  newProtocol.value.jarNames.splice(index, 1);
  newProtocol.value.jarVersions.splice(index, 1);
  newProtocol.value.jarEnabled.splice(index, 1);
  fileInputs.value.splice(index, 1);
};

const submitUpload = async () => {
  const formData = new FormData();
  const detailBlob = new Blob([JSON.stringify(newProtocol.value)], { type: 'application/json' });
  formData.append('protocolDetail', detailBlob, 'protocolDetail.json');

  const jarNamesSet = new Set(newProtocol.value.jarFileNames);
  filesToUpload.value.forEach(f => {
    if (jarNamesSet.has(f.name)) formData.append('files', f);
  });

  try {
    const res = await axios.post(`${BASE_URL}/upload`, formData);
    if (res.data.code === SUCCESS_CODE) {
      notificationStore.success('上传成功');
      showUploadModal.value = false;
      fetchProtocols();
    } else { notificationStore.error(res.data.message || '上传失败'); }
  } catch (e) { notificationStore.error('上传失败'); }
};

const openUpdateModal = (p) => { selectedProtocol.value = JSON.parse(JSON.stringify(p)); showUpdateModal.value = true; };

const submitUpdate = async () => {
  try {
    const res = await axios.put(`${BASE_URL}/updateProtocol`, selectedProtocol.value);
    if (res.data.code === SUCCESS_CODE) {
      notificationStore.success('更新成功');
      showUpdateModal.value = false;
      fetchProtocols();
    } else { notificationStore.error(res.data.message || '更新失败'); }
  } catch (e) { notificationStore.error('更新失败'); }
};

const confirmDelete = (p) => { if (confirm(`确认删除协议 ${p.protocolName}？`)) deleteProtocol(p); };

const deleteProtocol = async (p) => {
  try {
    const res = await axios.delete(`${BASE_URL}/deleteProtocol/${encodeURIComponent(p.protocolName)}/${encodeURIComponent(p.protocolVersion)}`);
    if (res.data.code === SUCCESS_CODE) { notificationStore.success('删除成功'); fetchProtocols(); }
  } catch (e) { notificationStore.error('删除失败'); }
};

const confirmLoad = (p) => { if (confirm(`确认重载协议 ${p.protocolName}？`)) loadProtocol(p); };

const loadProtocol = async (p) => {
  try {
    const res = await axios.post(`${BASE_URL}/loadProtocol/${encodeURIComponent(p.protocolName)}/${encodeURIComponent(p.protocolVersion)}`);
    if (res.data.code === SUCCESS_CODE) notificationStore.success('重载成功');
  } catch (e) { notificationStore.error('重载失败'); }
};

onMounted(fetchProtocols);
</script>

<style scoped>
.ml-2 { margin-left: 8px; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.items-end { align-items: flex-end; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
.mb-2 { margin-bottom: 8px; }
.border-gray-200 { border-color: #e5e7eb; }
.max-w-\[120px\] { max-w: 120px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bg-gray-50 { background-color: #f9fafb; }
.compact td, .compact th { padding: 8px; }
.pagination { padding: 10px 0; border-top: 1px solid var(--border-color); }
</style>
