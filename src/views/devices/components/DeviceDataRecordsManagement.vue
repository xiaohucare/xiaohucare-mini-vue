<template>
  <div class="device-data-records-management">
    <div class="header">
      <h2>设备数据记录管理</h2>
      <div class="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="今日数据记录" :value="todayDataCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="异常数据" :value="abnormalDataCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="设备类型" :value="deviceTypeCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="数据总量" :value="totalDataCount" />
          </el-col>
        </el-row>
      </div>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="demo-form-inline">
        <el-form-item label="设备">
          <el-select v-model="filterForm.deviceId" placeholder="选择设备" clearable>
            <el-option
              v-for="device in deviceList"
              :key="device.id"
              :label="device.deviceName"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型">
          <el-input v-model="filterForm.dataType" placeholder="数据类型" clearable />
        </el-form-item>
        <el-form-item label="采集时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="状态" clearable>
            <el-option label="正常" value="1" />
            <el-option label="异常" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" round>查询</el-button>
          <el-button @click="handleReset" round>重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-section">
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column prop="dataType" label="数据类型" width="120" />
        <el-table-column prop="dataValue" label="数据值" width="120">
          <template #default="{ row }">
            <span>{{ row.dataValue }} {{ row.unit || '' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="collectionTime" label="采集时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.collectionTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)" round>查看</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" round>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 数据详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="数据详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备名称">{{ currentRecord.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="数据类型">{{ currentRecord.dataType }}</el-descriptions-item>
        <el-descriptions-item label="数据值" :span="2">
          {{ currentRecord.dataValue }} {{ currentRecord.unit || '' }}
        </el-descriptions-item>
        <el-descriptions-item label="采集时间">{{ formatDateTime(currentRecord.collectionTime) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRecord.status === 1 ? 'success' : 'danger'">
            {{ currentRecord.status === 1 ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remarks }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false" round>关闭</el-button>
      </template>
    </el-dialog>

    <!-- 数据趋势图表 -->
    <div class="chart-section">
      <el-card>
        <template #header>
          <span>设备数据趋势分析</span>
        </template>
        <div ref="dataTrendChart" style="height: 300px;"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 模拟数据（替换API调用）
const mockDeviceDataRecords = [
  {
    id: 1,
    deviceId: 1,
    deviceName: '走廊监控摄像头',
    dataType: '温度',
    dataValue: 36.5,
    unit: '℃',
    collectionTime: '2024-01-20 10:00:00',
    status: 1,
    remarks: '正常温度数据'
  },
  {
    id: 2,
    deviceId: 2,
    deviceName: '床头呼叫器',
    dataType: '心率',
    dataValue: 75,
    unit: '次/分',
    collectionTime: '2024-01-20 10:05:00',
    status: 1,
    remarks: '正常心率数据'
  },
  {
    id: 3,
    deviceId: 3,
    deviceName: '温度传感器',
    dataType: '湿度',
    dataValue: 45,
    unit: '%',
    collectionTime: '2024-01-20 10:10:00',
    status: 0,
    remarks: '湿度异常'
  }
]

const mockSmartDevices = [
  { id: 1, deviceName: '走廊监控摄像头' },
  { id: 2, deviceName: '床头呼叫器' },
  { id: 3, deviceName: '温度传感器' }
]

// 响应式数据
const filterForm = reactive({
  deviceId: '',
  dataType: '',
  dateRange: [],
  status: ''
})

const tableData = ref([])
const deviceList = ref([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const detailDialogVisible = ref(false)
const currentRecord = ref({})
const dataTrendChartRef = ref(null)

// 统计数据
const todayDataCount = ref(0)
const abnormalDataCount = ref(0)
const deviceTypeCount = ref(0)
const totalDataCount = ref(0)

// 加载设备列表
const loadDeviceList = async () => {
  try {
    deviceList.value = mockSmartDevices
  } catch (error) {
    console.error('加载设备列表失败:', error)
  }
}

// 加载数据记录
const loadDataRecords = async () => {
  try {
    let filteredList = mockDeviceDataRecords
    
    if (filterForm.deviceId) {
      filteredList = filteredList.filter(item => 
        item.deviceId === filterForm.deviceId
      )
    }
    
    if (filterForm.dataType) {
      filteredList = filteredList.filter(item => 
        item.dataType.includes(filterForm.dataType)
      )
    }
    
    if (filterForm.status) {
      filteredList = filteredList.filter(item => 
        item.status.toString() === filterForm.status
      )
    }
    
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      const [startDate, endDate] = filterForm.dateRange
      filteredList = filteredList.filter(item => 
        item.collectionTime >= startDate && item.collectionTime <= endDate
      )
    }
    
    tableData.value = filteredList
    pagination.total = filteredList.length

    // 更新统计数据
    updateStatistics(filteredList)
  } catch (error) {
    console.error('加载数据记录失败:', error)
  }
}

// 更新统计数据
const updateStatistics = (data) => {
  const today = new Date().toISOString().split('T')[0]
  todayDataCount.value = data.filter(item => 
    item.collectionTime && item.collectionTime.startsWith(today)
  ).length
  
  abnormalDataCount.value = data.filter(item => item.status === 0).length
  deviceTypeCount.value = new Set(data.map(item => item.dataType)).size
  totalDataCount.value = data.length
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadDataRecords()
}

// 重置
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    if (Array.isArray(filterForm[key])) {
      filterForm[key] = []
    } else {
      filterForm[key] = ''
    }
  })
  pagination.currentPage = 1
  loadDataRecords()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadDataRecords()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadDataRecords()
}

// 查看详情
const handleView = (record) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

// 删除记录
const handleDelete = async (record) => {
  try {
    await ElMessageBox.confirm('确定要删除这条数据记录吗？', '提示', {
      type: 'warning'
    })
    
    // 模拟删除操作
    const index = tableData.value.findIndex(item => item.id === record.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      pagination.total--
    }
    
    ElMessage.success('删除成功')
    loadDataRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 格式化时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return datetime.replace('T', ' ').substring(0, 19)
}

// 初始化图表
const initChart = () => {
  nextTick(() => {
    if (dataTrendChartRef.value) {
      const chart = echarts.init(dataTrendChartRef.value)
      
      // 模拟数据趋势
      const option = {
        title: {
          text: '设备数据趋势'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['温度', '湿度', '心率']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '温度',
            type: 'line',
            data: [36.5, 36.6, 36.7, 36.8, 36.7, 36.6],
            smooth: true
          },
          {
            name: '湿度',
            type: 'line',
            data: [45, 48, 52, 55, 50, 47],
            smooth: true
          },
          {
            name: '心率',
            type: 'line',
            data: [72, 75, 78, 80, 76, 74],
            smooth: true
          }
        ]
      }
      
      chart.setOption(option)
      
      // 响应式调整
      const handleResize = () => {
        chart.resize()
      }
      window.addEventListener('resize', handleResize)
      
      // 清理事件监听器
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      })
    }
  })
}

// 生命周期
onMounted(() => {
  loadDeviceList()
  loadDataRecords()
  initChart()
})
</script>

<style scoped>
.device-data-records-management {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin-bottom: 20px;
  color: #303133;
}

.filter-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.chart-section {
  margin-top: 30px;
}
</style>