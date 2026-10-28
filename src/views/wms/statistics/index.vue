<template>
  <div class="statistics-dashboard" v-loading="loading">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">统计看板</h2>
        <p class="page-subtitle">实时掌握业务数据动态</p>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="date-picker"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="loadStatistics" class="refresh-btn">刷新数据</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card sales-card">
          <div class="card-bg-icon"></div>
          <div class="card-content">
            <div class="card-label">今日销售额</div>
            <div class="card-value">¥{{ formatMoney(statistics.todaySales) }}</div>
            <div class="card-trend" :class="statistics.todayTrend >= 0 ? 'trend-up' : 'trend-down'">
              {{ statistics.todayTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(statistics.todayTrend || 0).toFixed(1) }}%
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card orders-card">
          <div class="card-bg-icon"></div>
          <div class="card-content">
            <div class="card-label">今日订单数</div>
            <div class="card-value">{{ statistics.todayOrders || 0 }}</div>
            <div class="card-footer-text">笔订单</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card warning-card">
          <div class="card-bg-icon"></div>
          <div class="card-content">
            <div class="card-label">库存预警</div>
            <div class="card-value warning">{{ statistics.stockWarning || 0 }}</div>
            <div class="card-footer-text">项商品需补货</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card expiry-card">
          <div class="card-bg-icon"></div>
          <div class="card-content">
            <div class="card-label">即将过期</div>
            <div class="card-value danger">{{ statistics.expiryWarning || 0 }}</div>
            <div class="card-footer-text">30天内过期</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <!-- 销售趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>销售趋势</span>
              <el-tag size="small" type="primary">近7天</el-tag>
            </div>
          </template>
          <div ref="salesChartRef" class="chart-container" />
        </el-card>
      </el-col>

      <!-- 品牌销售排行 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>品牌销售排行</span>
              <el-tag size="small" type="success">TOP 10</el-tag>
            </div>
          </template>
          <div class="ranking-list">
            <div v-for="(item, index) in brandRanking" :key="item.brandId" class="ranking-item">
              <div class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</div>
              <div class="rank-info">
                <div class="rank-name">{{ item.brandName }}</div>
                <div class="rank-meta">
                  <span>{{ item.orderCount || 0 }} 单</span>
                  <span>{{ item.totalQuantity || 0 }} 件</span>
                </div>
              </div>
              <div class="rank-amount">¥{{ formatMoney(item.totalAmount) }}</div>
            </div>
            <el-empty v-if="brandRanking.length === 0" description="暂无数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-section">
      <!-- 商品销售TOP10 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>商品销售TOP10</span>
              <el-tag size="small" type="warning">热销</el-tag>
            </div>
          </template>
          <div class="ranking-list">
            <div v-for="(item, index) in productRanking" :key="item.productId" class="ranking-item">
              <div class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</div>
              <div class="rank-info">
                <div class="rank-name">{{ item.productName }}</div>
                <div class="rank-meta">
                  <el-tag size="small" type="info">{{ getProductTypeText(item.productType) }}</el-tag>
                  <span>{{ item.totalQuantity || 0 }} 件</span>
                </div>
              </div>
              <div class="rank-amount">¥{{ formatMoney(item.totalAmount) }}</div>
            </div>
            <el-empty v-if="productRanking.length === 0" description="暂无数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <!-- 支付方式分布 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>支付方式分布</span>
              <el-tag size="small" type="info">占比</el-tag>
            </div>
          </template>
          <div ref="payMethodChartRef" class="chart-container" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存预警和过期预警 -->
    <el-row :gutter="20" class="warning-section">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-title">
              <span style="color: #E6A23C">库存预警</span>
              <el-badge :value="stockWarningList.length" :max="99" type="warning" />
            </div>
          </template>
          <el-table :data="stockWarningList" stripe max-height="350">
            <el-table-column label="SKU" prop="skuCode" width="110" fixed />
            <el-table-column label="商品名称" prop="skuName" min-width="150" show-overflow-tooltip />
            <el-table-column label="当前" prop="totalStock" width="70" align="center">
              <template #default="{ row }">
                <span class="stock-number">{{ row.totalStock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="预警" prop="warningStock" width="70" align="center">
              <template #default="{ row }">
                <span class="warning-number">{{ row.warningStock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="缺口" width="70" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="danger" effect="plain">{{ row.warningStock - row.totalStock }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="stockWarningList.length === 0" description="库存充足" :image-size="80" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-title">
              <span style="color: #F56C6C">即将过期</span>
              <el-badge :value="expiryWarningList.length" :max="99" type="danger" />
            </div>
          </template>
          <el-table :data="expiryWarningList" stripe max-height="350">
            <el-table-column label="批次" prop="batchNo" width="120" fixed />
            <el-table-column label="商品名称" prop="skuName" min-width="140" show-overflow-tooltip />
            <el-table-column label="库存" prop="stockQuantity" width="70" align="center">
              <template #default="{ row }">
                <span class="stock-number">{{ row.stockQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="过期日期" prop="expiryDate" width="110" />
            <el-table-column label="剩余" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="danger" effect="dark">{{ row.remainingDays }}天</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="expiryWarningList.length === 0" description="暂无过期风险" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getSalesStatistics, getInventoryStatistics, getExpiryWarning, getBrandStatistics } from '@/api/wms/statistics'
import { getStockWarningList } from '@/api/wms/product'

const loading = ref(false)
const dateRange = ref([])
const salesChartRef = ref(null)
const payMethodChartRef = ref(null)
let salesChart = null
let payMethodChart = null

const statistics = reactive({
  todaySales: '0.00',
  todayOrders: 0,
  todayTrend: 0,
  stockWarning: 0,
  expiryWarning: 0
})

const brandRanking = ref([])
const productRanking = ref([])
const stockWarningList = ref([])
const expiryWarningList = ref([])

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMoney(value) {
  if (!value) return '0.00'
  return parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getRankClass(index) {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return 'rank-normal'
}

function getProductTypeText(type) {
  const typeMap = { FOOD: '食品', SUPPLY: '用品', MEDICINE: '药品', TOY: '玩具', SNACK: '零食' }
  return typeMap[type] || type || '-'
}

function handleDateChange() {
  loadStatistics()
}

async function loadStatistics() {
  loading.value = true
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const [salesRes, , expiryRes, brandRes, stockWarningRes] = await Promise.all([
      getSalesStatistics(params),
      getInventoryStatistics(),
      getExpiryWarning(),
      getBrandStatistics(params),
      getStockWarningList()
    ])

    const salesData = salesRes.data || salesRes
    Object.assign(statistics, salesData)

    const brandData = brandRes.data || brandRes
    brandRanking.value = brandData?.brandRanking || []
    productRanking.value = brandData?.productRanking || []

    const stockWarningData = stockWarningRes.data || stockWarningRes
    stockWarningList.value = Array.isArray(stockWarningData) ? stockWarningData : (stockWarningData?.records || stockWarningData?.list || [])

    const expiryWarningData = expiryRes.data || expiryRes
    expiryWarningList.value = Array.isArray(expiryWarningData) ? expiryWarningData : (expiryWarningData?.records || expiryWarningData?.list || [])

    updateSalesChart(salesData?.salesTrend || [])
    updatePayMethodChart(salesData?.payMethodDistribution || {})
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
    stockWarningList.value = []
    expiryWarningList.value = []
    brandRanking.value = []
    productRanking.value = []
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (salesChartRef.value) {
    salesChart = echarts.init(salesChartRef.value)
  }
  if (payMethodChartRef.value) {
    payMethodChart = echarts.init(payMethodChartRef.value)
  }
}

function updateSalesChart(data) {
  if (!salesChart) return
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(item => item.date) },
    yAxis: { type: 'value' },
    series: [{
      name: '销售额',
      type: 'line',
      data: data.map(item => item.amount),
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#409EFF' }
    }]
  }
  salesChart.setOption(option)
}

function updatePayMethodChart(data) {
  if (!payMethodChart) return
  const payMethodMap = { CASH: '现金', WECHAT: '微信', ALIPAY: '支付宝', CARD: '银行卡', MEMBER_CARD: '会员卡' }
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: Object.keys(data).map(key => ({ name: payMethodMap[key] || key, value: data[key] })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  }
  payMethodChart.setOption(option)
}

onMounted(async () => {
  const today = new Date()
  dateRange.value = [formatDate(today), formatDate(today)]
  await nextTick()
  initCharts()
  loadStatistics()
})

onBeforeUnmount(() => {
  salesChart?.dispose()
  payMethodChart?.dispose()
})
</script>

<style scoped lang="scss">
.statistics-dashboard {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .header-left {
    .page-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
    align-items: center;
    .date-picker { width: 280px; }
  }
}

.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 24px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .card-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 12px;
  }

  .card-value {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
    &.warning { color: #e6a23c; }
    &.danger { color: #f56c6c; }
  }

  .card-trend {
    font-size: 13px;
    font-weight: 500;
    &.trend-up { color: #67c23a; }
    &.trend-down { color: #f56c6c; }
  }

  .card-footer-text {
    font-size: 12px;
    color: #c0c4cc;
  }
}

.sales-card { border-left: 4px solid #667eea; }
.orders-card { border-left: 4px solid #f5576c; }
.warning-card { border-left: 4px solid #4facfe; }
.expiry-card { border-left: 4px solid #fa709a; }

.chart-section { margin-bottom: 24px; }

.chart-card {
  border-radius: 12px;
  margin-bottom: 20px;
  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }
  .chart-container { height: 350px; }
}

.ranking-list {
  max-height: 350px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover { background: #e8ecf1; }

  .rank-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    margin-right: 12px;
    flex-shrink: 0;
    &.rank-gold { background: linear-gradient(135deg, #ffd700, #ffed4e); color: #fff; }
    &.rank-silver { background: linear-gradient(135deg, #c0c0c0, #e8e8e8); color: #fff; }
    &.rank-bronze { background: linear-gradient(135deg, #cd7f32, #daa06d); color: #fff; }
    &.rank-normal { background: #e4e7ed; color: #606266; }
  }

  .rank-info {
    flex: 1;
    min-width: 0;
    .rank-name {
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rank-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .rank-amount {
    font-size: 15px;
    font-weight: 700;
    color: #67c23a;
    flex-shrink: 0;
    margin-left: 12px;
  }
}

.warning-section { margin-bottom: 24px; }

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.stock-number { font-weight: 600; color: #409eff; }
.warning-number { font-weight: 600; color: #e6a23c; }

@media (max-width: 768px) {
  .statistics-dashboard { padding: 12px; }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    .header-right {
      width: 100%;
      flex-direction: column;
      .date-picker { width: 100%; }
    }
  }
}
</style>
