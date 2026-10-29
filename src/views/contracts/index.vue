<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="68px">
        <el-form-item label="合同编号" prop="contractNo">
          <el-input
            v-model="queryParams.contractNo"
            placeholder="请输入合同编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="长者编号" prop="residentNo">
          <el-input
            v-model="queryParams.residentNo"
            placeholder="请输入长者编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="长者姓名" prop="residentName">
          <el-input
            v-model="queryParams.residentName"
            placeholder="请输入长者姓名"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option v-for="opt in CONTRACT_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 从长者档案「关联合同」跳转过来时的筛选提示 -->
      <div v-if="scopedResident" class="resident-scope-tip">
        <el-tag type="primary" closable @close="clearResidentScope">
          只看长者：{{ scopedResident.name || ('编号 ' + scopedResident.id) }}
        </el-tag>
        <span class="scope-tip-text">合同列表已按该长者过滤，关闭标签可查看全部</span>
      </div>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleCreate" round>创建合同</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleSign" round>签署合同</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" :disabled="single" @click="handleDownload" round>下载合同</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" round>删除合同</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="info" plain icon="View" :disabled="single" @click="handleView" round>查看详情</el-button>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="contractList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="合同编号" align="center" prop="contractNo" min-width="170" show-overflow-tooltip />
        <el-table-column label="长者编号" align="center" prop="residentNo" min-width="140" show-overflow-tooltip />
        <el-table-column label="长者姓名" align="center" prop="residentName" min-width="100" />
       
        <el-table-column label="协议名称" align="center" prop="templateName" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <el-tag :type="getContractStatusTagType(scope.row.status)" effect="plain" round>
              {{ getContractStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签署日期" align="center" prop="signDate" width="110">
          <template #default="scope">
            <span>{{ scope.row.signDate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" align="center" prop="effectiveDate" width="110">
          <template #default="scope">
            <span>{{ scope.row.effectiveDate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="到期日期" align="center" prop="expiryDate" width="110">
          <template #default="scope">
            <span>{{ scope.row.expiryDate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createAt" width="160" />
        <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)" round>查看</el-button>
            <el-button
              v-if="Number(scope.row.status) === CONTRACT_STATUS.PENDING"
              link
              type="success"
              icon="Edit"
              @click="handleSign(scope.row)"
              round
            >
              签署
            </el-button>
            <el-button
              link
              type="warning"
              icon="Download"
              :disabled="!scope.row.signPdfurl"
              @click="handleDownload(scope.row)"
              round
            >
              下载
            </el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" round>删除</el-button>
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
    </el-card>

    <!-- 创建合同对话框 -->
    <el-dialog title="创建合同" v-model="createOpen" width="620px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="createRules" label-width="90px">
        <el-form-item label="长者选择" prop="residentId">
          <el-select
            v-model="form.residentId"
            placeholder="请选择长者"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="resident in residentList"
              :key="resident.id"
              :label="`${resident.name}（${resident.residentNo || '无编号'}）`"
              :value="resident.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="协议模板" prop="templateId">
          <el-select v-model="form.templateId" placeholder="请选择协议模板" clearable style="width: 100%">
            <el-option
              v-for="template in enabledTemplates"
              :key="template.id"
              :label="templateLabel(template)"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="合同文件" prop="signPdfurl">
          <el-upload
            ref="uploadRef"
            :action="uploadAction"
            :show-file-list="true"
            :limit="1"
            :on-success="handleUploadSuccess"
            :on-remove="handleFileRemove"
            :before-upload="beforeUpload"
            :headers="{ Authorization: 'Bearer ' + getToken() }"
            accept=".pdf,.doc,.docx"
            drag
            style="width: 100%"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持PDF、Word文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker
            v-model="form.effectiveDate"
            type="date"
            placeholder="选择生效日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="到期日期" prop="expiryDate">
          <el-date-picker
            v-model="form.expiryDate"
            type="date"
            placeholder="选择到期日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitting" @click="submitCreate" round>确 定</el-button>
          <el-button @click="cancelCreate" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 合同详情对话框 -->
    <el-dialog title="合同详情" v-model="detailOpen" width="90%" append-to-body destroy-on-close>
      <contract-detail :contract="currentContract" v-if="detailOpen" @download="handleDownload(currentContract)" />
    </el-dialog>

    <!-- 签署合同对话框 -->
    <el-dialog title="签署合同" v-model="signOpen" width="90%" append-to-body destroy-on-close>
      <contract-sign :contract="currentContract" @success="handleSignSuccess" v-if="signOpen" />
    </el-dialog>
  </div>
</template>

<script setup name="Contracts">
import { ref, reactive, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getResidentContracts, submitContract, deleteContract, getResidentContractTemplates } from '@/api/contracts'
import { getResidentOptions } from '@/api/residents'
import ContractDetail from './components/ContractDetail.vue'
import ContractSign from './components/ContractSign.vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_OPTIONS,
  getContractStatusName,
  getContractStatusTagType
} from '@/utils/careEnums'
const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()

// 上传地址跟随环境变量，避免写死 /dev-api
const uploadAction = import.meta.env.VITE_APP_BASE_API + '/common/upload'

// 上传接口返回的是相对地址（/profile/upload/...），预览与下载前需补上接口前缀
function resolveFileUrl(url) {
  if (!url) return ''
  return /^(https?:)?\/\//.test(url) ? url : import.meta.env.VITE_APP_BASE_API + url
}

const contractList = ref([])
const residentList = ref([])
const templateList = ref([])
const loading = ref(true)
const submitting = ref(false)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const createOpen = ref(false)
const detailOpen = ref(false)
const signOpen = ref(false)
const currentContract = ref({})
const uploadRef = ref()
const contractFile = ref(null)

// 查询参数：字段与后端 e_store_resident_contract 保持一致
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  contractNo: undefined,
  residentNo: undefined,
  residentName: undefined,
  residentId: undefined,
  status: undefined
})

// 长者档案页跳转带来的上下文：只按 residentId 精确筛选，姓名仅用于提示
const scopedResident = ref(null)

// 创建表单
const form = ref({})
const createRules = ref({
  residentId: [{ required: true, message: '请选择长者', trigger: 'change' }],
  templateId: [{ required: true, message: '请选择协议模板', trigger: 'change' }],
  signPdfurl: [{ required: true, message: '请上传合同文件', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
})

// 启用中的模板才允许新建合同
const enabledTemplates = computed(() => templateList.value.filter(item => Number(item.status) === 1))

// 模板下拉标签：平台通用模板（store_id=0）加前缀，避免与本机构同名模板混淆
function templateLabel(template) {
  return Number(template.storeId) === 0 ? '【通用】' + template.templateName : template.templateName
}

// 获取合同列表
function getList() {
  loading.value = true
  getResidentContracts(queryParams).then(response => {
    contractList.value = (response.data.list || []).map(row => ({
      ...row,
      signPdfurl: resolveFileUrl(row.signPdfurl)
    }))
    total.value = response.data.totalCount || 0
    loading.value = false
  }).catch(() => {
    contractList.value = []
    total.value = 0
    loading.value = false
  })
}

// 获取长者列表：/resident/list 返回 R<List>，data 即数组（后端已按门店 + 在住状态过滤）
function getResidents() {
  getResidentOptions().then(response => {
    residentList.value = response.data || []
  }).catch(() => {
    residentList.value = []
  })
}

// 获取模板列表（接口返回数组）
function getTemplates() {
  getResidentContractTemplates({}).then(response => {
    templateList.value = response.data || []
  })
}

// 搜索按钮操作
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 读取路由参数中的长者，命中则回到第一页由该长者过滤
function applyRoutePreset() {
  const residentId = Number(route.query.residentId)
  if (!residentId) return false
  queryParams.residentId = residentId
  queryParams.pageNum = 1
  scopedResident.value = { id: residentId, name: route.query.residentName || '' }
  return true
}

// 清除长者筛选
function clearResidentScope() {
  queryParams.residentId = undefined
  scopedResident.value = null
  if (route.query.residentId) {
    const query = { ...route.query }
    delete query.residentId
    delete query.residentName
    router.replace({ path: route.path, query })
  }
  handleQuery()
}

// 重置按钮操作
function resetQuery() {
  proxy.resetForm('queryForm')
  // residentId 不是表单项，resetFields 清不掉，需手动解除长者筛选
  queryParams.residentId = undefined
  scopedResident.value = null
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 创建合同操作
function handleCreate() {
  getResidents()
  getTemplates()
  resetCreate()
  createOpen.value = true
}

// 查看详情操作
function handleView(row) {
  if (!row) {
    ElMessage.warning('请选择一条合同记录')
    return
  }
  currentContract.value = { ...row, pdfUrl: row.signPdfurl || row.pdfUrl }
  detailOpen.value = true
}

// 签署合同操作
function handleSign(row) {
  const target = row || contractList.value.find(item => ids.value.includes(item.id))
  if (!target) {
    ElMessage.warning('请选择一条合同记录')
    return
  }
  if (Number(target.status) !== CONTRACT_STATUS.PENDING) {
    ElMessage.warning('只有「待签署」的合同可以签署')
    return
  }
  currentContract.value = { ...target, pdfUrl: target.signPdfurl || target.pdfUrl }
  signOpen.value = true
}

// 下载合同：直接打开签署后的 PDF 地址
function handleDownload(row) {
  const target = row || contractList.value.find(item => ids.value.includes(item.id))
  const pdfUrl = target && (target.signPdfurl || target.pdfUrl)
  if (!pdfUrl) {
    ElMessage.warning('没有可下载的PDF文件')
    return
  }
  window.open(pdfUrl, '_blank')
}

// 删除合同操作
function handleDelete(row) {
  const contractIds = row && row.id ? [row.id] : ids.value
  if (!contractIds.length) {
    ElMessage.warning('请选择要删除的合同')
    return
  }
  proxy.$modal.confirm('是否确认删除选中的 ' + contractIds.length + ' 份合同？').then(function() {
    return deleteContract(contractIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

// 上传前验证
function beforeUpload(file) {
  const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('上传文件只能是PDF、Word格式!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过10MB!')
    return false
  }
  return true
}

// 上传成功处理：拿后端返回的相对地址
function handleUploadSuccess(response) {
  if (response.code === 200) {
    form.value.signPdfurl = response.url
    contractFile.value = response.url
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.msg || '文件上传失败')
  }
}

// 文件移除处理
function handleFileRemove() {
  contractFile.value = null
  form.value.signPdfurl = null
}

// 重置创建表单
function resetCreate() {
  form.value = {
    residentId: undefined,
    residentNo: undefined,
    residentName: undefined,
    templateId: undefined,
    templateName: undefined,
    contractType: 1,
    effectiveDate: undefined,
    expiryDate: undefined,
    remark: undefined,
    signPdfurl: null
  }
  contractFile.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  proxy.resetForm('formRef')
}

// 取消创建
function cancelCreate() {
  createOpen.value = false
  resetCreate()
}

// 提交创建：长者姓名/编号与协议名称由后端按 id 回填
function submitCreate() {
  proxy.$refs['formRef'].validate(valid => {
    if (!valid) return
    submitting.value = true
    submitContract(form.value).then(() => {
      proxy.$modal.msgSuccess('创建成功')
      createOpen.value = false
      getList()
    }).finally(() => {
      submitting.value = false
    })
  })
}

// 签署成功回调
function handleSignSuccess() {
  signOpen.value = false
  getList()
}

onMounted(() => {
  applyRoutePreset()
  getList()
  getResidents()
  getTemplates()
})

// 已在本页时再次从长者档案跳转（组件未销毁）：重新应用筛选并重拉列表
watch(() => route.query.residentId, (val) => {
  if (val && applyRoutePreset()) getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

/* 长者筛选提示 */
.resident-scope-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.scope-tip-text {
  font-size: 12px;
  color: #86909c;
}

:deep(.el-upload__tip) {
  font-size: 12px;
  color: #606266;
  margin-top: 7px;
  text-align: center;
}
</style>
