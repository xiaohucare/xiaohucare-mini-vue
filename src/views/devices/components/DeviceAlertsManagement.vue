<template>
  <div class="device-alerts-management">
    <div class="filter-container">
      <el-button type="primary" @click="handleBatchHandle" icon="edit" :disabled="multipleSelection.length === 0" round>批量处理</el-button>
      <el-date-picker
        v-model="listQuery.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px; margin-left: 10px;"
      />
      <el-select v-model="listQuery.alertType" placeholder="报警类型" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="故障报警" value="故障报警" />
        <el-option label="安全报警" value="安全报警" />
        <el-option label="维护提醒" value="维护提醒" />
        <el-option label="其他" value="其他" />
      </el-select>
      <el-select v-model="listQuery.alertLevel" placeholder="报警级别" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="紧急" value="紧急" />
        <el-option label="高" value="高" />
        <el-option label="中" value="中" />
        <el-option label="低" value="低" />
      </el-select>
      <el-select v-model="listQuery.handledStatus" placeholder="处理状态" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="未处理" value="未处理" />
        <el-option label="处理中" value="处理中" />
        <el-option label="已处理" value="已处理" />
      </el-select>
      <el-input
        v-model="listQuery.search"
        placeholder="搜索设备名称/报警内容"
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
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="deviceName" label="设备名称" width="120" />
      <el-table-column prop="alertType" label="报警类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getAlertTypeTagType(row.alertType)">
            {{ row.alertType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="alertLevel" label="报警级别" width="80">
        <template #default="{ row }">
          <el-tag :type="getAlertLevelTagType(row.alertLevel)">
            {{ row.alertLevel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="alertTime" label="报警时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.alertTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="alertContent" label="报警内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="handledStatus" label="处理状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getHandledStatusTagType(row.handledStatus)">
            {{ row.handledStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handlerName" label="处理人" width="100" />
      <el-table-column prop="handleTime" label="处理时间" width="180">
        <template #default="{ row }">
          {{ row.handleTime ? formatDateTime(row.handleTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="handleResult" label="处理结果" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button  size="small" @click="handleView(row)" round>查看</el-button>
          <el-button  size="small" type="primary" @click="handleHandle(row)" v-if="row.handledStatus !== '已处理'" round>处理</el-button>
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

    <!-- 报警详情对话框 -->
    <el-dialog
      title="设备报警详情"
      v-model="detailDialogVisible"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="设备名称">{{ currentAlert.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="报警类型">
          <el-tag :type="getAlertTypeTagType(currentAlert.alertType)">
            {{ currentAlert.alertType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="报警级别">
          <el-tag :type="getAlertLevelTagType(currentAlert.alertLevel)">
            {{ currentAlert.alertLevel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="报警时间">{{ formatDateTime(currentAlert.alertTime) }}</el-descriptions-item>
        <el-descriptions-item label="报警内容">{{ currentAlert.alertContent }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="getHandledStatusTagType(currentAlert.handledStatus)">
            {{ currentAlert.handledStatus }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentAlert.handlerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentAlert.handleTime ? formatDateTime(currentAlert.handleTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理结果">{{ currentAlert.handleResult || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentAlert.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false" round>关闭</el-button>
        <el-button type="primary" @click="handleHandle(currentAlert)" v-if="currentAlert.handledStatus !== '已处理'" round>处理</el-button>
      </template>
    </el-dialog>

    <!-- 处理报警对话框 -->
    <el-dialog
      :title="batchMode ? '批量处理报警' : '处理报警'"
      v-model="handleDialogVisible"
      width="500px"
    >
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理状态">
          <el-select v-model="handleForm.handledStatus" placeholder="请选择处理状态" style="width: 100%;">
            <el-option label="处理中" value="处理中" />
            <el-option label="已处理" value="已处理" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input 
            v-model="handleForm.handleResult" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入处理结果"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleDialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="handleHandleSubmit" round>确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Pagination from '@/components/Pagination'

// 模拟数据
const mockDeviceAlerts = [
  {
    id: 1,
    deviceId: 3,
    deviceName: '温度传感器',
    alertType: '故障报警',
    alertLevel: '高',
    alertTime: '2024-01-20 09:15:00',
    alertContent: '温度传感器数据异常，连续5分钟无数据上报',
    handledStatus: '未处理',
    handlerId: null,
    handlerName: null,
    handleTime: null,
    handleResult: null,
    remarks: '需要技术人员检查',
    createAt: '2024-01-20 09:15:00'
  },
  {
    id: 2,
    deviceId: 1,
    deviceName: '走廊监控摄像头',
    alertType: '安全报警',
    alertLevel: '紧急',
    alertTime: '2024-01-20 14:30:00',
    alertContent: '检测到异常人员活动，需要人工确认',
    handledStatus: '处理中',
    handlerId: 1,
    handlerName: '张保安',
    handleTime: '2024-01-20 14:35:00',
    handleResult: '已派保安前往查看',
    remarks: '持续监控中',
    createAt: '2024-01-20 14:30:00'
  },
  {
    id: 3,
    deviceId: 2,
    deviceName: '床头呼叫器',
    alertType: '维护提醒',
    alertLevel: '中',
    alertTime: '2024-01-20 16:00:00',
    alertContent: '设备电池电量低于20%，建议更换电池',
    handledStatus: '已处理',
    handlerId: 2,
    handlerName: '李技术员',
    handleTime: '2024-01-20 16:30:00',
    handleResult: '已更换新电池，设备恢复正常',
    remarks: '定期维护完成',
    createAt: '2024-01-20 16:00:00'
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
  dateRange: [],
  alertType: '',
  alertLevel: '',
  handledStatus: ''
})

const detailDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const multipleSelection = ref([])
const currentAlert = ref({})
const batchMode = ref(false)

const handleForm = reactive({
  handledStatus: '',
  handleResult: ''
})

// 方法
const getList = async () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    let filteredList = mockDeviceAlerts
    
    if (listQuery.search) {
      filteredList = filteredList.filter(item => 
        item.deviceName.includes(listQuery.search) || 
        item.alertContent.includes(listQuery.search)
      )
    }
    
    if (listQuery.alertType) {
      filteredList = filteredList.filter(item => 
        item.alertType === listQuery.alertType
      )
    }
    
    if (listQuery.alertLevel) {
      filteredList = filteredList.filter(item => 
        item.alertLevel === listQuery.alertLevel
      )
    }
    
    if (listQuery.handledStatus) {
      filteredList = filteredList.filter(item => 
        item.handledStatus === listQuery.handledStatus
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

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const handleView = (row) => {
  currentAlert.value = { ...row }
  detailDialogVisible.value = true
}

const handleHandle = (row) => {
  currentAlert.value = { ...row }
  batchMode.value = false
  handleForm.handledStatus = row.handledStatus === '未处理' ? '处理中' : '已处理'
  handleForm.handleResult = row.handleResult || ''
  handleDialogVisible.value = true
}

const handleBatchHandle = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要处理的报警')
    return
  }
  batchMode.value = true
  handleForm.handledStatus = '处理中'
  handleForm.handleResult = ''
  handleDialogVisible.value = true
}

const handleHandleSubmit = () => {
  if (!handleForm.handledStatus) {
    ElMessage.warning('请选择处理状态')
    return
  }
  
  if (batchMode.value) {
    // 批量处理
    multipleSelection.value.forEach(selected => {
      const alert = list.value.find(item => item.id === selected.id)
      if (alert) {
        alert.handledStatus = handleForm.handledStatus
        alert.handlerName = '当前用户'
        alert.handleTime = new Date().toISOString()
        if (handleForm.handleResult) {
          alert.handleResult = handleForm.handleResult
        }
      }
    })
    ElMessage.success(`批量处理成功，共处理${multipleSelection.value.length}条报警`)
    multipleSelection.value = []
  } else {
    // 单个处理
    currentAlert.value.handledStatus = handleForm.handledStatus
    currentAlert.value.handlerName = '当前用户'
    currentAlert.value.handleTime = new Date().toISOString()
    if (handleForm.handleResult) {
      currentAlert.value.handleResult = handleForm.handleResult
    }
    ElMessage.success('处理成功')
  }
  
  handleDialogVisible.value = false
}

const getAlertTypeTagType = (type) => {
  const typeMap = {
    '故障报警': 'danger',
    '安全报警': 'warning',
    '维护提醒': 'info',
    '其他': ''
  }
  return typeMap[type] || ''
}

const getAlertLevelTagType = (level) => {
  const levelMap = {
    '紧急': 'danger',
    '高': 'warning',
    '中': 'info',
    '低': ''
  }
  return levelMap[level] || ''
}

const getHandledStatusTagType = (status) => {
  const statusMap = {
    '未处理': 'danger',
    '处理中': 'warning',
    '已处理': 'success'
  }
  return statusMap[status] || ''
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
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
</style>