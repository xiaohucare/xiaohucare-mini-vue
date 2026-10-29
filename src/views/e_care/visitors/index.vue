<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon visitors">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayVisitCount || 0 }}</div>
              <div class="stat-label">{{ $t('visitors.todayVisits') }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon outings">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayOutCount || 0 }}</div>
              <div class="stat-label">{{ $t('visitors.currentOutings') }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon visitors-count">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalVisitCount || 0 }}</div>
              <div class="stat-label">{{ $t('visitors.totalVisitors') }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon records">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalOutCount || 0 }}</div>
              <div class="stat-label">{{ $t('visitors.visitRecords') }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 来访趋势图表 -->
    <el-card class="mb-4" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ $t('visitors.recentVisitTrend') }}</span>
          <el-select v-model="chartDays" :placeholder="$t('visitors.selectDays')" style="width: 120px" @change="loadStatistics">
            <el-option v-for="days in [7, 15, 30]" :key="days" :label="$t('visitors.last' + days + 'Days')" :value="days" />
          </el-select>
        </div>
      </template>
      <div ref="chartContainer" style="height: 300px;"></div>
    </el-card>

    <!-- 来访目的分布 -->
    <!-- <el-card class="mb-4" shadow="hover">
      <template #header>
        <span>{{ $t('visitors.visitPurposeDistribution') }}</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <div ref="pieChartContainer" style="height: 300px;"></div>
        </el-col>
        <el-col :span="12">
          <el-table :data="purposeStatsData" style="width: 100%" height="300">
            <el-table-column prop="purpose" :label="$t('visitors.visitPurpose')" />
            <el-table-column prop="count" :label="$t('visitors.count')" align="center" />
            <el-table-column :label="$t('visitors.percentage')" align="center">
              <template #default="scope">
                {{ ((scope.row.count / totalVisits) * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </el-card> -->

    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
      <el-tab-pane :label="$t('visitors.visitRecordsManagement')" name="visitRecords">
        <VisitRecordsManagement v-if="activeTab === 'visitRecords'" />
      </el-tab-pane>
      <el-tab-pane :label="$t('visitors.leaveRecordsManagement')" name="leaveRecords">
        <LeaveRecordsManagement v-if="activeTab === 'leaveRecords'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { getVisitorStatistics } from '@/api/care/visitors'
import VisitRecordsManagement from './components/VisitRecordsManagement.vue'
import LeaveRecordsManagement from './components/LeaveRecordsManagement.vue'
import { User, Location, Document, Notebook } from '@element-plus/icons-vue'

const activeTab = ref('visitRecords')
const statistics = ref({})
const chartDays = ref(7)

// 图表实例
let chartInstance = null
let pieChartInstance = null

// 图表容器引用
const chartContainer = ref(null)
const pieChartContainer = ref(null)

// 计算属性
const purposeStatsData = computed(() => {
  const purposeStats = statistics.value.purposeStats || {}
  return Object.keys(purposeStats).map(purpose => ({
    purpose: purpose,
    count: purposeStats[purpose]
  })).sort((a, b) => b.count - a.count)
})

const totalVisits = computed(() => {
  return purposeStatsData.value.reduce((sum, item) => sum + item.count, 0)
})

// 加载统计数据（卡片 + 趋势）
const loadStatistics = async () => {
  try {
    const response = await getVisitorStatistics({ days: chartDays.value })
    if (response.code === 0 || response.code === 200) {
      statistics.value = response.data || {}
      // 更新图表
      nextTick(() => {
        updateChart()
      })
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 更新折线图（来访 / 外出 双序列）
const updateChart = () => {
  if (!chartContainer.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }

  const trend = statistics.value.trend || []
  const dates = trend.map(t => t.date)
  const visitData = trend.map(t => t.visitCount || 0)
  const outData = trend.map(t => t.outCount || 0)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['来访', '外出']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}人'
      }
    },
    series: [
      {
        name: '来访',
        data: visitData,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        lineStyle: { color: '#409EFF' },
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '外出',
        data: outData,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
          ])
        },
        lineStyle: { color: '#E6A23C' },
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }

  chartInstance.setOption(option)
}

// 更新饼图
const updatePieChart = () => {
  if (!pieChartContainer.value) return
  
  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartContainer.value)
  }
  
  const data = purposeStatsData.value.map(item => ({
    name: item.purpose,
    value: item.count
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [{
      name: '来访目的',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: data
    }]
  }
  
  pieChartInstance.setOption(option)
}

// 处理标签页切换
const handleTabClick = (tab) => {
  activeTab.value = tab.paneName
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
  if (pieChartInstance) {
    pieChartInstance.resize()
  }
}

onMounted(() => {
  loadStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.visitors {
  background: linear-gradient(135deg, #67C23A, #85CE61);
}

.stat-icon.outings {
  background: linear-gradient(135deg, #E6A23C, #EBB563);
}

.stat-icon.visitors-count {
  background: linear-gradient(135deg, #409EFF, #66B1FF);
}

.stat-icon.records {
  background: linear-gradient(135deg, #909399, #A6A9AD);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-4 {
  margin-bottom: 20px;
}
</style>