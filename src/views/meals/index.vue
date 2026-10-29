<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon today-meals">
              <el-icon><Food /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayMeals || 0 }}</div>
              <div class="stat-label">今日供餐</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon satisfaction">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.avgSatisfaction || 0 }}%</div>
              <div class="stat-label">平均满意度</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon menu-count">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.activeMenus || 0 }}</div>
              <div class="stat-label">有效菜单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon feedback">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.feedbackCount || 0 }}</div>
              <div class="stat-label">反馈意见</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <!-- <el-row :gutter="20" class="mb-4">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>月度供餐趋势</span>
          </template>
          <v-chart :option="mealsTrendOption" style="height: 300px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>满意度分布</span>
          </template>
          <v-chart :option="satisfactionOption" style="height: 300px" />
        </el-card>
      </el-col>
    </el-row> -->

    <!-- 标签页切换 -->
    <el-card shadow="hover">
      <template #header>
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
           <el-tab-pane label="餐饮记录管理" name="records">
            <template #label>
              <span><el-icon><Document /></el-icon> 餐饮记录管理</span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="餐饮套餐管理" name="packages">
            <template #label>
              <span><el-icon><Box /></el-icon> 餐饮套餐管理</span>
            </template>
          </el-tab-pane>
           <el-tab-pane label="餐饮菜单管理" name="menus">
            <template #label>
              <span><el-icon><Notebook /></el-icon> 餐饮菜单管理</span>
            </template>
          </el-tab-pane>
         
        </el-tabs>
      </template>

      <!-- 动态组件 -->
      <component :is="currentComponent" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMealsStatistics } from '@/api/meals'
import MealsMenusManagement from './components/MealsMenusManagement.vue'
import MealsPackageManagement from './components/MealsPackageManagement.vue'
import MealsRecordsManagement from './components/MealsRecordsManagement.vue'
import { Food, Star, Notebook, ChatDotRound, Document, Box } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

// 响应式数据
const activeTab = ref('records')
const statistics = ref({})

// 计算属性
const currentComponent = computed(() => {
  if (activeTab.value === 'menus') return MealsMenusManagement
  if (activeTab.value === 'packages') return MealsPackageManagement
  return MealsRecordsManagement
})

// 图表配置
const mealsTrendOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['早餐', '午餐', '晚餐', '加餐']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '早餐',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '午餐',
      type: 'line',
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: '晚餐',
      type: 'line',
      data: [150, 232, 201, 154, 190, 330, 410]
    },
    {
      name: '加餐',
      type: 'line',
      data: [320, 332, 301, 334, 390, 330, 320]
    }
  ]
})

const satisfactionOption = ref({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '满意度',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 335, name: '很满意' },
        { value: 310, name: '满意' },
        { value: 234, name: '一般' },
        { value: 135, name: '不满意' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
})

// 方法
const handleTabClick = (tab) => {
  activeTab.value = tab.paneName
}

const loadStatistics = async () => {
  try {
    // const response = await getMealsStatistics()
    // statistics.value = response.data || {}
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.stat-icon.today-meals {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
}

.stat-icon.satisfaction {
  background: linear-gradient(45deg, #feca57, #ff9ff3);
}

.stat-icon.menu-count {
  background: linear-gradient(45deg, #48dbfb, #0abde3);
}

.stat-icon.feedback {
  background: linear-gradient(45deg, #1dd1a1, #10ac84);
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

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-tabs__item i) {
  margin-right: 8px;
}
</style>