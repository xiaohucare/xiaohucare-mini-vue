<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="类目名称" prop="itemName">
          <el-input v-model="queryParams.itemName" placeholder="请输入类目名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="收费类型" prop="itemType">
          <el-select v-model="queryParams.itemType" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="opt in itemTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费方式" prop="chargeMode">
          <el-select v-model="queryParams.chargeMode" placeholder="请选择" clearable style="width: 160px">
            <el-option v-for="opt in chargeModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" round>新增类目</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" round>修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="类目名称" prop="itemName" align="center" min-width="120">
          <template #default="scope">
            <el-tag :type="getItemTypeColor(scope.row.itemType)" effect="plain">{{ scope.row.itemName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收费类型" prop="itemType" align="center" min-width="110">
          <template #default="scope">
            <el-tag :type="getItemTypeColor(scope.row.itemType)" size="small">{{ getItemTypeLabel(scope.row.itemType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计费方式" prop="chargeMode" align="center" min-width="110">
          <template #default="scope">
            <span>{{ getChargeModeLabel(scope.row.chargeMode) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价(元)" prop="unitPrice" align="center" min-width="100">
          <template #default="scope">
            <span class="price-text">¥ {{ scope.row.unitPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" align="center" width="70" />
        <el-table-column label="状态" prop="status" align="center" width="80">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.status === 1"
              @change="(val) => handleToggle(scope.row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" round>修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" round>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增/修改收费类目对话框 -->
    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="类目名称" prop="itemName">
              <el-input v-model="form.itemName" placeholder="如：基础康养费" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收费类型" prop="itemType">
              <el-select v-model="form.itemType" placeholder="请选择" style="width:100%">
                <el-option v-for="opt in itemTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="计费方式" prop="chargeMode">
              <el-select v-model="form.chargeMode" placeholder="请选择" style="width:100%">
                <el-option v-for="opt in chargeModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元)" prop="unitPrice">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm" round>确 定</el-button>
        <el-button @click="cancel" round>取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PetFeeItems">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { getFeeItemList, addFeeItem, updateFeeItem, deleteFeeItem, toggleFeeItem } from '@/api/care/billing'
import { FEE_CHARGE_MODE_OPTIONS, getChargeModeLabel } from '@/utils/careEnums'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)

// 收费类型选项（对应后端 Integer：0-6）
const itemTypeOptions = [
  { label: '康养基础', value: 0, color: 'primary' },
  { label: '增值服务', value: 1, color: 'success' },
  { label: '餐饮',     value: 2, color: 'warning' },
  { label: '医疗费用', value: 3, color: 'danger' },
  { label: '清洁美容', value: 4, color: 'warning' },
  { label: '损坏赔偿', value: 5, color: 'danger' },
  { label: '其他',     value: 6, color: 'info' }
]

// 计费方式选项（单一来源，与后端 charge_mode 0-5 口径一致）
const chargeModeOptions = FEE_CHARGE_MODE_OPTIONS

const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  itemName: undefined, itemType: undefined, chargeMode: undefined, status: undefined
})

const form = ref({})
const rules = {
  itemName:   [{ required: true, message: '类目名称不能为空', trigger: 'blur' }],
  itemType:   [{ required: true, message: '请选择收费类型', trigger: 'change' }],
  chargeMode: [{ required: true, message: '请选择计费方式', trigger: 'change' }],
  unitPrice:  [{ required: true, message: '单价不能为空', trigger: 'blur' }]
}

// 工具函数
function getItemTypeLabel(type) {
  return itemTypeOptions.find(o => o.value === type)?.label ?? '未知'
}

function getItemTypeColor(type) {
  const map = { 0: 'primary', 1: 'success', 2: 'warning', 3: 'danger', 4: '', 5: 'danger', 6: 'info' }
  return map[type] ?? ''
}

function getList() {
  loading.value = true
  getFeeItemList(queryParams).then(res => {
    list.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryForm'); handleQuery() }
function handleSelectionChange(sel) {
  ids.value = sel.map(i => i.id)
  single.value = sel.length !== 1
  multiple.value = !sel.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增收费类目'
}

function handleUpdate(row) {
  reset()
  form.value = { ...row }
  open.value = true
  title.value = '修改收费类目'
}

function handleToggle(row, val) {
  const newStatus = val ? 1 : 0
  toggleFeeItem(row.id, val).then(() => {
    row.status = newStatus
    proxy.$modal.msgSuccess(val ? '已启用' : '已禁用')
  }).catch(() => {
    row.status = newStatus
    proxy.$modal.msgSuccess(val ? '已启用' : '已禁用')
  })
}

function handleDelete(row) {
  const delIds = row?.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除该收费类目吗？').then(() => {
    deleteFeeItem(delIds).then(() => {
      getList(); proxy.$modal.msgSuccess('删除成功')
    }).catch(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
  })
}

function reset() {
  form.value = { id: undefined, itemName: '', itemType: 0, chargeMode: 0, unitPrice: 0, sortOrder: 0, status: 1 }
  proxy.resetForm?.('formRef')
}

function cancel() { open.value = false; reset() }

function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (!valid) return
    const api = form.value.id ? updateFeeItem : addFeeItem
    api(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
      open.value = false; getList()
    }).catch(() => {
      proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
      open.value = false; getList()
    })
  })
}

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }
.price-text { color: #f56c6c; font-weight: bold; }
</style>
