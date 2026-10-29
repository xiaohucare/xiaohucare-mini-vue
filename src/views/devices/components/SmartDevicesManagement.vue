<template>
  <div class="smart-devices-management">
    <div class="filter-container">
      <el-button type="primary" @click="handleCreate" icon="plus" round>新增设备</el-button>
      <el-select v-model="listQuery.deviceTypeId" placeholder="设备类型" clearable style="width: 120px; margin-left: 10px;">
        <el-option v-for="type in deviceTypes" :key="type.id" :label="type.typeName" :value="type.id" />
      </el-select>
      <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 100px; margin-left: 10px;">
        <el-option label="正常" value="正常" />
        <el-option label="故障" value="故障" />
        <el-option label="维护中" value="维护中" />
        <el-option label="停用" value="停用" />
      </el-select>
      <el-input
        v-model="listQuery.search"
        placeholder="搜索设备名称/编码"
        style="width: 220px; margin-left: 10px;"
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
      <el-table-column prop="deviceName" label="设备名称" min-width="120" />
      <el-table-column prop="deviceCode" label="设备编码" width="120" />
      <el-table-column prop="deviceTypeName" label="设备类型" width="100" />
      <el-table-column prop="brand" label="品牌" width="80" />
      <el-table-column prop="model" label="型号" width="100" />
      <el-table-column prop="location" label="安装位置" width="120" />
      <el-table-column prop="ipAddress" label="IP地址" width="120" />
      <el-table-column prop="macAddress" label="MAC地址" width="140" />
      <el-table-column prop="installDate" label="安装日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.installDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="warrantyPeriod" label="保修期(月)" width="100" />
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
          <el-button  size="small" type="info" @click="handleViewData(row)" round>数据</el-button>
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
      width="700px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="form.deviceCode" placeholder="请输入设备编码" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceTypeId">
          <el-select v-model="form.deviceTypeId" placeholder="请选择设备类型" style="width: 100%;">
            <el-option v-for="type in deviceTypes" :key="type.id" :label="type.typeName" :value="type.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌" prop="brand">
          <el-input v-model="form.brand" placeholder="请输入品牌" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ipAddress">
          <el-input v-model="form.ipAddress" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="MAC地址" prop="macAddress">
          <el-input v-model="form.macAddress" placeholder="请输入MAC地址" />
        </el-form-item>
        <el-form-item label="安装日期" prop="installDate">
          <el-date-picker
            v-model="form.installDate"
            type="date"
            placeholder="选择安装日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="保修期(月)" prop="warrantyPeriod">
          <el-input-number v-model="form.warrantyPeriod" :min="0" :max="120" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="正常" value="正常" />
            <el-option label="故障" value="故障" />
            <el-option label="维护中" value="维护中" />
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

    <!-- 设备数据对话框 -->
    <el-dialog
      title="设备数据记录"
      v-model="dataDialogVisible"
      width="900px"
    >
      <DeviceDataRecords :device-id="currentDeviceId" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination'
import DeviceDataRecords from './DeviceDataRecordsManagement.vue'

