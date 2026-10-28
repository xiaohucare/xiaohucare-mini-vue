<template>
  <div class="app-container">
    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          :icon="Plus"
          @click="handleAdd()"
        >新增</el-button>
      </el-col>
    </el-row>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="categoryList"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column label="分类名称" prop="categoryName" min-width="200" />
      <el-table-column label="分类编码" prop="categoryCode" min-width="150" />
      <el-table-column label="图标" prop="icon" min-width="100">
        <template #default="{ row }">
          <el-image v-if="row.icon" :src="row.icon" style="width: 40px; height: 40px" fit="cover" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sortOrder" min-width="80" />
      <el-table-column label="状态" prop="status" min-width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createAt" width="180" />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :icon="Plus" @click="handleAdd(row)">新增</el-button>
          <el-button link type="primary" :icon="Edit" @click="handleUpdate(row)">修改</el-button>
          <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/修改对话框 -->
    <el-dialog v-model="open" :title="title" width="600px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级分类">
          <el-select v-model="form.parentId" placeholder="不选则为顶级分类" clearable style="width:100%">
            <el-option :value="0" label="顶级分类（根节点）" />
            <el-option
              v-for="item in flatOptions"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="categoryCode">
          <el-input v-model="form.categoryCode" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="图标">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="1"
            :file-list="iconFileList"
            :on-success="handleIconSuccess"
            :on-remove="handleIconRemove"
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getCategoryList, getCategoryDetail, submitCategory, deleteCategory } from '@/api/wms/product'
import { getToken } from '@/utils/auth'

const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
const uploadHeaders = computed(() => ({ Authorization: 'Bearer ' + getToken() }))
const iconFileList = ref([])

const loading = ref(false)
const categoryList = ref([])
const flatOptions = ref([])

// 对话框
const open = ref(false)
const title = ref('')
const formRef = ref(null)
const form = reactive({
  id: null,
  parentId: 0,
  categoryName: '',
  categoryCode: '',
  icon: '',
  sortOrder: 0,
  status: 1
})
const rules = {
  categoryName: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  categoryCode: [{ required: true, message: '分类编码不能为空', trigger: 'blur' }]
}

/** 查询列表 */
function getList() {
  loading.value = true
  getCategoryList({ pageNum: 1, pageSize: 1000 }).then(response => {
    const data = response.data || response
    const list = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
    categoryList.value = buildTree(list)
    flatOptions.value = buildFlatOptions(list)
    loading.value = false
  }).catch(error => {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
    loading.value = false
  })
}

/** 构建树形结构 */
function buildTree(list, parentId) {
  const pid = parentId === undefined ? null : parentId
  const result = []
  for (const item of list) {
    const itemPid = (!item.parentId || item.parentId === 0) ? null : item.parentId
    if (itemPid === pid) {
      const children = buildTree(list, item.id)
      if (children.length > 0) item.children = children
      result.push(item)
    }
  }
  return result
}

/** 构建扁平下拉选项（带缩进） */
function buildFlatOptions(list, parentId, depth) {
  const pid = parentId === undefined ? null : parentId
  const dep = depth || 0
  const result = []
  for (const item of list) {
    const itemPid = (!item.parentId || item.parentId === 0) ? null : item.parentId
    if (itemPid === pid) {
      result.push({
        id: item.id,
        label: '\u3000'.repeat(dep) + (dep > 0 ? '└ ' : '') + item.categoryName
      })
      result.push(...buildFlatOptions(list, item.id, dep + 1))
    }
  }
  return result
}

/** 重置表单 */
function resetForm(row) {
  Object.assign(form, {
    id: null,
    parentId: (row && row.id) ? row.id : 0,
    categoryName: '',
    categoryCode: '',
    icon: '',
    sortOrder: 0,
    status: 1
  })
  iconFileList.value = []
  // 清除验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

/** 新增 */
function handleAdd(row) {
  resetForm(row)
  title.value = '添加分类'
  open.value = true
}

/** 修改 */
function handleUpdate(row) {
  getCategoryDetail(row.id).then(response => {
    const data = response.data || response
    Object.assign(form, {
      id: data.id,
      parentId: data.parentId || 0,
      categoryName: data.categoryName || '',
      categoryCode: data.categoryCode || '',
      icon: data.icon || '',
      sortOrder: data.sortOrder || 0,
      status: data.status !== undefined ? data.status : 1
    })
    // 图标回显
    iconFileList.value = form.icon ? [{ name: 'icon', url: form.icon }] : []
    title.value = '修改分类'
    open.value = true
  }).catch(error => {
    console.error('获取分类详情失败:', error)
    ElMessage.error('获取分类信息失败')
  })
}

/** 提交表单 */
async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await submitCategory({ ...form })
    ElMessage.success('操作成功')
    open.value = false
    getList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  }
}

/** 删除 */
function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除分类"' + row.categoryName + '"？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return deleteCategory(row.id)
  }).then(() => {
    getList()
    ElMessage.success('删除成功')
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

/** 图标上传成功 */
function handleIconSuccess(response, file, fileList) {
  if (response.code === 0) {
    const url = response.data?.url || response.data
    file.url = url
    iconFileList.value = fileList.slice(-1)
    form.icon = url
    ElMessage.success('图标上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

/** 移除图标 */
function handleIconRemove() {
  iconFileList.value = []
  form.icon = ''
}

/** 上传失败 */
function handleUploadError(error) {
  console.error('上传失败:', error)
  ElMessage.error('图标上传失败')
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}
</style>
