<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
        <el-form-item label="品牌名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入品牌名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="toolbar mb8">
        <el-button type="primary" @click="handleAdd" v-hasPermi="['wms:brand:add']">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()" v-hasPermi="['wms:brand:remove']">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="brandList" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="品牌名称" prop="brandName" show-overflow-tooltip />
        <el-table-column label="品牌编码" prop="brandCode" min-width="120" />
        <el-table-column label="品牌Logo" align="center" min-width="100">
          <template #default="{ row }">
            <el-image v-if="row.brandLogo" :src="row.brandLogo" style="width: 50px; height: 50px" fit="cover" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="国家" prop="country" min-width="100" />
        <el-table-column label="排序" prop="sortOrder" min-width="70" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createAt" width="160" />
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleUpdate(row)" v-hasPermi="['wms:brand:edit']">修改</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" v-hasPermi="['wms:brand:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog v-model="open" :title="title" width="600px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="品牌名称" prop="brandName">
          <el-input v-model="form.brandName" placeholder="请输入品牌名称" />
        </el-form-item>
        <el-form-item label="品牌编码" prop="brandCode">
          <el-input v-model="form.brandCode" placeholder="请输入品牌编码" />
        </el-form-item>
        <el-form-item label="品牌Logo">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="1"
            :file-list="logoFileList"
            :on-success="handleLogoSuccess"
            :on-remove="handleLogoRemove"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <el-icon :size="20"><Plus /></el-icon>
            <template #file="{ file }">
              <el-image :src="file.url" fit="cover" style="width: 100%; height: 100%" />
            </template>
          </el-upload>
          <div class="upload-tip">建议尺寸：200x200，仅支持一张图片（选填）</div>
        </el-form-item>
        <el-form-item label="国家">
          <el-input v-model="form.country" placeholder="请输入品牌国家" />
        </el-form-item>
        <el-form-item label="品牌描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入品牌描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="open = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getBrandList, getBrandDetail, submitBrand, deleteBrand } from '@/api/wms/brand'
import { getToken } from '@/utils/auth'

const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
const uploadHeaders = computed(() => ({ Authorization: 'Bearer ' + getToken() }))
const logoFileList = ref([])

const loading = ref(false)
const total = ref(0)
const brandList = ref([])
const selectedIds = ref([])
const open = ref(false)
const title = ref('')
const formRef = ref(null)

const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '' })

const form = reactive({
  id: null, brandName: '', brandCode: '', brandLogo: '', country: '中国', description: '', sortOrder: 0, status: 1
})

const rules = {
  brandName: [{ required: true, message: '品牌名称不能为空', trigger: 'blur' }],
  brandCode: [{ required: true, message: '品牌编码不能为空', trigger: 'blur' }]
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(s => s.id)
}

async function getList() {
  loading.value = true
  try {
    const res = await getBrandList(queryParams)
    const data = res.data || res
    brandList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.total || brandList.value.length
  } catch (e) {
    console.error('加载品牌失败:', e)
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { Object.assign(queryParams, { pageNum: 1, name: '' }); getList() }

function handleAdd() {
  Object.assign(form, { id: null, brandName: '', brandCode: '', brandLogo: '', country: '', description: '', sortOrder: 0, status: 1 })
  logoFileList.value = []
  title.value = '添加品牌'
  open.value = true
}

async function handleUpdate(row) {
  try {
    const res = await getBrandDetail(row.id)
    const data = res.data || res
    Object.assign(form, {
      id: data.id, brandName: data.brandName || '', brandCode: data.brandCode || '',
      brandLogo: data.brandLogo || '', country: data.country || '中国',
      description: data.description || '', sortOrder: data.sortOrder || 0, status: data.status ?? 1
    })
    logoFileList.value = form.brandLogo ? [{ name: 'logo', url: form.brandLogo }] : []
    title.value = '修改品牌'
    open.value = true
  } catch (e) {
    ElMessage.error('获取品牌信息失败')
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await submitBrand({ ...form })
    ElMessage.success('操作成功')
    open.value = false
    getList()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function handleDelete(row) {
  const ids = row?.id || selectedIds.value
  if (!ids || !ids.length) { ElMessage.warning('请选择要删除的数据'); return }
  ElMessageBox.confirm('是否确认删除选中的品牌？', '提示', { type: 'warning' }).then(async () => {
    await deleteBrand(ids)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

/** 上传前校验 */
function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }
  return true
}

/** Logo上传成功 */
function handleLogoSuccess(response, file, fileList) {
  if (response.code === 0) {
    const url = response.data?.url || response.data
    file.url = url
    logoFileList.value = fileList.slice(-1)
    form.brandLogo = url
    ElMessage.success('Logo上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

/** 移除Logo */
function handleLogoRemove() {
  logoFileList.value = []
  form.brandLogo = ''
}

/** 上传失败 */
function handleUploadError(error) {
  console.error('上传失败:', error)
  ElMessage.error('Logo上传失败')
}

onMounted(getList)
</script>

<style scoped>
.toolbar { margin-bottom: 12px; }
.upload-tip { font-size: 12px; color: #909399; margin-top: 5px; }
:deep(.el-upload--picture-card) { width: 100px; height: 100px; }
:deep(.el-upload-list--picture-card .el-upload-list__item) { width: 100px; height: 100px; }
</style>
