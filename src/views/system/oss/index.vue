<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
         <el-form-item label="文件名称" prop="name">
            <el-input
               v-model="queryParams.name"
               placeholder="请输入文件名称"
               clearable
               style="width: 240px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
         </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button
               type="primary"
               plain
               icon="Upload"
               @click="handleUpload"
               v-hasPermi="['system:sysoss:submit']" round
            >上传文件</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['system:sysoss:delete']" round
            >删除</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['system:sysoss:list']" round
            >导出</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="ossList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="ID" align="center" prop="id" width="80" />
         <el-table-column label="文件类型" align="center" prop="ossType" width="100" />
         <el-table-column label="文件名称" align="center" prop="name" :show-overflow-tooltip="true" />
         <el-table-column label="OSSID" align="center" prop="ossId" min-width="100" />
         <!-- <el-table-column label="文件URL" align="center" prop="url" :show-overflow-tooltip="true" /> -->
         <el-table-column label="文件大小" align="center" prop="fileSize" width="120">
            <template #default="scope">
               <span>{{ formatFileSize(scope.row.fileSize) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="上传时间" align="center" prop="createAt" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createAt) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
         <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="View" @click="handlePreview(scope.row)" round>预览</el-button>
               <el-button link type="primary" icon="Edit" @click="handleEditRemark(scope.row)" round>编辑</el-button>
               <el-button link type="primary" icon="Download" @click="handleDownload(scope.row)" round>下载</el-button>
               <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" round>删除</el-button>
            </template>
         </el-table-column>
      </el-table>

      <pagination
         v-show="total > 0"
         :total="total"
         v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize"
         @pagination="getList"
      />

      <!-- 上传文件对话框 -->
      <el-dialog :title="upload.title" v-model="upload.open" width="600px" append-to-body>
         <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="upload.headers"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="handleBeforeUpload"
            :file-list="upload.fileList"
            :limit="upload.limit"
            :on-exceed="handleExceed"
            drag
            multiple
         >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
               <div class="el-upload__tip">
                  支持各种常见文件格式，单个文件不超过50MB
               </div>
            </template>
         </el-upload>
      </el-dialog>

      <!-- 文件预览对话框 -->
      <el-dialog title="文件预览" v-model="preview.open" width="800px" append-to-body>
         <div class="preview-container">
            <div class="preview-info">
               <el-descriptions :column="2" border>
                  <el-descriptions-item label="文件名称">{{ preview.row.name }}</el-descriptions-item>
                  <el-descriptions-item label="文件大小">{{ formatFileSize(preview.row.fileSize) }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间" :span="2">{{ parseTime(preview.row.createAt) }}</el-descriptions-item>
                  <el-descriptions-item label="文件URL" :span="2">
                     <el-input v-model="preview.row.url" readonly>
                        <template #append>
                           <el-button @click="copyUrl">复制</el-button>
                        </template>
                     </el-input>
                  </el-descriptions-item>
                  <el-descriptions-item label="备注" :span="2">{{ preview.row.remark || '-' }}</el-descriptions-item>
               </el-descriptions>
            </div>
            <div class="preview-content" v-if="isImage(preview.row.url)">
               <el-image 
                  :src="preview.row.url" 
                  fit="contain"
                  style="width: 100%; max-height: 500px;"
                  :preview-src-list="[preview.row.url]"
               ></el-image>
            </div>
         </div>
      </el-dialog>

      <!-- 编辑备注对话框 -->
      <el-dialog title="编辑备注" v-model="editRemark.open" width="500px" append-to-body>
         <el-form ref="editRemarkRef" :model="editRemark.form" label-width="80px">
            <el-form-item label="文件名称">
               <el-input v-model="editRemark.form.name" disabled />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
               <el-input 
                  v-model="editRemark.form.remark" 
                  type="textarea" 
                  placeholder="请输入备注信息"
                  :rows="4"
                  maxlength="200"
                  show-word-limit
               />
            </el-form-item>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button @click="editRemark.open = false">取 消</el-button>
               <el-button type="primary" @click="submitEditRemark" :loading="editRemark.loading">确 定</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="Oss">
import { listOss, getOss, delOss, exportOss, updateOss } from "@/api/system/oss"
import { getToken } from "@/utils/auth"
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

const ossList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null
  },
  upload: {
    open: false,
    title: "上传文件",
    url: "",
    headers: {
      Authorization: "Bearer " + getToken()
    },
    fileList: [],
    limit: 10
  },
  preview: {
    open: false,
    row: {}
  },
  editRemark: {
    open: false,
    loading: false,
    form: {
      id: null,
      name: '',
      remark: ''
    }
  }
})

