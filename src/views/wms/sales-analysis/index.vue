<template>
  <div class="app-container sales-analysis-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-title">📊 出货数据统计分析</h2>
        <p class="page-desc">多维度透视表：时间 × 产品 / 时间 × 客户，同时支持日期范围和客户筛选</p>
      </div>
      <div class="page-header-right">
        <el-radio-group v-model="rowDimension" size="large" @change="handleDimensionChange">
          <el-radio-button label="product">产品维度</el-radio-button>
          <el-radio-button label="customer">客户维度</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card shadow="hover" class="filter-card">
      <el-form inline>
        <el-form-item label="时间粒度">
          <el-radio-group v-model="timeGranularity" @change="loadData">
            <el-radio-button label="day">按天</el-radio-button>
            <el-radio-button label="month">按月</el-radio-button>
            <el-radio-button label="year">按年</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="loadData"
          />
        </el-form-item>

        <el-form-item label="客户筛选">
          <el-select
            v-model="customerId"
            filterable
            clearable
            placeholder="全部客户"
            style="width: 200px"
            @change="loadData"
          >
            <el-option
              v-for="c in customerList"
              :key="c.id"
              :label="c.customerName + ' (' + c.customerPhone + ')'"
              :value="c.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 汇总卡片 -->
    <el-row :gutter="16" class="summary-cards" v-if="summaryData">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card amount-card">
          <div class="stat-icon">💰</div>
          <div class="stat-body">
            <div class="card-label">出货总额</div>
            <div class="card-value">¥{{ formatMoney(summaryData.totalAmount) }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card quantity-card">
          <div class="stat-icon">📦</div>
          <div class="stat-body">
            <div class="card-label">出货数量</div>
            <div class="card-value">{{ summaryData.totalQuantity || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card order-card">
          <div class="stat-icon">📝</div>
          <div class="stat-body">
            <div class="card-label">订单数</div>
            <div class="card-value">{{ summaryData.orderCount || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card product-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-body">
            <div class="card-label">产品种类</div>
            <div class="card-value">{{ summaryData.productCount || 0 }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 透视表 -->
    <el-card shadow="hover" class="data-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">
              {{ rowDimension === 'product' ? '📦 产品' : '👤 客户' }} × 🕒 时间 透视表
            </span>
            <el-tag size="small" effect="plain" type="info">
              {{ timeGranularityLabel }} &nbsp;|&nbsp; 共 {{ crossTableData.length }} 行 × {{ crossPeriods.length }} 列
            </el-tag>
          </div>
          <div class="header-right">
            <el-tag v-if="customerId" size="small" type="success" effect="dark">
              {{ getCustomerName(customerId) }}
            </el-tag>
            <el-tag v-else size="small" type="info" effect="plain">全部客户</el-tag>
          </div>
        </div>
      </template>

      <el-table
        v-if="crossTableData.length > 0"
        :data="crossTableData"
        border
        stripe
        style="width: 100%"
        show-summary
        :summary-method="getCrossTableSummary"
        :max-height="600"
      >
        <!-- 行维度固定列 -->
        <el-table-column
          :label="rowDimension === 'product' ? '产品名称' : '客户名称'"
          prop="rowName"
          min-width="160"
          fixed="left"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="row-name">{{ row.rowName }}</span>
          </template>
        </el-table-column>

        <!-- 动态时间列 -->
        <el-table-column
          v-for="period in crossPeriods"
          :key="period"
          :label="period"
          min-width="140"
          align="center"
        >
          <template #default="{ row }">
            <template v-if="row[period]?.amount > 0 || row[period]?.quantity > 0">
              <div class="cell-data">
                <div class="cell-amount">¥{{ formatMoney(row[period]?.amount || 0) }}</div>
                <div class="cell-quantity">{{ row[period]?.quantity || 0 }} 件</div>
              </div>
            </template>
            <span v-else class="cell-empty">—</span>
          </template>
        </el-table-column>

        <!-- 合计列 -->
        <el-table-column label="金额合计" width="130" align="right" fixed="right">
          <template #default="{ row }">
            <span class="total-amount">¥{{ formatMoney(row._totalAmount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量合计" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <span class="total-quantity">{{ row._totalQuantity || 0 }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-else-if="!loading"
        :description="'暂无' + (rowDimension === 'product' ? '产品' : '客户') + '统计数据'"
        :image-size="120"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getCustomerTimeCrossStats, getSalesAnalysis } from '@/api/wms/statistics'
import { getCustomerList } from '@/api/wms/customer'

// ---------- 状态 ----------
const loading = ref(false)
const rowDimension = ref('product')   // product | customer
const timeGranularity = ref('month')  // day | month | year
const dateRange = ref([])
const customerId = ref(null)
const customerList = ref([])
const summaryData = ref(null)
const crossTableData = ref([])
const crossPeriods = ref([])

// ---------- 计算属性 ----------
const timeGranularityLabel = computed(() => {
  return { day: '按天', month: '按月', year: '按年' }[timeGranularity.value] || '按月'
})

// ---------- 工具函数 ----------
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 默认查询区间：本月 1 号 ~ 今天（按本地时区取值，避免 toISOString 的 UTC 偏移导致少一天/跨到上月）
function defaultDateRange() {
  const now = new Date()
  return [formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), formatDate(now)]
}

function formatMoney(value) {
  if (!value) return '0.00'
  return parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getCustomerName(id) {
  const c = customerList.value.find(c => c.id === id)
  return c ? c.customerName : '未知客户'
}

// ---------- 加载客户列表 ----------
async function loadCustomers() {
  try {
    const res = await getCustomerList({ pageNum: 1, pageSize: 1000, kind: 0 })
    const data = res.data || res
    customerList.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
  } catch (e) {
    console.error('加载客户失败:', e)
  }
}

// ---------- 加载透视表数据 ----------
async function loadData() {
  loading.value = true
  try {
    const params = {
      timeGranularity: timeGranularity.value,
      crossDimension: rowDimension.value,  // product | customer
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (customerId.value) {
      params.customerId = customerId.value
    }

    // 并行请求：透视数据 + 汇总数据
    const [crossRes, summaryRes] = await Promise.all([
      getCustomerTimeCrossStats(params),
      getSalesAnalysis({
        groupBy: timeGranularity.value,
        startDate: params.startDate,
        endDate: params.endDate,
        customerId: params.customerId
      })
    ])

    const crossData = crossRes.data || crossRes
    const periods = crossData.periods || []
    const rows = crossData.rows || []
    const matrix = crossData.data || {}

    crossPeriods.value = periods
    crossTableData.value = rows.map(row => {
      const rowData = {
        rowId: String(row.id),
        rowName: row.name,
        _totalAmount: 0,
        _totalQuantity: 0
      }
      periods.forEach(period => {
        const cell = matrix[String(row.id)]?.[period] || {}
        rowData[period] = cell
        rowData._totalAmount += parseFloat(cell.amount || 0)
        rowData._totalQuantity += parseFloat(cell.quantity || 0)
      })
      return rowData
    })

    const sData = summaryRes.data || summaryRes
    summaryData.value = sData.summary || {}

  } catch (e) {
    console.error('加载数据失败:', e)
    ElMessage.error('加载数据失败')
    crossTableData.value = []
  } finally {
    loading.value = false
  }
}

// ---------- 维度切换 ----------
function handleDimensionChange() {
  loadData()
}

// ---------- 重置 ----------
function resetQuery() {
  timeGranularity.value = 'month'
  customerId.value = null
  dateRange.value = defaultDateRange()
  loadData()
}

// ---------- 表格底部汇总行 ----------
function getCrossTableSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, idx) => {
    if (idx === 0) {
      sums[idx] = '合 计'
      return
    }
    if (col.label === '金额合计') {
      const total = data.reduce((s, r) => s + (r._totalAmount || 0), 0)
      sums[idx] = '¥' + formatMoney(total)
      return
    }
    if (col.label === '数量合计') {
      const total = data.reduce((s, r) => s + (r._totalQuantity || 0), 0)
      sums[idx] = total + ' 件'
      return
    }
    if (crossPeriods.value.includes(col.label)) {
      const amt = data.reduce((s, r) => s + parseFloat(r[col.label]?.amount || 0), 0)
      const qty = data.reduce((s, r) => s + parseFloat(r[col.label]?.quantity || 0), 0)
      sums[idx] = `¥${formatMoney(amt)}\n${qty.toFixed(0)} 件`
      return
    }
    sums[idx] = ''
  })
  return sums
}

// ---------- 初始化 ----------
onMounted(() => {
  dateRange.value = defaultDateRange()
  loadCustomers()
  loadData()
})
</script>

<style scoped lang="scss">
.sales-analysis-dashboard {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  min-height: 100vh;
}

// ====== 页面标题 ======
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .page-header-left {
    .page-title {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .page-desc {
      margin: 0;
      font-size: 13px;
      color: #909399;
    }
  }
}

// ====== 筛选卡片 ======
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

// ====== 汇总卡片 ======
.summary-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .stat-body {
    .card-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 6px;
    }
    .card-value {
      font-size: 24px;
      font-weight: 700;
    }
  }
}

.amount-card {
  border-left: 4px solid #67c23a;
  background: linear-gradient(135deg, #fff 0%, #f0fdf4 100%);
  .card-value { color: #67c23a; }
}

.quantity-card {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #fff 0%, #ecf5ff 100%);
  .card-value { color: #409eff; }
}

.order-card {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, #fff 0%, #fdf6ec 100%);
  .card-value { color: #e6a23c; }
}

.product-card {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
  .card-value { color: #f56c6c; }
}

// ====== 数据表格卡片 ======
.data-card {
  border-radius: 12px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .card-title {
        font-size: 15px;
        font-weight: 600;
        color: #1a1a1a;
      }
    }
  }
}

// ====== 表格单元格 ======
.row-name {
  font-weight: 500;
  color: #303133;
}

.cell-data {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .cell-amount {
    color: #67c23a;
    font-weight: 600;
    font-size: 13px;
  }

  .cell-quantity {
    color: #909399;
    font-size: 12px;
  }
}

.cell-empty {
  color: #dcdfe6;
  font-size: 16px;
}

.total-amount {
  color: #67c23a;
  font-weight: 700;
  font-size: 13px;
}

.total-quantity {
  color: #409eff;
  font-weight: 700;
}

// ====== 底部汇总行 ======
:deep(.el-table__footer-wrapper) {
  .cell {
    font-weight: 700;
    color: #409eff;
    white-space: pre-line;
    line-height: 1.8;
  }
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}
</style>
