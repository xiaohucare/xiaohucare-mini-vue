<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="100px">
        <el-form-item label="报名编号" prop="appointmentNo">
          <el-input
            v-model="queryParams.appointmentNo"
            placeholder="请输入报名编号"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="报名人姓名" prop="appointerName">
          <el-input
            v-model="queryParams.appointerName"
            placeholder="请输入报名人姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="报名人电话" prop="appointerPhone">
          <el-input
            v-model="queryParams.appointerPhone"
            placeholder="请输入报名人电话"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="报名日期" prop="appointmentDate">
          <el-date-picker
            v-model="queryParams.appointmentDate"
            type="date"
            placeholder="选择报名日期"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
            <el-option label="待确认" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已取消" :value="2" />
            <el-option label="已登记" :value="3" />
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
          <el-button type="primary" plain icon="Plus" @click="handleAdd" round>新增报名</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" round>修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="appointmentList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="报名编号" align="center" prop="appointmentNo" width="160" />
        <el-table-column label="入住长者" align="center" prop="residentName" width="100" />
        <el-table-column label="意向床位" align="center" prop="bedCount" width="80" />
        <el-table-column label="报名人" align="center" prop="appointerName" />
        <el-table-column label="报名人电话" align="center" prop="appointerPhone" width="120" />
        <el-table-column label="报名日期" align="center" prop="appointmentDate" width="110">
          <template #default="scope">
            <span>{{ parseTime(scope.row.appointmentDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="预计天数" align="center" prop="estimatedDays" width="80" />
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)">查看</el-button>
            <el-button link type="primary" icon="Edit"   v-if="scope.row.status !== 3" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button
              v-if="scope.row.status === 0"
              link
              type="success"
              icon="Check"
              @click="handleConfirm(scope.row)"
            >确认</el-button>
            <el-button
              v-if="scope.row.status === 1"
              link
              type="warning"
              icon="Right"
              @click="handleConvert(scope.row)"
            >转登记</el-button>
            <el-button
              v-if="scope.row.status === 0 || scope.row.status === 1"
              link
              type="danger"
              icon="Close"
              @click="handleCancel(scope.row)"
            >取消</el-button>
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

    <!-- 添加或修改报名对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-divider content-position="left">报名人信息</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="报名人姓名" prop="appointerName">
              <el-input v-model="form.appointerName" placeholder="请输入报名人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名人电话" prop="appointerPhone">
              <el-input v-model="form.appointerPhone" placeholder="请输入报名人电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="与长者关系" prop="appointerRelation">
              <el-input v-model="form.appointerRelation" placeholder="如子女、配偶等" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">入住信息</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="入住长者" prop="residentId">
              <el-select
                v-model="form.residentId"
                placeholder="搜索姓名/编号选择长者档案"
                filterable
                remote
                reserve-keyword
                clearable
                :remote-method="searchResidents"
                :loading="residentLoading"
                style="width:100%"
                @change="handleResidentChange"
              >
                <el-option v-for="r in residentOptions" :key="r.id" :label="`${r.name}（${r.residentNo || '无编号'}）`" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="照护等级需求" prop="careLevelDemand">
              <el-select v-model="form.careLevelDemand" placeholder="请选择" clearable style="width:100%">
                <el-option label="自理" value="自理" />
                <el-option label="半自理" value="半自理" />
                <el-option label="失能" value="失能" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="意向套餐" prop="comboId">
              <el-select v-model="form.comboId" placeholder="请选择康养套餐" clearable filterable style="width:100%" @change="handleComboChange">
                <el-option v-for="pkg in packageList" :key="pkg.id" :label="`${pkg.comboName}（¥${comboDailyPrice(pkg)}/天）`" :value="pkg.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用预估">
              <span v-if="selectedCombo" style="color: #E6A23C; font-weight: 600">
                ¥{{ estimatedFeePreview }}（{{ form.estimatedDays || 0 }}天 × ¥{{ selectedComboDaily }}/天）
              </span>
              <span v-else style="color: #909399">未选择套餐</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="意向床位数" prop="bedCount">
              <el-input-number v-model="form.bedCount" :min="1" :max="10" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别偏好" prop="genderRequired">
              <el-select v-model="form.genderRequired" placeholder="不限" clearable style="width:100%">
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">报名信息</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="报名日期" prop="appointmentDate">
              <el-date-picker
                v-model="form.appointmentDate"
                type="date"
                placeholder="选择报名日期"
                value-format="YYYY-MM-DD"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计天数" prop="estimatedDays">
              <el-input-number v-model="form.estimatedDays" :min="1" :max="365" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">备注信息</el-divider>
        <el-row>
          <el-col :span="24">
            <el-form-item label="特殊需求" prop="specialNeeds">
              <el-input v-model="form.specialNeeds" type="textarea" :rows="2" placeholder="请输入特殊需求（如用药提醒、特殊饮食、护理要求等）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remarks">
              <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" round>确 定</el-button>
          <el-button @click="cancel" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 报名详情对话框 -->
    <el-dialog title="报名详情" v-model="detailOpen" width="600px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报名编号">{{ currentAppointment.appointmentNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(currentAppointment.status)">
            {{ statusLabel(currentAppointment.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入住长者">{{ currentAppointment.residentName }}</el-descriptions-item>
        <el-descriptions-item label="意向床位数">{{ currentAppointment.bedCount }}</el-descriptions-item>
        <el-descriptions-item label="报名人">{{ currentAppointment.appointerName }}</el-descriptions-item>
        <el-descriptions-item label="报名人电话">{{ currentAppointment.appointerPhone }}</el-descriptions-item>
        <el-descriptions-item label="报名日期">{{ currentAppointment.appointmentDate }}</el-descriptions-item>
        <el-descriptions-item label="预计天数">{{ currentAppointment.estimatedDays }}天</el-descriptions-item>
        <el-descriptions-item label="特殊需求" :span="2">{{ currentAppointment.specialNeeds || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentAppointment.remarks || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="currentAppointment.status === 1" type="success" @click="handleConvertFromDetail" round>转登记</el-button>
        <el-button @click="detailOpen = false" round>关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentAppointment">
import { ref, reactive, computed, getCurrentInstance, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAppointmentList, addAppointment, updateAppointment, deleteAppointment, confirmAppointment, cancelAppointment } from '@/api/care/appointment'
import { getPackageList } from '@/api/care/billing'
import { getResidentOptions } from '@/api/residents'
import { resolveComboPrice } from '@/utils/careEnums'

const { proxy } = getCurrentInstance()
const router = useRouter()

const appointmentList = ref([])
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const detailOpen = ref(false)
const currentAppointment = ref({})

// 状态映射辅助函数（后端 Integer: 0/1/2/3）
function statusLabel(status) {
  const map = { 0: '待确认', 1: '已确认', 2: '已取消', 3: '已登记' }
  return map[status] ?? '未知'
}
function statusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] ?? ''
}

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  appointmentNo: undefined,
  appointerName: undefined,
  appointerPhone: undefined,
  appointmentDate: undefined,
  status: undefined
})

// 表单参数
const form = ref({})
const rules = ref({
  appointerName: [{ required: true, message: '报名人姓名不能为空', trigger: 'blur' }],
  appointerPhone: [{ required: true, message: '报名人电话不能为空', trigger: 'blur' }],
  residentId: [{ required: true, message: '请选择入住长者', trigger: 'change' }],
  appointmentDate: [{ required: true, message: '报名日期不能为空', trigger: 'change' }],
  estimatedDays: [{ required: true, message: '预计天数不能为空', trigger: 'blur' }]
})

// 长者档案下拉
const residentOptions = ref([])
const residentLoading = ref(false)

// 意向套餐
const packageList = ref([])
const selectedCombo = ref(null)
// 按年/月/天三价 + 预计天数折算日价（与后端同口径）
function comboDailyPrice(pkg) {
  return resolveComboPrice(pkg, form.value.estimatedDays).dailyPrice
}
const selectedComboDaily = computed(() => (selectedCombo.value ? comboDailyPrice(selectedCombo.value) : 0))
const estimatedFeePreview = computed(() => {
  if (!selectedCombo.value) return 0
  const days = Number(form.value.estimatedDays) || 0
  return (Number(selectedComboDaily.value) || 0) * days
})

// 加载套餐列表
async function loadPackages() {
  try {
    const res = await getPackageList({ chargeKind: 0, pageSize: 999, enabled: true })
    packageList.value = res.data?.list || []
  } catch {
    packageList.value = []
  }
}

// 选择套餐后同步预估费用
function handleComboChange(comboId) {
  selectedCombo.value = packageList.value.find(p => p.id === comboId) || null
}

// 搜索长者档案
async function searchResidents(query) {
  residentLoading.value = true
  try {
    const res = await getResidentOptions(query)
    residentOptions.value = res.data || []
  } catch {
    residentOptions.value = []
  } finally {
    residentLoading.value = false
  }
}

// 选择长者，同步姓名
function handleResidentChange(residentId) {
  const archive = residentOptions.value.find(r => r.id === residentId)
  form.value.residentName = archive ? archive.name : undefined
  if (archive && archive.careLevel && !form.value.careLevelDemand) {
    form.value.careLevelDemand = archive.careLevel
  }
}

// 获取报名列表
function getList() {
  loading.value = true
  getAppointmentList(queryParams).then(response => {
    appointmentList.value = response.data?.list || response.data?.records || []
    total.value = response.data?.totalCount || response.data?.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
    appointmentList.value = []
    total.value = appointmentList.value.length
  })
}

// 搜索
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置
function resetQuery() {
  proxy.resetForm('queryForm')
  handleQuery()
}

// 多选
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 新增
function handleAdd() {
  reset()
  open.value = true
  title.value = '新增报名'
}

// 修改
function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  const appointment = appointmentList.value.find(item => item.id === id)
  if (appointment) {
    form.value = { ...appointment }
    if (appointment.residentId) {
      ensureResidentOption({ id: appointment.residentId, name: appointment.residentName })
    }
    if (appointment.comboId) {
      selectedCombo.value = packageList.value.find(p => p.id === appointment.comboId) || null
    }
    open.value = true
    title.value = '修改报名'
  }
}

function ensureResidentOption(resident) {
  if (!resident || resident.id == null) return
  if (!residentOptions.value.some(r => r.id === resident.id)) {
    residentOptions.value = [...residentOptions.value, resident]
  }
}

// 查看详情
function handleView(row) {
  currentAppointment.value = row
  detailOpen.value = true
}

// 确认报名（状态 0 -> 1）
function handleConfirm(row) {
  proxy.$modal.confirm('确认要通过该报名吗？').then(() => {
    confirmAppointment(row.id).then(() => {
      proxy.$modal.msgSuccess('确认成功')
      getList()
    }).catch(() => {
      proxy.$modal.msgError('确认失败，请重试')
    })
  })
}

// 转为入住登记（状态 1 -> 3）- 报名确认后跳转到登记页面
function handleConvert(row) {
  router.push(`/eyang/checkin/form?appointmentId=${row.id}`)
}

// 详情对话框直接转登记
function handleConvertFromDetail() {
  const id = currentAppointment.value.id
  detailOpen.value = false
  router.push(`/eyang/checkin/form?appointmentId=${id}`)
}

// 取消预约（0/1 -> 2）
function handleCancel(row) {
  proxy.$modal.confirm(`确认取消报名「${row.appointmentNo}」吗？`).then(() => {
    cancelAppointment(row.id).then(() => {
      proxy.$modal.msgSuccess('已取消')
      getList()
    }).catch(() => {
      proxy.$modal.msgError('取消失败，请重试')
    })
  })
}

// 删除
function handleDelete(row) {
  const appointmentIds = row.id ? [row.id] : ids.value
  proxy.$modal.confirm('是否确认删除选中的报名数据？').then(() => {
    deleteAppointment(appointmentIds).then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    }).catch(() => {
      proxy.$modal.msgError('删除失败，请重试')
    })
  })
}

// 表单重置（只保留后端有的字段）
function reset() {
  form.value = {
    id: undefined,
    residentId: undefined,
    residentName: undefined,
    appointerName: undefined,
    appointerPhone: undefined,
    appointerRelation: undefined,
    careLevelDemand: undefined,
    genderRequired: undefined,
    comboId: undefined,
    bedCount: 1,
    appointmentDate: undefined,
    estimatedDays: 1,
    specialNeeds: undefined,
    remarks: undefined
  }
  selectedCombo.value = null
  proxy.resetForm('formRef')
}

// 取消
function cancel() {
  open.value = false
  reset()
}

// 提交表单
function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (valid) {
      if (form.value.id !== undefined) {
        updateAppointment(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        }).catch(() => {
          proxy.$modal.msgError('保存失败，请重试')
        })
      } else {
        addAppointment(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        }).catch(() => {
          proxy.$modal.msgError('保存失败，请重试')
        })
      }
    }
  })
}

onMounted(() => {
  getList()
  searchResidents('')
  loadPackages()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
