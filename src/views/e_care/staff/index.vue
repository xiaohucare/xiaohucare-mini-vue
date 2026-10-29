<template>
  <div class="app-container staff-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.enabled" placeholder="全部" clearable style="width:120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item style="float:right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增人员
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 人员表格 -->
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="staffList" border stripe row-key="id">
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column label="头像" width="70" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.avatar">
              {{ row.name ? row.name.slice(0,1) : '?' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="姓名" prop="name" min-width="100" />
        <el-table-column label="手机号" prop="phone" min-width="130" />
        <el-table-column label="备注/职务" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'" effect="light">
              {{ row.enabled === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link :type="row.enabled === 1 ? 'warning' : 'success'" size="small" @click="handleToggle(row)">
              {{ row.enabled === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column> -->
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑值班人员' : '新增值班人员'"
      width="480px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" maxlength="20" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="20" />
        </el-form-item>
        <el-form-item label="职务备注">
          <el-input v-model="form.remark" placeholder="如：康养师、前台接待等" maxlength="50" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.enabled">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="BoardingStaff">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus } from '@element-plus/icons-vue'
import { getStaffList, submitStaff, deleteStaff, toggleStaff } from '@/api/care/boardingStaff'

const { proxy } = getCurrentInstance()
const router = useRouter()

// ===== 列表 =====
const loading = ref(false)
const staffList = ref([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  name: '',
  enabled: undefined
})

function loadList() {
  loading.value = true
  const params = { ...queryParams }
  if (params.name === '') delete params.name
  if (params.enabled === undefined || params.enabled === '') delete params.enabled
  getStaffList(params).then(res => {
    const data = res.data || {}
    staffList.value = Array.isArray(data.list) ? data.list : Array.isArray(data) ? data : []
    total.value = data.total || staffList.value.length
  }).catch(() => {
    staffList.value = []
    total.value = 0
  }).finally(() => {
    loading.value = false
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  loadList()
}

function handleReset() {
  queryParams.name = ''
  queryParams.enabled = undefined
  queryParams.pageNum = 1
  loadList()
}

// ===== 新增/编辑 =====
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  phone: '',
  remark: '',
  enabled: 1
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

function handleAdd() {
  // 跳转到员工管理页面
  router.push('/store/employee')
}

function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    remark: row.remark || '',
    enabled: row.enabled ?? 1
  })
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, { id: null, name: '', phone: '', remark: '', enabled: 1 })
  formRef.value?.clearValidate()
}

function handleSubmit() {
  formRef.value?.validate(valid => {
    if (!valid) return
    submitLoading.value = true
    submitStaff({ ...form }).then(res => {
      if (res.code === 0) {
        proxy.$modal.msgSuccess(form.id ? '修改成功' : '新增成功')
        dialogVisible.value = false
        loadList()
      } else {
        proxy.$modal.msgError(res.msg || '保存失败')
      }
    }).catch(() => {
      proxy.$modal.msgError('保存失败')
    }).finally(() => {
      submitLoading.value = false
    })
  })
}

// ===== 启用/禁用 =====
function handleToggle(row) {
  const action = row.enabled === 1 ? '禁用' : '启用'
  proxy.$modal.confirm(`确定要${action}【${row.name}】吗？`).then(() => {
    toggleStaff(row.id).then(res => {
      if (res.code === 0) {
        proxy.$modal.msgSuccess(`${action}成功`)
        loadList()
      }
    })
  }).catch(() => {})
}

// ===== 删除 =====
function handleDelete(row) {
  proxy.$modal.confirm(`确定要删除【${row.name}】吗？`).then(() => {
    deleteStaff([row.id]).then(res => {
      if (res.code === 0) {
        proxy.$modal.msgSuccess('删除成功')
        loadList()
      }
    })
  }).catch(() => {})
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.staff-page { padding: 16px; }
.search-card { margin-bottom: 12px; }
.search-card :deep(.el-card__body) { padding: 16px 20px 6px; }
.table-card :deep(.el-card__body) { padding: 16px; }
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
