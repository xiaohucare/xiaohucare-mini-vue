<template>
  <div class="call-records-management">
    <div class="filter-container">
      <el-date-picker
        v-model="listQuery.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px;"
      />
      <el-select v-model="listQuery.callType" placeholder="呼叫类型" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="紧急呼叫" value="紧急呼叫" />
        <el-option label="服务呼叫" value="服务呼叫" />
        <el-option label="亲情呼叫" value="亲情呼叫" />
      </el-select>
      <el-select v-model="listQuery.callStatus" placeholder="呼叫状态" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="已接听" value="已接听" />
        <el-option label="未接听" value="未接听" />
        <el-option label="已挂断" value="已挂断" />
        <el-option label="呼叫中" value="呼叫中" />
      </el-select>
      <el-input
        v-model="listQuery.search"
        placeholder="搜索老人姓名/设备名称"
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
      <el-table-column prop="residentName" label="老人姓名" width="100" />
      <el-table-column prop="deviceName" label="设备名称" width="120" />
      <el-table-column prop="callType" label="呼叫类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getCallTypeTagType(row.callType)">
            {{ row.callType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="callTime" label="呼叫时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.callTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="answerTime" label="接听时间" width="180">
        <template #default="{ row }">
          {{ row.answerTime ? formatDateTime(row.answerTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="结束时间" width="180">
        <template #default="{ row }">
          {{ row.endTime ? formatDateTime(row.endTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="callDuration" label="通话时长" width="100">
        <template #default="{ row }">
          {{ row.callDuration ? formatDuration(row.callDuration) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="callStatus" label="呼叫状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getCallStatusTagType(row.callStatus)">
            {{ row.callStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="responderName" label="接听人" width="100" />
      <el-table-column prop="callContent" label="呼叫内容" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button  size="small" @click="handleView(row)" round>查看</el-button>
          <el-button  size="small" type="primary" @click="handleProcess(row)" v-if="row.callStatus === '呼叫中'" round>处理</el-button>
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

    <!-- 呼叫记录详情对话框 -->
    <el-dialog
      title="呼叫记录详情"
      v-model="detailDialogVisible"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="老人姓名">{{ currentRecord.residentName }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentRecord.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="呼叫类型">
          <el-tag :type="getCallTypeTagType(currentRecord.callType)">
            {{ currentRecord.callType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="呼叫时间">{{ formatDateTime(currentRecord.callTime) }}</el-descriptions-item>
        <el-descriptions-item label="接听时间">{{ currentRecord.answerTime ? formatDateTime(currentRecord.answerTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ currentRecord.endTime ? formatDateTime(currentRecord.endTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="通话时长">{{ currentRecord.callDuration ? formatDuration(currentRecord.callDuration) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="呼叫状态">
          <el-tag :type="getCallStatusTagType(currentRecord.callStatus)">
            {{ currentRecord.callStatus }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="接听人">{{ currentRecord.responderName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="呼叫内容">{{ currentRecord.callContent || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRecord.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false" round>关闭</el-button>
      </template>
    </el-dialog>

    <!-- 处理呼叫对话框 -->
    <el-dialog
      title="处理呼叫"
      v-model="processDialogVisible"
      width="500px"
    >
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理结果">
          <el-select v-model="processForm.callStatus" placeholder="请选择处理结果" style="width: 100%;">
            <el-option label="已接听" value="已接听" />
            <el-option label="已挂断" value="已挂断" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理内容">
          <el-input 
            v-model="processForm.handleContent" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入处理内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="processDialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="handleProcessSubmit" round>确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Pagination from '@/components/Pagination'

// 模拟数据
const mockCallRecords = [
  {
    id: 1,
    deviceId: 2,
    deviceName: '床头呼叫器',
    residentId: 1,
    residentName: '张三',
    callType: '紧急呼叫',
    callTime: '2024-01-20 10:15:30',
    answerTime: '2024-01-20 10:16:05',
    endTime: '2024-01-20 10:18:45',
    callDuration: 135,
    callStatus: '已接听',
    responderId: 1,
    responderName: '李护士',
    callContent: '老人感觉胸闷不适，需要紧急医疗帮助',
    remarks: '已安排医生检查，情况稳定',
    createAt: '2024-01-20 10:19:00'
  },
  {
    id: 2,
    deviceId: 2,
    deviceName: '床头呼叫器',
    residentId: 2,
    residentName: '李四',
    callType: '服务呼叫',
    callTime: '2024-01-20 14:30:15',
    answerTime: '2024-01-20 14:31:20',
    endTime: '2024-01-20 14:33:10',
    callDuration: 110,
    callStatus: '已接听',
    responderId: 2,
    responderName: '王护工',
    callContent: '需要帮助倒水',
    remarks: '已提供服务',
    createAt: '2024-01-20 14:33:30'
  },
  {
    id: 3,
    deviceId: 3,
    deviceName: '公共区域呼叫器',
    residentId: 3,
    residentName: '王五',
    callType: '亲情呼叫',
    callTime: '2024-01-20 16:45:00',
    answerTime: null,
    endTime: null,
    callDuration: null,
    callStatus: '未接听',
    responderId: null,
    responderName: null,
    callContent: '想和家人视频通话',
    remarks: '',
    createAt: '2024-01-20 16:50:00'
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
  callType: '',
  callStatus: ''
})
const detailDialogVisible = ref(false)
const processDialogVisible = ref(false)
const currentRecord = ref({})
const processForm = reactive({
  callStatus: '',
  handleContent: ''
})

// 方法
const getList = async () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    let filteredList = mockCallRecords
    
    if (listQuery.search) {
      filteredList = filteredList.filter(item => 
        item.residentName.includes(listQuery.search) || 
        item.deviceName.includes(listQuery.search)
      )
    }
    
    if (listQuery.callType) {
      filteredList = filteredList.filter(item => 
        item.callType === listQuery.callType
      )
    }
    
    if (listQuery.callStatus) {
      filteredList = filteredList.filter(item => 
        item.callStatus === listQuery.callStatus
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

const handleView = (row) => {
  currentRecord.value = { ...row }
  detailDialogVisible.value = true
}

const handleProcess = (row) => {
  currentRecord.value = { ...row }
  processForm.callStatus = '已接听'
  processForm.handleContent = ''
  processDialogVisible.value = true
}

const handleProcessSubmit = () => {
  if (!processForm.callStatus) {
    ElMessage.warning('请选择处理结果')
    return
  }
  
  // 模拟API调用
  currentRecord.value.callStatus = processForm.callStatus
  if (processForm.callStatus === '已接听') {
    currentRecord.value.answerTime = new Date().toISOString()
    currentRecord.value.endTime = new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2分钟后结束
    currentRecord.value.callDuration = 120
    currentRecord.value.responderName = '当前用户'
  } else {
    currentRecord.value.endTime = new Date().toISOString()
  }
  
  if (processForm.handleContent) {
    currentRecord.value.remarks = processForm.handleContent
  }
  
  processDialogVisible.value = false
  ElMessage.success('处理成功')
}

const getCallTypeTagType = (type) => {
  const typeMap = {
    '紧急呼叫': 'danger',
    '服务呼叫': 'warning',
    '亲情呼叫': 'success'
  }
  return typeMap[type] || ''
}

const getCallStatusTagType = (status) => {
  const statusMap = {
    '已接听': 'success',
    '未接听': 'danger',
    '已挂断': 'info',
    '呼叫中': 'warning'
  }
  return statusMap[status] || ''
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
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