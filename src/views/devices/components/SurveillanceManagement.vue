<template>
  <div class="surveillance-management">
    <div class="filter-container">
      <el-date-picker
        v-model="listQuery.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px;"
      />
      <el-select v-model="listQuery.storageLocation" placeholder="存储位置" clearable style="width: 120px; margin-left: 10px;">
        <el-option label="本地" value="本地" />
        <el-option label="云端" value="云端" />
      </el-select>
      <el-input
        v-model="listQuery.search"
        placeholder="搜索视频名称"
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
      <el-table-column prop="videoName" label="视频名称" min-width="150" />
      <el-table-column prop="deviceName" label="设备名称" width="120" />
      <el-table-column label="录制时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.recordingStartTime) }} - {{ formatTime(row.recordingEndTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="时长(秒)" width="100">
        <template #default="{ row }">
          {{ formatDuration(row.duration) }}
        </template>
      </el-table-column>
      <el-table-column prop="fileSize" label="文件大小" width="100">
        <template #default="{ row }">
          {{ formatFileSize(row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="storageLocation" label="存储位置" width="80">
        <template #default="{ row }">
          <el-tag :type="row.storageLocation === '云端' ? 'success' : 'info'">
            {{ row.storageLocation }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="retentionPeriod" label="保留期限(天)" width="120" />
      <el-table-column prop="accessCount" label="访问次数" width="100" />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button  size="small" type="primary" @click="handlePlay(row)" round>播放</el-button>
          <el-button  size="small" type="danger" @click="handleDelete(row)" round>删除</el-button>
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

    <!-- 视频播放对话框 -->
    <el-dialog
      title="监控视频播放"
      v-model="playDialogVisible"
      width="800px"
    >
      <div class="video-player">
        <video :src="currentVideoUrl" controls style="width: 100%; max-height: 400px;">
          您的浏览器不支持视频播放
        </video>
        <div class="video-info" style="margin-top: 15px;">
          <p><strong>视频名称：</strong>{{ currentVideoInfo.videoName }}</p>
          <p><strong>录制时间：</strong>{{ formatDateTime(currentVideoInfo.recordingStartTime) }}</p>
          <p><strong>设备名称：</strong>{{ currentVideoInfo.deviceName }}</p>
          <p><strong>文件大小：</strong>{{ formatFileSize(currentVideoInfo.fileSize) }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="playDialogVisible = false" round>关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination'

// 模拟数据
const mockSurveillanceVideos = [
  {
    id: 1,
    deviceId: 1,
    deviceName: '走廊监控摄像头',
    videoName: '走廊区域-20240120-080000',
    filePath: '/videos/corridor-20240120-080000.mp4',
    fileSize: 1024000,
    duration: 3600,
    recordingStartTime: '2024-01-20 08:00:00',
    recordingEndTime: '2024-01-20 09:00:00',
    storageLocation: '本地',
    retentionPeriod: 30,
    accessCount: 15,
    remarks: '日常监控录像',
    createAt: '2024-01-20 09:05:00'
  },
  {
    id: 2,
    deviceId: 1,
    deviceName: '走廊监控摄像头',
    videoName: '走廊区域-20240120-140000',
    filePath: '/videos/corridor-20240120-140000.mp4',
    fileSize: 1536000,
    duration: 5400,
    recordingStartTime: '2024-01-20 14:00:00',
    recordingEndTime: '2024-01-20 15:30:00',
    storageLocation: '云端',
    retentionPeriod: 30,
    accessCount: 8,
    remarks: '下午活动监控',
    createAt: '2024-01-20 15:35:00'
  },
  {
    id: 3,
    deviceId: 2,
    deviceName: '大门监控摄像头',
    videoName: '大门区域-20240120-100000',
    filePath: '/videos/gate-20240120-100000.mp4',
    fileSize: 768000,
    duration: 1800,
    recordingStartTime: '2024-01-20 10:00:00',
    recordingEndTime: '2024-01-20 10:30:00',
    storageLocation: '本地',
    retentionPeriod: 30,
    accessCount: 22,
    remarks: '访客进出记录',
    createAt: '2024-01-20 10:35:00'
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
  storageLocation: ''
})

const playDialogVisible = ref(false)
const currentVideoUrl = ref('')
const currentVideoInfo = ref({})

// 方法
const getList = async () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    let filteredList = mockSurveillanceVideos
    
    if (listQuery.search) {
      filteredList = filteredList.filter(item => 
        item.videoName.includes(listQuery.search)
      )
    }
    
    if (listQuery.storageLocation) {
      filteredList = filteredList.filter(item => 
        item.storageLocation === listQuery.storageLocation
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

const handlePlay = (row) => {
  currentVideoInfo.value = { ...row }
  // 模拟视频URL，实际项目中应该是真实的视频文件路径
  currentVideoUrl.value = `https://example.com/videos/${row.videoName}.mp4`
  playDialogVisible.value = true
  
  // 增加访问次数
  row.accessCount += 1
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该监控视频吗？', '提示', {
      type: 'warning'
    })
    
    // 模拟API调用
    const index = list.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      list.value.splice(index, 1)
      total.value -= 1
    }
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

const formatTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleTimeString()
}

const formatDuration = (seconds) => {
  if (!seconds) return '0秒'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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

.video-player {
  text-align: center;
}

.video-info {
  text-align: left;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.video-info p {
  margin: 5px 0;
}
</style>