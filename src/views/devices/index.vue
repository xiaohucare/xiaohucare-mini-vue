<template>
  <div class="app-container">
    <div class="filter-container">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="设施设备管理" name="facilities">
          <FacilitiesManagement ref="facilitiesManagement" />
        </el-tab-pane>
        <el-tab-pane label="智能设备管理" name="smartDevices">
          <SmartDevicesManagement ref="smartDevicesManagement" />
        </el-tab-pane>
        <el-tab-pane label="监控视频管理" name="surveillance">
          <SurveillanceManagement ref="surveillanceManagement" />
        </el-tab-pane>
        <el-tab-pane label="呼叫记录管理" name="callRecords">
          <CallRecordsManagement ref="callRecordsManagement" />
        </el-tab-pane>
        <el-tab-pane label="设备报警管理" name="deviceAlerts">
          <DeviceAlertsManagement ref="deviceAlertsManagement" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 数据统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.facilitiesCount || 0 }}</div>
              <div class="stat-label">设施设备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.smartDevicesCount || 0 }}</div>
              <div class="stat-label">智能设备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.videosCount || 0 }}</div>
              <div class="stat-label">监控视频</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon><Phone /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayCallsCount || 0 }}</div>
              <div class="stat-label">今日呼叫</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.unhandledAlertsCount || 0 }}</div>
              <div class="stat-label">未处理报警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #8E44AD;">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.normalDevicesRate || 0 }}%</div>
              <div class="stat-label">设备正常率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表展示 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div ref="deviceStatusChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>报警级别统计</span>
          </template>
          <div ref="alertLevelChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>今日呼叫趋势</span>
          </template>
          <div ref="callTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>设备类型分布</span>
          </template>
          <div ref="deviceTypeChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import FacilitiesManagement from './components/FacilitiesManagement.vue'
import SmartDevicesManagement from './components/SmartDevicesManagement.vue'
import SurveillanceManagement from './components/SurveillanceManagement.vue'
import CallRecordsManagement from './components/CallRecordsManagement.vue'
import DeviceAlertsManagement from './components/DeviceAlertsManagement.vue'
import { OfficeBuilding, Cpu, VideoCamera, Phone, Warning, DataAnalysis } from '@element-plus/icons-vue'

// 模拟数据
const mockStatistics = {
  facilitiesCount: 45,
  smartDevicesCount: 120,
  videosCount: 1560,
  todayCallsCount: 23,
  unhandledAlertsCount: 5,
  normalDevicesRate: 95.6,
  deviceStatus: [
    { name: '正常', value: 150 },
    { name: '故障', value: 8 },
    { name: '维护中', value: 5 },
    { name: '停用', value: 2 }
  ],
  alertLevels: [
    { name: '紧急', value: 3 },
    { name: '高', value: 8 },
    { name: '中', value: 15 },
    { name: '低', value: 24 }
  ],
  callTrend: [
    { hour: '08:00', count: 2 },
    { hour: '09:00', count: 5 },
    { hour: '10:00', count: 3 },
    { hour: '11:00', count: 4 },
    { hour: '12:00', count: 2 },
    { hour: '13:00', count: 1 },
    { hour: '14:00', count: 3 },
    { hour: '15:00', count: 2 },
    { hour: '16:00', count: 1 }
  ],
  deviceTypes: [
    { name: '监控设备', value: 35 },
    { name: '呼叫设备', value: 28 },
    { name: '传感器', value: 22 },
    { name: '医疗设备', value: 15 },
    { name: '其他', value: 20 }
  ]
}

// 响应式数据
const activeTab = ref('facilities')
const statistics = ref({})
const deviceStatusChart = ref(null)
const alertLevelChart = ref(null)
const callTrendChart = ref(null)
const deviceTypeChart = ref(null)

// 图表ref引用
const deviceStatusChartRef = ref()
const alertLevelChartRef = ref()
const callTrendChartRef = ref()
const deviceTypeChartRef = ref()

// 方法
const handleTabClick = (tab) => {
  activeTab.value = tab.name
}

const loadStatistics = async () => {
  // 模拟API调用
  statistics.value = mockStatistics
}

const initCharts = () => {
  // 设备状态分布图表
  deviceStatusChart.value = echarts.init(deviceStatusChartRef.value)
  const statusOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      name: '设备状态',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: statistics.value.deviceStatus
    }]
  }
  deviceStatusChart.value.setOption(statusOption)

  // 报警级别统计图表
  alertLevelChart.value = echarts.init(alertLevelChartRef.value)
  const alertOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: statistics.value.alertLevels.map(item => item.name)
    },
    yAxis: { type: 'value' },
    series: [{
      data: statistics.value.alertLevels.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: function(params) {
          const colors = ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A']
          return colors[params.dataIndex] || '#909399'
        }
      }
    }]
  }
  alertLevelChart.value.setOption(alertOption)

  // 今日呼叫趋势图表
  callTrendChart.value = echarts.init(callTrendChartRef.value)
  const callOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: statistics.value.callTrend.map(item => item.hour)
    },
    yAxis: { type: 'value' },
    series: [{
      data: statistics.value.callTrend.map(item => item.count),
      type: 'line',
      smooth: true,
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      }
    }]
  }
  callTrendChart.value.setOption(callOption)

  // 设备类型分布图表
  deviceTypeChart.value = echarts.init(deviceTypeChartRef.value)
  const typeOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      name: '设备类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: statistics.value.deviceTypes
    }]
  }
  deviceTypeChart.value.setOption(typeOption)

  // 响应式调整图表大小
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  deviceStatusChart.value && deviceStatusChart.value.resize()
  alertLevelChart.value && alertLevelChart.value.resize()
  callTrendChart.value && callTrendChart.value.resize()
  deviceTypeChart.value && deviceTypeChart.value.resize()
}

const cleanupCharts = () => {
  window.removeEventListener('resize', handleResize)
  deviceStatusChart.value && deviceStatusChart.value.dispose()
  alertLevelChart.value && alertLevelChart.value.dispose()
  callTrendChart.value && callTrendChart.value.dispose()
  deviceTypeChart.value && deviceTypeChart.value.dispose()
}

// 生命周期
onMounted(() => {
  loadStatistics()
  nextTick(() => {
    initCharts()
  })
})

onUnmounted(() => {
  cleanupCharts()
})
</script>

<style scoped>
.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-icon i {
  font-size: 20px;
  color: white;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 3px;
}
</style>