const { queryParams, upload, preview, editRemark } = toRefs(data)

const uploadUrl = ref(import.meta.env.VITE_APP_BASE_API + "/common/oss/upload")

/** 查询OSS文件列表 */
function getList() {
  loading.value = true
  listOss(queryParams.value).then(response => {
    ossList.value = response.data.list;
    total.value = response.totalCount
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 上传文件 */
function handleUpload() {
  upload.value.open = true
  upload.value.fileList = []
}

/** 上传前校验 */
function handleBeforeUpload(file) {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    ElMessage.error(`文件大小不能超过50MB，当前文件大小：${formatFileSize(file.size)}`)
    return false
  }
  return true
}

/** 上传成功回调 */
function handleUploadSuccess(response, file, fileList) {
  if (response.code === 200 || response.code === 0) {
    ElMessage.success("文件上传成功")
    upload.value.open = false
    // 刷新列表
    getList()
  } else {
    ElMessage.error("文件上传失败：" + (response.msg || "未知错误"))
  }
}

/** 上传失败回调 */
function handleUploadError(err, file, fileList) {
  ElMessage.error("文件上传失败")
  console.error("上传错误:", err)
}

/** 文件超出限制 */
function handleExceed(files, fileList) {
  ElMessage.warning(`最多只能上传${upload.value.limit}个文件`)
}

/** 预览文件 */
function handlePreview(row) {
  preview.value.row = row
  preview.value.open = true
  getOss(row.id).then(response => {
    preview.value.row = response.data
  })

}

/** 下载文件 */
function handleDownload(row) {
  const link = document.createElement('a')
  link.href = row.url
  link.download = row.name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** 复制URL */
function copyUrl() {
  navigator.clipboard.writeText(preview.value.row.url).then(() => {
    ElMessage.success("URL已复制到剪贴板")
  }).catch(() => {
    ElMessage.error("复制失败")
  })
}

/** 编辑备注 */
function handleEditRemark(row) {
  editRemark.value.form = {
    id: row.id,
    name: row.name,
    remark: row.remark || ''
  }
  editRemark.value.open = true
}

/** 提交编辑备注 */
function submitEditRemark() {
  editRemark.value.loading = true
  updateOss(editRemark.value.form).then(response => {
    ElMessage.success("备注更新成功")
    editRemark.value.open = false
    getList()
  }).catch(() => {
    ElMessage.error("备注更新失败")
  }).finally(() => {
    editRemark.value.loading = false
  })
}

/** 判断是否为图片 */
function isImage(url) {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

/** 格式化文件大小 */
function formatFileSize(size) {
  if (!size || size === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let fileSize = size
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }
  
  return `${fileSize.toFixed(2)} ${units[unitIndex]}`
}

/** 删除按钮操作 */
function handleDelete(row) {
  const deleteIds = row.id || ids.value
  proxy.$modal.confirm('是否确认删除选中的文件记录？').then(() => {
    return delOss(deleteIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/sysoss/toExport', {
    ...queryParams.value
  }, `oss文件数据_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped>
.preview-container {
  padding: 20px;
}

.preview-info {
  margin-bottom: 20px;
}

.preview-content {
  text-align: center;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.el-icon--upload {
  font-size: 67px;
  color: #8c939d;
  margin-bottom: 16px;
}

.el-upload__text {
  color: #606266;
  font-size: 14px;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>
