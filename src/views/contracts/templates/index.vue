<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="68px">
        <el-form-item label="模板名称" prop="templateName">
          <el-input
            v-model="queryParams.templateName"
            placeholder="请输入模板名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" round>新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" round>修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" round>删除</el-button>
        </el-col>
        <!-- <el-col :span="1.5">
          <el-button type="warning" plain icon="Setting" @click="handleConfig" round>配置参数</el-button>
        </el-col> -->
      </el-row>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="templateList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="模板编号" align="center" prop="contractNo" min-width="220" show-overflow-tooltip />
        <el-table-column label="模板名称" align="center" prop="templateName" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" align="center" prop="storeId" width="90">
          <template #default="scope">
            <!-- store_id=0 为平台通用模板，所有机构可见但只读 -->
            <el-tag v-if="isCommon(scope.row)" type="warning" effect="plain">通用</el-tag>
            <el-tag v-else type="info" effect="plain">本机构</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模板描述" align="center" prop="remark" min-width="200" show-overflow-tooltip />
        <el-table-column label="模板文件" align="center" prop="signPdfurl" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <el-link
              v-if="scope.row.signPdfurl"
              type="primary"
              :href="resolveFileUrl(scope.row.signPdfurl)"
              target="_blank"
              rel="noopener"
              :underline="false"
            >
              <el-icon><Document /></el-icon>{{ pdfFileName(scope.row.signPdfurl) }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" min-width="100">
          <template #default="scope">
            <el-tag :type="Number(scope.row.status) === 1 ? 'success' : 'danger'">
              {{ Number(scope.row.status) === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createAt" width="150" show-overflow-tooltip />
        <el-table-column label="更新时间" align="center" prop="updateAt" width="150" show-overflow-tooltip />
        
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="200">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)" round>查看</el-button>
            <el-button link type="primary" icon="Edit" :disabled="isCommon(scope.row)" @click="handleUpdate(scope.row)" round>修改</el-button>
            <!-- <el-button link type="warning" icon="Setting" @click="handleConfig(scope.row)" round>配置</el-button> -->
            <el-button link type="danger" icon="Delete" :disabled="isCommon(scope.row)" @click="handleDelete(scope.row)" round>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <!-- <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      /> -->
    </el-card>

    <!-- 添加或修改模板对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="190px">
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="form.templateName" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入模板描述" />
        </el-form-item>
        <el-form-item label="模板文件" prop="signPdfurl">
          <el-upload
            :action="uploadAction"
            :headers="{ Authorization: 'Bearer ' + getToken() }"
            :show-file-list="false"
            accept=".pdf"
            :before-upload="beforePdfUpload"
            :on-success="handlePdfSuccess"
            :on-error="handlePdfError"
          >
            <el-button type="primary" plain icon="Upload" :loading="pdfUploading" round>
              {{ form.signPdfurl ? '重新上传' : '上传PDF' }}
            </el-button>
            <template #tip>
              <div class="el-upload__tip">仅支持 PDF 文件，且不超过 10MB</div>
            </template>
          </el-upload>
          <div v-if="form.signPdfurl" class="pdf-file">
            <el-link type="primary" :href="resolveFileUrl(form.signPdfurl)" target="_blank" rel="noopener" :underline="false">
              <el-icon><Document /></el-icon>{{ pdfFileName(form.signPdfurl) }}
            </el-link>
            <el-button link type="danger" @click="removePdf">移除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" round>确 定</el-button>
          <el-button @click="cancel" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 参数配置对话框 -->
    <el-dialog title="合同参数配置" v-model="configOpen" width="90%" append-to-body>
      <ContractConfig :template-id="currentTemplate.id" v-if="configOpen" />
    </el-dialog>

    <!-- 模板详情对话框 -->
    <el-dialog title="模板详情" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="1" border direction="vertical" >
        <el-descriptions-item label="模板编号">{{ currentTemplate.contractNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模板名称">{{ currentTemplate.templateName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模板描述">{{ currentTemplate.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模板文件">
          <el-link
            v-if="currentTemplate.signPdfurl"
            type="primary"
            :href="resolveFileUrl(currentTemplate.signPdfurl)"
            target="_blank"
            rel="noopener"
            :underline="false"
          >
            <el-icon><Document /></el-icon>{{ pdfFileName(currentTemplate.signPdfurl) }}
          </el-link>
          <span v-else>未上传</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="Number(currentTemplate.status) === 1 ? 'success' : 'danger'">
            {{ Number(currentTemplate.status) === 1 ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTemplate.createAt || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="ContractTemplates">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { getToken } from '@/utils/auth'
import { getResidentContractTemplates, submitContractTemplate, deleteContractTemplate } from '@/api/contracts'
import ContractConfig from './components/ContractConfig.vue'
const { proxy } = getCurrentInstance()

// 上传地址与合同文件保持一致：走 /common/upload，返回 { code: 200, url }
const uploadAction = import.meta.env.VITE_APP_BASE_API + '/common/upload'
const pdfUploading = ref(false)

const templateList = ref([])
const loading = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const configOpen = ref(false)
const detailOpen = ref(false)
const currentTemplate = ref({})

// 查询参数：name 与后端 templateName 保持一致
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  templateName: undefined,
  status: undefined
})

// 表单参数
const form = ref({})
const rules = ref({
  templateName: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  remark: [{ required: true, message: '模板描述不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

// 模板PDF 存于 sign_pdfurl 列：模板行放的是空白模板文件，不是已签合同
// 相对地址需补接口前缀，绝对地址直接用
function resolveFileUrl(url) {
  if (!url) return ''
  return /^(https?:)?\/\//.test(url) ? url : import.meta.env.VITE_APP_BASE_API + url
}

// 从地址截出文件名做展示
function pdfFileName(url) {
  if (!url) return ''
  const path = String(url).split('?')[0].split('#')[0]
  return path.substring(path.lastIndexOf('/') + 1) || url
}

// 上传前校验：类型与大小
function beforePdfUpload(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '')
  if (!isPdf) {
    proxy.$modal.msgError('上传文件只能是 PDF 格式!')
    return false
  }
  if (file.size / 1024 / 1024 > 10) {
    proxy.$modal.msgError('PDF文件大小不能超过 10MB!')
    return false
  }
  pdfUploading.value = true
  return true
}

// 上传成功：通用上传接口返回 RuoYi 风格的 code=200，不是业务 R 的 code=0
function handlePdfSuccess(response) {
  pdfUploading.value = false
  const url = response.url || response.fileName
  if (response.code === 200 && url) {
    form.value.signPdfurl = url
    proxy.$modal.msgSuccess('模板PDF上传成功')
  } else {
    proxy.$modal.msgError(response.msg || '模板PDF上传失败')
  }
}

function handlePdfError() {
  pdfUploading.value = false
  proxy.$modal.msgError('模板PDF上传失败，请重试')
}

// 移除已上传的模板PDF：置空串而不是 undefined，后端 not_null 策略才会真的写入空值
function removePdf() {
  form.value.signPdfurl = ''
}

// 获取模板列表（接口返回数组，不分页）
function getList() {
  loading.value = true
  getResidentContractTemplates(queryParams).then(response => {
    templateList.value = response.data || []
    total.value = templateList.value.length
    loading.value = false
  }).catch(() => {
    templateList.value = []
    total.value = 0
    loading.value = false
  })
}

// 搜索按钮操作
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置按钮操作
function resetQuery() {
  proxy.resetForm('queryForm')
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  selectedRows.value = selection
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 平台通用模板（store_id=0）由平台维护，机构端只读
function isCommon(row) {
  return Number(row && row.storeId) === 0
}

// 新增按钮操作
function handleAdd() {
  reset()
  open.value = true
  title.value = '添加合同模板'
}

// 修改按钮操作：行内按钮传入行对象，工具栏按钮取当前选中行
function handleUpdate(row) {
  const target = row && row.id ? row : selectedRows.value[0]
  if (!target) {
    proxy.$modal.msgWarning('请选择要修改的模板')
    return
  }
  if (isCommon(target)) {
    proxy.$modal.msgWarning('平台通用模板不可修改，可新增本机构自己的模板')
    return
  }
  reset()
  form.value = { ...target }
  open.value = true
  title.value = '修改合同模板'
}

// 查看详情操作
function handleView(row) {
  currentTemplate.value = row
  detailOpen.value = true
}

// 配置参数操作
function handleConfig(row) {
  currentTemplate.value = row
  configOpen.value = true
}

// 删除按钮操作：通用模板不参与删除
function handleDelete(row) {
  const targets = row && row.id ? [row] : selectedRows.value
  const templateIds = targets.filter(item => !isCommon(item)).map(item => item.id)
  if (!templateIds.length) {
    proxy.$modal.msgWarning('平台通用模板不可删除，请选择本机构模板')
    return
  }
  proxy.$modal.confirm('是否确认删除选中的 ' + templateIds.length + ' 个模板？').then(function() {
    return deleteContractTemplate(templateIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

// 表单重置
function reset() {
  form.value = {
    id: undefined,
    templateName: undefined,
    remark: undefined,
    signPdfurl: undefined,
    status: 1
  }
  proxy.resetForm('formRef')
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 提交表单：模板固定 contract_type=100，编号由后端生成 TP- 前缀
function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (valid) {
      submitContractTemplate(form.value).then(() => {
        proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
        open.value = false
        getList()
      })
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.pdf-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
</style>