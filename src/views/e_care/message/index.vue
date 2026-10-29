<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num">{{ stat.total || 0 }}</div>
          <div class="stat-label">全部消息</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num pending">{{ stat.pending || 0 }}</div>
          <div class="stat-label">待处理</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num handled">{{ stat.handled || 0 }}</div>
          <div class="stat-label">已处理</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num closed">{{ stat.closed || 0 }}</div>
          <div class="stat-label">已关闭</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类切换 + 搜索 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane name="all">
        <template #label>
          <span>全部</span>
        </template>
      </el-tab-pane>
      <el-tab-pane v-for="item in tipsTypes" :key="item.value" :name="String(item.value)">
        <template #label>
          <span>
            {{ item.label }}
            <el-badge v-if="getUnread(item.value) > 0" :value="getUnread(item.value)" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入标题" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <el-select v-model="queryParams.state" placeholder="请选择状态" clearable style="width: 160px">
          <el-option label="待处理" :value="0" />
          <el-option label="已处理" :value="1" />
          <el-option label="已关闭" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <!-- <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['care:storemessage:submit']">新增消息</el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button type="success" plain icon="Check" @click="handleReadAll" v-hasPermi="['care:storemessage:edit']">当前分类全部已读</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['care:storemessage:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="refreshAll"></right-toolbar>
    </el-row>

    <!-- 消息列表 -->
    <el-table v-loading="loading" :data="messageList" style="width: 100%">
      <el-table-column label="ID" align="center" prop="id" min-width="80" />
      <el-table-column label="标题" align="center" prop="title" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.title || '(无标题)' }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="tipsType" min-width="100">
        <template #default="scope">
          <el-tag :type="getTipsTag(scope.row.tipsType)">{{ getTipsName(scope.row.tipsType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="state" min-width="100">
        <template #default="scope">
          <el-tag :type="getStateTag(scope.row.state)">{{ getStateName(scope.row.state) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="价值" align="center" prop="worth" min-width="80" />
      <el-table-column label="浏览量" align="center" prop="viewCount" min-width="90" />
      <el-table-column label="回复数" align="center" prop="replyCount" min-width="90" />
      <el-table-column label="创建时间" align="center" prop="createAt" min-width="160" />
      <el-table-column label="操作" align="center" width="280" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['care:storemessage:query']">查看</el-button>
          <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)" v-hasPermi="['care:storemessage:submit']">编辑</el-button>
          <el-button v-if="scope.row.state !== 1" link type="success" icon="Select" @click="handleState(scope.row, 1)" v-hasPermi="['care:storemessage:edit']">处理</el-button>
          <el-button v-if="scope.row.state !== 2" link type="warning" icon="CloseBold" @click="handleState(scope.row, 2)" v-hasPermi="['care:storemessage:edit']">关闭</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['care:storemessage:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="80%" append-to-body top="5vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入标题" maxlength="145" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" prop="tipsType">
              <el-select v-model="form.tipsType" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="item in tipsTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="内容" prop="content">
          <div style="border: 1px solid #ccc; z-index: 10000; width: 100%">
            <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
            <Editor style="height: 360px; overflow-y: hidden" v-model="form.content" :defaultConfig="editorConfig" mode="default" @onCreated="handleCreated" />
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="价值" prop="worth">
              <el-input-number v-model="form.worth" :min="0" :max="999999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sequence">
              <el-input-number v-model="form.sequence" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="state">
              <el-select v-model="form.state" style="width: 100%">
                <el-option label="待处理" :value="0" />
                <el-option label="已处理" :value="1" />
                <el-option label="已关闭" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="有效时间起" prop="validStartDate">
              <el-date-picker v-model="form.validStartDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="有效时间止" prop="validEndDate">
              <el-date-picker v-model="form.validEndDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="应用ID" prop="appId">
              <el-input v-model="form.appId" placeholder="关联应用ID(选填)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog title="消息详情" v-model="viewDialogVisible" width="800px" append-to-body top="5vh">
      <div class="message-view">
        <h2 class="view-title">{{ viewData.title }}</h2>
        <div class="view-meta">
          <el-tag :type="getTipsTag(viewData.tipsType)" size="small">{{ getTipsName(viewData.tipsType) }}</el-tag>
          <el-tag :type="getStateTag(viewData.state)" size="small">{{ getStateName(viewData.state) }}</el-tag>
          <span>发布时间：{{ viewData.createAt }}</span>
          <span>浏览量：{{ viewData.viewCount }}</span>
          <span v-if="viewData.worth">价值：{{ viewData.worth }}</span>
        </div>
        <el-divider />
        <div class="view-content" v-html="viewData.content"></div>
        <div v-if="viewData.remark" class="view-remark">
          <el-divider content-position="left">备注</el-divider>
          {{ viewData.remark }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="StoreMessage">
import { ref, reactive, computed, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import {
  getMessageList,
  getMessageDetail,
  submitMessage,
  deleteMessage,
  updateMessageState,
  exportMessage,
  getMessageStat,
  getMessageTips,
  readMessageTips
} from '@/api/care/message'

const messageList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const submitLoading = ref(false)
const dialogTitle = ref('')

// 分类：0=系统 1=活动 2=交易
const tipsTypes = [
  { value: 0, label: '系统' },
  { value: 1, label: '活动' },
  { value: 2, label: '交易' }
]

// 当前分类标签页
const activeTab = ref('all')
// 未读提示映射 { tipsType: count }
const unreadMap = ref({})

const stat = reactive({ total: 0, pending: 0, handled: 0, closed: 0 })

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: undefined,
  tipsType: undefined,
  state: undefined
})

const form = reactive({
  id: undefined,
  title: '',
  content: '',
  tipsType: 0,
  worth: 0,
  sequence: 0,
  state: 0,
  appType: 0,
  appId: undefined,
  validStartDate: undefined,
  validEndDate: undefined,
  remark: ''
})

const viewData = reactive({
  id: undefined,
  title: '',
  content: '',
  tipsType: 0,
  state: 0,
  createAt: '',
  viewCount: 0,
  worth: 0,
  remark: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  tipsType: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const formRef = ref(null)

// 富文本编辑器
const editorRef = shallowRef()
const toolbarConfig = { excludeKeys: ['fullScreen'] }
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: import.meta.env.VITE_APP_BASE_API + '/common/upload',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024,
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/*'],
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      customInsert(res, insertFn) {
        insertFn(res.data.url, res.data.fileName || '', res.data.url)
      }
    }
  }
}

const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

/** 分类名称 */
function getTipsName(tipsType) {
  const item = tipsTypes.find(t => t.value === tipsType)
  return item ? item.label : '系统'
}

/** 分类标签 */
function getTipsTag(tipsType) {
  const tags = { 0: 'info', 1: 'success', 2: 'warning' }
  return tags[tipsType] || 'info'
}

/** 状态名称 */
function getStateName(state) {
  const names = { 0: '待处理', 1: '已处理', 2: '已关闭' }
  return names[state] || '待处理'
}

/** 状态标签 */
function getStateTag(state) {
  const tags = { 0: 'danger', 1: 'success', 2: 'info' }
  return tags[state] || 'info'
}

/** 获取某分类未读数 */
function getUnread(tipsType) {
  return unreadMap.value[tipsType] || 0
}

/** 查询列表 */
function getList() {
  loading.value = true
  // 根据标签页设置分类过滤
  queryParams.tipsType = activeTab.value === 'all' ? undefined : Number(activeTab.value)
  getMessageList(queryParams).then(response => {
    messageList.value = response.data.list || response.data.rows || []
    total.value = response.data.totalCount || response.data.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 查询统计 */
function getStat() {
  getMessageStat().then(response => {
    Object.assign(stat, response.data || {})
  })
}

/** 查询未读提示 */
function getTips() {
  getMessageTips().then(response => {
    const map = {}
    ;(response.data || []).forEach(item => {
      map[item.tipsType] = item.count || 0
    })
    unreadMap.value = map
  })
}

/** 刷新全部数据 */
function refreshAll() {
  getList()
  getStat()
  getTips()
}

/** 切换标签页 */
function handleTabChange() {
  queryParams.pageNum = 1
  getList()
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

/** 重置 */
function resetQuery() {
  queryParams.title = undefined
  queryParams.state = undefined
  handleQuery()
}

/** 新增 */
function handleAdd() {
  resetForm()
  dialogTitle.value = '新增消息'
  dialogVisible.value = true
}

/** 查看 */
function handleView(row) {
  getMessageDetail(row.id).then(response => {
    Object.assign(viewData, response.data || {})
    viewDialogVisible.value = true
    // 浏览量已在后端累加，刷新本地数据
    row.viewCount = (row.viewCount || 0) + 1
    getStat()
  })
}

/** 编辑 */
function handleEdit(row) {
  resetForm()
  dialogTitle.value = '编辑消息'
  getMessageDetail(row.id).then(response => {
    Object.assign(form, response.data || {})
    dialogVisible.value = true
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.setHtml(form.content || '')
      }
    })
  })
}

/** 更新状态 */
function handleState(row, state) {
  const action = state === 1 ? '处理' : '关闭'
  ElMessageBox.confirm(`确认${action}该消息？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    updateMessageState({ id: row.id, state }).then(() => {
      ElMessage.success(`${action}成功`)
      refreshAll()
    })
  }).catch(() => {})
}

/** 全部已读 */
function handleReadAll() {
  const data = activeTab.value === 'all' ? {} : { tipsType: Number(activeTab.value) }
  const scope = activeTab.value === 'all' ? '全部消息' : getTipsName(Number(activeTab.value)) + '消息'
  ElMessageBox.confirm(`确认将「${scope}」标记为已读？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    readMessageTips(data).then(() => {
      ElMessage.success('操作成功')
      getTips()
    })
  }).catch(() => {})
}

/** 提交 */
function submitForm() {
  formRef.value.validate(valid => {
    if (valid) {
      submitLoading.value = true
      submitMessage({ ...form }).then(() => {
        ElMessage.success(form.id ? '修改成功' : '新增成功')
        dialogVisible.value = false
        submitLoading.value = false
        refreshAll()
      }).catch(() => {
        submitLoading.value = false
      })
    }
  })
}

/** 删除 */
function handleDelete(row) {
  ElMessageBox.confirm('确认删除该消息？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteMessage(row.id).then(() => {
      ElMessage.success('删除成功')
      refreshAll()
    })
  }).catch(() => {})
}

/** 导出 */
function handleExport() {
  ElMessageBox.confirm('是否确认导出门店消息数据？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return exportMessage(queryParams)
  }).then(response => {
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '门店消息_' + new Date().getTime() + '.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }).catch(() => {})
}

/** 重置表单 */
function resetForm() {
  form.id = undefined
  form.title = ''
  form.content = ''
  form.tipsType = 0
  form.worth = 0
  form.sequence = 0
  form.state = 0
  form.appType = 0
  form.appId = undefined
  form.validStartDate = undefined
  form.validEndDate = undefined
  form.remark = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

refreshAll()
</script>

<style scoped>
.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-num {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.4;
}

.stat-num.pending {
  color: #F56C6C;
}

.stat-num.handled {
  color: #67C23A;
}

.stat-num.closed {
  color: #909399;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.tab-badge {
  margin-left: 4px;
  margin-top: -10px;
}

.message-view {
  padding: 8px 4px;
}

.view-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #303133;
}

.view-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.view-content {
  line-height: 1.8;
  color: #606266;
  font-size: 15px;
  word-break: break-word;
}

.view-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.view-remark {
  color: #909399;
  font-size: 14px;
  white-space: pre-wrap;
}
</style>
