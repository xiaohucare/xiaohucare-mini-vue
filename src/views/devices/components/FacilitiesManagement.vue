<template>
  <div class="facilities-management">
    <div class="filter-container">
      <el-button type="primary" @click="handleCreate" icon="plus" round>新增设施</el-button>
      <el-select v-model="listQuery.facilityType" placeholder="设施类型" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="娱乐设施" value="娱乐设施" />
        <el-option label="医疗设备" value="医疗设备" />
        <el-option label="生活设施" value="生活设施" />
        <el-option label="安全设备" value="安全设备" />
        <el-option label="其他" value="其他" />
      </el-select>
      <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 100px; margin-left: 10px;">
        <el-option label="正常" value="正常" />
        <el-option label="维修中" value="维修中" />
        <el-option label="停用" value="停用" />
      </el-select>
      <el-input
        v-model="listQuery.search"
        placeholder="搜索设施名称"
        style="width: 200px; margin-left: 10px;"
        @keyup.enter="handleFilter"
      >
        <template #append>
          <el-button @click="handleFilter" icon="search" round></el-button>
        </template>
      </el-input>
    </div>

    <el-table
      :data="list"
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="facilityName" label="设施名称" min-width="120" />
      <el-table-column prop="facilityType" label="设施类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.facilityType)">
            {{ row.facilityType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="位置" width="120" />
      <el-table-column prop="purchaseDate" label="购买日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.purchaseDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="warrantyPeriod" label="保修期(月)" width="100" />
      <el-table-column prop="maintenanceCycle" label="维护周期(天)" width="100" />
      <el-table-column prop="lastMaintenanceDate" label="上次维护" width="120">
        <template #default="{ row }">
          {{ formatDate(row.lastMaintenanceDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="nextMaintenanceDate" label="下次维护" width="120">
        <template #default="{ row }">
          <span :class="{ 'warning-text': isMaintenanceDue(row.nextMaintenanceDate) }">
            {{ formatDate(row.nextMaintenanceDate) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button  size="small" @click="handleEdit(row)" round>编辑</el-button>
          <el-button  size="small" type="success" @click="handleMaintenance(row)" round>维护</el-button>
          <el-button 
             size="small" 
            :type="row.status === '停用' ? 'success' : 'danger'" 
            @click="handleToggleStatus(row)"
            round
          >
            {{ row.status === '停用' ? '启用' : '停用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination 
      v-show="total > 0"
      :total="total"
      v-model:page="listQuery.page"
      v-model:limit="listQuery.limit"
      @pagination="getList"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="设施名称" prop="facilityName">
          <el-input v-model="form.facilityName" placeholder="请输入设施名称" />
        </el-form-item>
        <el-form-item label="设施类型" prop="facilityType">
          <el-select v-model="form.facilityType" placeholder="请选择设施类型" style="width: 100%;">
            <el-option label="娱乐设施" value="娱乐设施" />
            <el-option label="医疗设备" value="医疗设备" />
            <el-option label="生活设施" value="生活设施" />
            <el-option label="安全设备" value="安全设备" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入设施位置" />
        </el-form-item>
        <el-form-item label="购买日期" prop="purchaseDate">
          <el-date-picker
            v-model="form.purchaseDate"
            type="date"
            placeholder="选择购买日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="保修期(月)" prop="warrantyPeriod">
          <el-input-number v-model="form.warrantyPeriod" :min="0" :max="120" />
        </el-form-item>
        <el-form-item label="维护周期(天)" prop="maintenanceCycle">
          <el-input-number v-model="form.maintenanceCycle" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="正常" value="正常" />
            <el-option label="维修中" value="维修中" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="form.remarks" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" round>确认</el-button>
      </template>
    </el-dialog>

    <!-- 维护记录对话框 -->
    <el-dialog
      title="设施维护记录"
      v-model="maintenanceDialogVisible"
      width="800px"
    >
      <FacilityMaintenanceRecords :facility-id="currentFacilityId" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination'
import FacilityMaintenanceRecords from './FacilityMaintenanceRecords.vue'

// 模拟数据
const mockFacilities = [
  {
    id: 1,
    facilityName: '康复训练器材',
    facilityType: '医疗设备',
    location: '康复训练室',
    purchaseDate: '2023-05-15',
    warrantyPeriod: 24,
    maintenanceCycle: 90,
    lastMaintenanceDate: '2024-01-10',
    nextMaintenanceDate: '2024-04-10',
    status: '正常',
    remarks: '定期维护保养',
    createAt: '2023-05-15 10:00:00'
  },
  {
    id: 2,
    facilityName: '监控摄像头',
    facilityType: '安全设备',
    location: '走廊区域',
    purchaseDate: '2023-08-20',
    warrantyPeriod: 36,
    maintenanceCycle: 180,
    lastMaintenanceDate: '2024-01-05',
    nextMaintenanceDate: '2024-07-05',
    status: '正常',
    remarks: '高清监控设备',
    createAt: '2023-08-20 14:30:00'
  },
  {
    id: 3,
    facilityName: '电梯设备',
    facilityType: '生活设施',
    location: '主楼电梯',
    purchaseDate: '2022-12-10',
    warrantyPeriod: 12,
    maintenanceCycle: 30,
    lastMaintenanceDate: '2024-01-15',
    nextMaintenanceDate: '2024-02-15',
    status: '维修中',
    remarks: '定期安全检查',
    createAt: '2022-12-10 09:00:00'
  }
]

// 响应式数据
const list = ref([])
const total = ref(0)
const loading = ref(false)
const listQuery = reactive({
  page: 1,
  limit: 10,
  search: '',
  facilityType: '',
  status: ''
})
const dialogVisible = ref(false)
const maintenanceDialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const currentFacilityId = ref(null)
const formRef = ref()
const form = reactive({
  id: null,
  facilityName: '',
  facilityType: '',
  location: '',
  purchaseDate: '',
  warrantyPeriod: 12,
  maintenanceCycle: 30,
  status: '正常',
  remarks: ''
})
const rules = reactive({
  facilityName: [
    { required: true, message: '请输入设施名称', trigger: 'blur' }
  ],
  facilityType: [
    { required: true, message: '请选择设施类型', trigger: 'change' }
  ]
})

// 方法
const getList = async () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    let filteredList = mockFacilities
    
    if (listQuery.search) {
      filteredList = filteredList.filter(item => 
        item.facilityName.includes(listQuery.search)
      )
    }
    
    if (listQuery.facilityType) {
      filteredList = filteredList.filter(item => 
        item.facilityType === listQuery.facilityType
      )
    }
    
    if (listQuery.status) {
      filteredList = filteredList.filter(item => 
        item.status === listQuery.status
      )
    }
    
    list.value = filteredList
    total.value = filteredList.length
    loading.value = false
  }, 500)
}

const handleFilter = () => {
  listQuery.page = 1
  getList()
}

const handleCreate = () => {
  dialogTitle.value = '新增设施'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑设施'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleMaintenance = (row) => {
  currentFacilityId.value = row.id
  maintenanceDialogVisible.value = true
}

const handleToggleStatus = async (row) => {
  const action = row.status === '停用' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${action}该设施吗？`, '提示', {
      type: 'warning'
    })
    // 模拟API调用
    row.status = row.status === '停用' ? '正常' : '停用'
    ElMessage.success(`${action}成功`)
  } catch {
    // 用户取消操作
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 模拟API调用
    setTimeout(() => {
      if (form.id) {
        // 编辑
        const index = list.value.findIndex(item => item.id === form.id)
        if (index !== -1) {
          list.value[index] = { ...form }
        }
      } else {
        // 新增
        const newItem = {
          id: Date.now(),
          ...form,
          lastMaintenanceDate: null,
          nextMaintenanceDate: null,
          createAt: new Date().toISOString()
        }
        list.value.unshift(newItem)
      }
      
      submitting.value = false
      dialogVisible.value = false
      ElMessage.success(form.id ? '编辑成功' : '新增成功')
    }, 500)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    facilityName: '',
    facilityType: '',
    location: '',
    purchaseDate: '',
    warrantyPeriod: 12,
    maintenanceCycle: 30,
    status: '正常',
    remarks: ''
  })
  formRef.value?.clearValidate()
}

const getTypeTagType = (type) => {
  const typeMap = {
    '娱乐设施': 'success',
    '医疗设备': 'warning',
    '生活设施': 'info',
    '安全设备': 'danger',
    '其他': ''
  }
  return typeMap[type] || ''
}

const getStatusTagType = (status) => {
  const statusMap = {
    '正常': 'success',
    '维修中': 'warning',
    '停用': 'danger'
  }
  return statusMap[status] || ''
}

const isMaintenanceDue = (date) => {
  if (!date) return false
  const nextDate = new Date(date)
  const today = new Date()
  const diffTime = nextDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7 // 7天内需要维护
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// 生命周期
onMounted(() => {
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}

.warning-text {
  color: #e6a23c;
  font-weight: bold;
}
</style>