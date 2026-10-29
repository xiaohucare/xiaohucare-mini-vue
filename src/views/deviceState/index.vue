<template>
  <div class="app-container">
    <el-row :gutter="20" class="main-layout">
      <!-- 左侧：图表区域 -->
      <el-col :span="8" class="charts-section">
        <!-- 设备在线率水球图 -->
        <el-card class="chart-card">
          <div class="card-header">
            <h3>设备在线率</h3>
          </div>
          <div class="water-ball-container">
            <div ref="waterBallRef" class="water-ball-chart"></div>
          </div>
        </el-card>
        
        <!-- 设备状态饼图 -->
        <el-card class="chart-card">
          <div class="card-header">
            <h3>设备状态统计</h3>
          </div>
          <div class="pie-chart-container">
            <div ref="pieChartRef" class="pie-chart"></div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧：设备列表区域 -->
      <el-col :span="16" class="table-section">
        <el-card class="table-card">
          <div class="card-header">
            <h3>设备状态列表</h3>
            <div class="header-actions">
              <el-button type="primary" icon="Refresh" @click="getDeviceList" round>刷新</el-button>
            </div>
          </div>
          
          <div class="table-content">
            <el-table
              v-loading="loading"
              :data="deviceList"
              style="width: 100%;height: 650px"
              stripe
              
            >
            <el-table-column prop="id" label="设备ID" width="100" align="center" />
            <el-table-column prop="deviceName" label="设备名称" width="150" show-overflow-tooltip />
            <el-table-column prop="deviceCode" label="设备编码" width="120" show-overflow-tooltip />
            <el-table-column prop="energyType" label="能源类型" width="120" align="center">
              <template #default="scope">
                {{ scope.row.energyType || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="在线状态" width="130" align="center">
              <template #default="scope">
                <el-tag :type="getOnlineStatusType(scope.row.onlineState)">
                  {{ getOnlineStatusText(scope.row.onlineState) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="onlineTime" label="上线时间" width="200">
              <template #default="scope">
                {{ formatDate(scope.row.onlineTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="offlineTime" label="下线时间" width="200">
              <template #default="scope">
                {{ formatDate(scope.row.offlineTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="timeout" label="超时时间" width="120" align="center">
              <template #default="scope">
                {{ scope.row.timeout || '-' }}
              </template>
            </el-table-column>
            </el-table>
    </div>
    
          <!-- 分页组件 -->
          <div class="pagination-container">
            <el-pagination
              :current-page="pagination.curPage"
              :page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.totalCount"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
        </div>
      </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import 'echarts-liquidfill'
import { getDeviceStateList, getDevicePieState } from '@/api/deviceState'

// 响应式数据
const loading = ref(false)
const deviceList = ref([])
const onlineRate = ref(0)
const pieChartData = ref([])

// 图表引用
const waterBallRef = ref()
const pieChartRef = ref()
let waterBallChart = null
let pieChart = null

// 分页参数
const pagination = reactive({
  curPage: 1,
  pageSize: 20,
  totalCount: 0
})

// 获取设备状态列表
const getDeviceList = async () => {
  loading.value = true
  try {
    const params = {
      curPage: pagination.curPage,
      pageSize: pagination.pageSize
    }
    const response = await getDeviceStateList(params)
    deviceList.value = response.data.list || []
    pagination.totalCount = response.data.totalCount || 0
    
    // 更新在线率并刷新水球图
    onlineRate.value = calculateOnlineRate()
    if (waterBallChart) {
      const value = onlineRate.value / 100 // 转换为0-1之间的值
      waterBallChart.setOption({
        series: [
          {
            type: "liquidFill",
            data: [value, value * 0.9, value * 0.8, value * 0.7]
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取设备状态统计数据
const getPieData = async () => {
  try {
    const response = await getDevicePieState()
    // 适配新的数据结构
    pieChartData.value = response.data.stats || []
    initPieChart()
  } catch (error) {
    console.error('获取设备状态统计失败:', error)
  }
}

// 初始化水球图
const initWaterBallChart = () => {
  if (!waterBallRef.value) return
  
  // 确保容器有尺寸
  const container = waterBallRef.value
  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    setTimeout(() => {
      initWaterBallChart()
    }, 100)
    return
  }
  
  waterBallChart = echarts.init(waterBallRef.value)
  
  const value = onlineRate.value / 100 // 转换为0-1之间的值
  
  const option = {
    backgroundColor: "transparent",
    series: [
      {
        type: "liquidFill",
        radius: "80%",
        data: [value, value * 0.9, value * 0.8, value * 0.7],
        label: {
          normal: {
            color: "#16A5B7",
            insideColor: "#ffffff",
            fontSize: 50,
            fontWeight: "bold"
          },
        },
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: '#16A5B7'
              },
              {
                offset: 1,
                color: '#4fdaca'
              }
            ]
          }
        },
        outline: {
          show: true,
          borderDistance: 8,
          itemStyle: {
            borderColor: '#16A5B7',
            borderWidth: 2,
            shadowBlur: 20,
            shadowColor: 'rgba(22, 165, 183, 0.3)'
          }
        },
        backgroundStyle: {
          color: 'rgba(240, 240, 240, 0.1)'
        }
      }
    ]
  }
  
  waterBallChart.setOption(option)
  
  // 监听窗口大小变化
  const resizeHandler = () => {
    if (waterBallChart) {
      waterBallChart.resize()
    }
  }
  window.addEventListener('resize', resizeHandler)
  waterBallChart._resizeHandler = resizeHandler
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value || !pieChartData.value.length) return
  
  pieChart = echarts.init(pieChartRef.value)
  
  // 转换数据格式，适配ECharts饼图
  const echartData = pieChartData.value.map(item => ({
    name: item.name,
    value: item.count
  }))
  
  // 计算设备总数
  const totalCount = echartData.reduce((sum, item) => sum + item.value, 0)
  
  const option = {
    backgroundColor: "transparent",
    title: {
      text: "设备总数",
      subtext: totalCount.toString(),
      left: "center",
      top: "55%",
      textStyle: {
        color: "#3bc4b3",
        fontSize: 30,
        fontWeight: "normal"
      },
      subtextStyle: {
        color: "#3bc4b3",
        fontSize: 28,
        fontWeight: "bold"
      }
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      top: 'top',
      itemGap: 20,
      textStyle: {
        color: '#606266',
        fontSize: 14
      },
      data: echartData.map(item => item.name)
    },
    series: [
      {
        name: "设备状态统计",
        type: "pie",
        radius: ["60%", "80%"],
        center: ['50%', '60%'],
        hoverAnimation: true,
        color: ["#16A5B7", "#ff6b6b", "#ffd93d", "#6bcf7f", "#9c88ff", "#ff9ff3"],
        label: {
          show: true,
          position: 'outside',
          formatter: function (params) {
            return params.name + '\n' + params.value
          },
          textStyle: {
            color: '#606266',
            fontSize: 12
          }
        },
 
        data: echartData,
      },
    ],
  }
  
  pieChart.setOption(option)
}

// 获取在线状态标签类型
const getOnlineStatusType = (status) => {
  const typeMap = {
    1: 'info',    // 未激活
    2: 'warning', // 禁用
    3: 'success', // 在线
    4: 'danger'   // 离线
  }
  return typeMap[status] || 'info'
}

// 获取在线状态文本
const getOnlineStatusText = (status) => {
  const textMap = {
    1: '未激活',
    2: '禁用',
    3: '在线',
    4: '离线'
  }
  return textMap[status] || '未知'
}


// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.curPage = 1
  getDeviceList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.curPage = val
  getDeviceList()
}

// 计算在线率
const calculateOnlineRate = () => {
  if (!deviceList.value.length) return 0
  const onlineCount = deviceList.value.filter(device => device.onlineState === 3).length
  return Math.round((onlineCount / deviceList.value.length) * 100)
}

// 页面初始化
onMounted(async () => {
  await getDeviceList()
  await getPieData()
  
  // 计算在线率
  onlineRate.value = calculateOnlineRate()
  
  // 初始化图表
  await nextTick()
  initWaterBallChart()
})

// 组件销毁时清理
onUnmounted(() => {
  // 清理事件监听器
  if (waterBallChart && waterBallChart._resizeHandler) {
    window.removeEventListener('resize', waterBallChart._resizeHandler)
  }
  
  // 销毁图表实例
  if (waterBallChart) {
    waterBallChart.dispose()
    waterBallChart = null
  }
  
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.module.scss" as vars;

.app-container {
  padding: 20px;
  background: vars.$base-menu-background;
  height: 100%;
  box-sizing: border-box;
}

.main-layout {
  height: 100%;
}

.charts-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  .chart-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex: 1;
    
    .card-header {
      padding: 12px 20px;
      border-bottom: 1px solid #f0f0f0;
      
      h3 {
        font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
        margin: 0;
        position: relative;

        &::before {
          content: "";
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 16px;
          background: linear-gradient(135deg, #16a5b7, #4fdaca);
          border-radius: 2px;
        }
      }
    }
    
    .water-ball-container {
      position: relative;
      height: 300px;
      min-height: 300px;
      
      .water-ball-chart {
        width: 100%;
        height: 100%;
      }
    }
    
    .pie-chart-container {
      height: 300px;
      min-height: 300px;
      
      .pie-chart {
        width: 100%;
        height: 100%;
      }
    }
  }
}

.table-section {
  height: 100%;
  
  .table-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .card-header {
      padding: 12px 20px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
        position: relative;

        &::before {
          content: "";
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 16px;
          background: linear-gradient(135deg, #16a5b7, #4fdaca);
          border-radius: 2px;
        }
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .table-content {
      flex: 1;
      overflow: hidden;
    }
  }
}

.pagination-container {
  padding: 12px 20px;
  display: flex;
  justify-content: center;
}



// 标签样式
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
}

// 分页样式
:deep(.el-pagination) {
  .el-pagination__total {
    color: #606266;
    font-weight: 500;
  }
  
  .btn-prev,
  .btn-next {
    border-radius: 6px;
    border: 1px solid #dcdfe6;
    background: #ffffff;
    color: #606266;
    
    &:hover {
      color: #16A5B7;
      border-color: #16A5B7;
    }
  }
  
  .el-pager li {
    border-radius: 6px;
    margin: 0 2px;
    border: 1px solid #dcdfe6;
    background: #ffffff;
        color: #606266;
    
    &:hover {
      color: #16A5B7;
      border-color: #16A5B7;
    }
    
    &.is-active {
      background: linear-gradient(135deg, #16A5B7 0%, #0d8a9a 100%);
      border-color: #16A5B7;
      color: #ffffff;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    
    .charts-section {
      flex-direction: row;
      height: auto;
      margin-bottom: 20px;
      
      .chart-card {
        flex: 1;
        height: 300px;
      }
    }
    
    .table-section {
      height: auto;
    }
  }
  
  .water-ball-container {
    .water-ball-chart {
      width: 100% !important;
      height: 100% !important;
    }
  }
}
</style>