// 模拟数据
const mockSmartDevices = [
  {
    id: 1,
    deviceTypeId: 1,
    deviceTypeName: '监控摄像头',
    deviceName: '走廊监控摄像头',
    deviceCode: 'CAM-001',
    brand: '海康威视',
    model: 'DS-2CD2345WD-I',
    location: '走廊区域',
    ipAddress: '192.168.1.101',
    macAddress: '00-15-5D-01-23-45',
    installDate: '2023-06-15',
    warrantyPeriod: 24,
    status: '正常',
    remarks: '高清红外监控',
    createAt: '2023-06-15 10:00:00'
  },
  {
    id: 2,
    deviceTypeId: 2,
    deviceTypeName: '呼叫设备',
    deviceName: '床头呼叫器',
    deviceCode: 'CALL-001',
    brand: '松下',
    model: 'KX-T7700',
    location: '101房间',
    ipAddress: '192.168.1.102',
    macAddress: '00-15-5D-01-23-46',
    installDate: '2023-07-20',
    warrantyPeriod: 36,
    status: '正常',
    remarks: '紧急呼叫设备',
    createAt: '2023-07-20 14:30:00'
  },
  {
    id: 3,
    deviceTypeId: 3,
    deviceTypeName: '传感器',
    deviceName: '温度传感器',
    deviceCode: 'SENSOR-001',
    brand: '霍尼韦尔',
    model: 'HTS-100',
    location: '活动室',
    ipAddress: '192.168.1.103',
    macAddress: '00-15-5D-01-23-47',
    installDate: '2023-08-10',
    warrantyPeriod: 12,
    status: '故障',
    remarks: '温度监测设备',
    createAt: '2023-08-10 09:00:00'
  }
]

const mockDeviceTypes = [
  { id: 1, typeName: '监控摄像头' },
  { id: 2, typeName: '呼叫设备' },
  { id: 3, typeName: '传感器' },
  { id: 4, typeName: '医疗设备' },
  { id: 5, typeName: '其他设备' }
]

// 响应式数据
const list = ref([])
const total = ref(0)
const loading = ref(false)
const deviceTypes = ref([])
const listQuery = reactive({
  page: 1,
  limit: 10,
  search: '',
  deviceTypeId: null,
  status: ''
})
const dialogVisible = ref(false)
const dataDialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const currentDeviceId = ref(null)
const formRef = ref()
const form = reactive({
  id: null,
  deviceTypeId: null,
  deviceName: '',
  deviceCode: '',
  brand: '',
  model: '',
  location: '',
  ipAddress: '',
  macAddress: '',
  installDate: '',
  warrantyPeriod: 12,
  status: '正常',
  remarks: ''
})
const rules = reactive({
  deviceName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  deviceCode: [
    { required: true, message: '请输入设备编码', trigger: 'blur' }
  ],
  deviceTypeId: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ]
})

// 方法
const loadDeviceTypes = async () => {
  // 模拟API调用
  deviceTypes.value = mockDeviceTypes
}

const getList = async () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    let filteredList = mockSmartDevices
    
    if (listQuery.search) {
      filteredList = filteredList.filter(item => 
        item.deviceName.includes(listQuery.search) || 
        item.deviceCode.includes(listQuery.search)
      )
    }
    
    if (listQuery.deviceTypeId) {
      filteredList = filteredList.filter(item => 
        item.deviceTypeId === listQuery.deviceTypeId
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
  dialogTitle.value = '新增设备'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑设备'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleViewData = (row) => {
  currentDeviceId.value = row.id
  dataDialogVisible.value = true
}

const handleToggleStatus = async (row) => {
  const action = row.status === '停用' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${action}该设备吗？`, '提示', {
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
          const deviceType = deviceTypes.value.find(type => type.id === form.deviceTypeId)
          list.value[index] = { 
            ...form,
            deviceTypeName: deviceType?.typeName || ''
          }
        }
      } else {
        // 新增
        const deviceType = deviceTypes.value.find(type => type.id === form.deviceTypeId)
        const newItem = {
          id: Date.now(),
          ...form,
          deviceTypeName: deviceType?.typeName || '',
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
    deviceTypeId: null,
    deviceName: '',
    deviceCode: '',
    brand: '',
    model: '',
    location: '',
    ipAddress: '',
    macAddress: '',
    installDate: '',
    warrantyPeriod: 12,
    status: '正常',
    remarks: ''
  })
  formRef.value?.clearValidate()
}

const getStatusTagType = (status) => {
  const statusMap = {
    '正常': 'success',
    '故障': 'danger',
    '维护中': 'warning',
    '停用': 'info'
  }
  return statusMap[status] || ''
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// 生命周期
onMounted(() => {
  loadDeviceTypes()
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}
</style>