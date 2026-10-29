<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon income">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.totalIncome || '0.00' }}</div>
              <div class="stat-label">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon arrears">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.totalArrears || '0.00' }}</div>
              <div class="stat-label">欠费总额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon items">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ feeItemsCount }}</div>
              <div class="stat-label">收费项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon payments">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ paidCount }}</div>
              <div class="stat-label">已缴费记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收入趋势图表 -->
    <el-card class="mb-4" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>月度收入趋势</span>
          <el-select v-model="chartYear" placeholder="选择年份" style="width: 120px" @change="loadStatistics">
            <el-option v-for="year in [2023, 2024, 2025]" :key="year" :label="year" :value="year" />
          </el-select>
        </div>
      </template>
      <div ref="chartContainer" style="height: 300px;"></div>
    </el-card>

    <!-- 收费项目类型分布 -->
    <el-card class="mb-4" shadow="hover">
      <template #header>
        <span>收费项目类型分布</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <div ref="pieChartContainer" style="height: 300px;"></div>
        </el-col>
        <el-col :span="12">
          <el-table :data="statistics.feeItemStats" style="width: 100%" height="300">
            <el-table-column prop="type" label="收费类型" />
            <el-table-column prop="amount" label="金额" align="right">
              <template #default="scope">
                ¥{{ scope.row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="count" label="记录数" align="center" />
          </el-table>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getFeeStatistics, getFeeItemsList, getPaymentsList } from '@/api/fee'
import { Money, Warning, Document, SuccessFilled, Collection, List, Wallet } from '@element-plus/icons-vue'

const statistics = ref({})
const chartYear = ref(new Date().getFullYear())
const feeItemsCount = ref(0)
const paidCount = ref(0)

// 图表实例
let chartInstance = null
let pieChartInstance = null

// 图表容器引用
const chartContainer = ref(null)
const pieChartContainer = ref(null)

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await getFeeStatistics({ year: chartYear.value })
    if (response.code === 200) {
      statistics.value = response.data
      
      // 更新图表
      nextTick(() => {
        updateChart()
        updatePieChart()
      })
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载收费项目数量
const loadFeeItemsCount = async () => {
  try {
    const response = await getFeeItemsList({ pageSize: 1 })
    if (response.code === 200) {
      feeItemsCount.value = response.total
    }
  } catch (error) {
    console.error('加载收费项目数量失败:', error)
  }
}

// 加载已缴费记录数量
const loadPaidCount = async () => {
  try {
    const response = await getPaymentsList({ paymentStatus: '已缴', pageSize: 1 })
    if (response.code === 200) {
      paidCount.value = response.total
    }
  } catch (error) {
    console.error('加载已缴费记录数量失败:', error)
  }
}

// 更新折线图
const updateChart = () => {
  if (!chartContainer.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }
  
  const monthlyStats = statistics.value.monthlyStats || {}
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const data = months.map(month => {
    const key = `${chartYear.value}-${month}`
    return monthlyStats[key] || 0
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>收入: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months.map(month => `${chartYear.value}-${month}`),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      data: data,
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      },
      lineStyle: {
        color: '#409EFF'
      },
      itemStyle: {
        color: '#409EFF'
      }
    }]
  }
  
  chartInstance.setOption(option)
}

// 更新饼图
const updatePieChart = () => {
  if (!pieChartContainer.value) return
  
  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartContainer.value)
  }
  
  const feeItemStats = statistics.value.feeItemStats || []
  const data = feeItemStats.map(item => ({
    name: item.type,
    value: item.amount
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [{
      name: '收费类型',
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
  loadFeeItemsCount()
  loadPaidCount()
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

.stat-icon.income {
  background: linear-gradient(135deg, #67C23A, #85CE61);
}

.stat-icon.arrears {
  background: linear-gradient(135deg, #F56C6C, #F78989);
}

.stat-icon.items {
  background: linear-gradient(135deg, #E6A23C, #EBB563);
}

.stat-icon.payments {
  background: linear-gradient(135deg, #409EFF, #66B1FF);
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

.management-links {
  padding: 20px;
}

.management-links h3 {
  margin-bottom: 15px;
  color: #303133;
}

.management-links p {
  margin-bottom: 20px;
  color: #606266;
}

.link-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.link-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.link-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  text-decoration: none;
  color: #303133;
}

.link-icon {
  font-size: 32px;
  margin-bottom: 10px;
  color: #409EFF;
}
</style>