<template>
  <div class="app-container">
    <div class="filter-container">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="活动类型管理" name="types">
          <ActivityTypesManagement ref="typesManagement" />
        </el-tab-pane>
        <el-tab-pane label="日常活动管理" name="activities">
          <DailyActivitiesManagement ref="activitiesManagement" />
        </el-tab-pane>
        <el-tab-pane label="活动参与记录" name="participants">
          <ActivityParticipantsManagement ref="participantsManagement" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 数据统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><Collection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.activityTypesCount || 0 }}</div>
              <div class="stat-label">活动类型</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayActivitiesCount || 0 }}</div>
              <div class="stat-label">今日活动</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalParticipantsCount || 0 }}</div>
              <div class="stat-label">总参与人次</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.avgRating || 0 }}</div>
              <div class="stat-label">平均评分</div>
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
            <span>月度活动趋势</span>
          </template>
          <div ref="activityTrendChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>活动类型分布</span>
          </template>
          <div ref="activityTypeChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import ActivityTypesManagement from './components/ActivityTypesManagement.vue'
import DailyActivitiesManagement from './components/DailyActivitiesManagement.vue'
import ActivityParticipantsManagement from './components/ActivityParticipantsManagement.vue'
import { Collection, Calendar, UserFilled, Star } from '@element-plus/icons-vue'

// 模板引用
const activityTrendChartRef = ref(null)
const activityTypeChartRef = ref(null)

// 模拟数据
const mockStatistics = {
  activityTypesCount: 8,
  todayActivitiesCount: 3,
  totalParticipantsCount: 156,
  avgRating: 4.2,
  monthlyTrend: [
    { month: '1月', count: 12 },
    { month: '2月', count: 15 },
    { month: '3月', count: 18 },
    { month: '4月', count: 22 },
    { month: '5月', count: 20 },
    { month: '6月', count: 25 }
  ],
  typeDistribution: [
    { name: '文娱活动', value: 35 },
    { name: '体育锻炼', value: 25 },
    { name: '健康讲座', value: 20 },
    { name: '手工制作', value: 15 },
    { name: '其他', value: 5 }
  ]
}

// 响应式数据
const activeTab = ref('types')
const statistics = reactive({})
const trendChart = ref(null)
const typeChart = ref(null)

// 方法
const handleTabClick = (tab) => {
  activeTab.value = tab.name
}

const loadStatistics = async () => {
  // 模拟API调用
  Object.assign(statistics, mockStatistics)
}

const initCharts = () => {
  // 初始化月度活动趋势图表
  trendChart.value = echarts.init(activityTrendChartRef.value)
  const trendOption = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: statistics.monthlyTrend?.map(item => item.month) || []
    },
    yAxis: { type: 'value' },
    series: [{
      data: statistics.monthlyTrend?.map(item => item.count) || [],
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
  trendChart.value.setOption(trendOption)

  // 初始化活动类型分布图表
  typeChart.value = echarts.init(activityTypeChartRef.value)
  const typeOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      name: '活动类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 20, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: statistics.typeDistribution || []
    }]
  }
  typeChart.value.setOption(typeOption)

  // 响应式调整图表大小
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  trendChart.value && trendChart.value.resize()
  typeChart.value && typeChart.value.resize()
}

// 生命周期
onMounted(() => {
  loadStatistics()
  nextTick(() => {
    initCharts()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart.value && trendChart.value.dispose()
  typeChart.value && typeChart.value.dispose()
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
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon i {
  font-size: 24px;
  color: white;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>