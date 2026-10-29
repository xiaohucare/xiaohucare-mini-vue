<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon size="24" color="#409EFF"><DocumentChecked /></el-icon>
        <span class="page-title">费用结算</span>
        <span class="page-subtitle">退住结算单管理（收款 / 退押金）</span>
      </div>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryFormRef" inline>
           <el-form-item label="结算状态">
          <el-radio-group v-model="queryParams.settledStatus" @change="handleStatusChange">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button :label="0">未结算</el-radio-button>
            <el-radio-button :label="1">待结算</el-radio-button>
            <el-radio-button :label="2">已结算</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="登记单号" prop="checkinNo">
          <el-input v-model="queryParams.checkinNo" placeholder="请输入登记单号" clearable style="width:160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="长者姓名" prop="residentName">
          <el-input v-model="queryParams.residentName" placeholder="请输入长者姓名" clearable style="width:130px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="queryParams.contactPhone" placeholder="请输入联系电话" clearable style="width:140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="结算日期">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleDateChange"
          />
        </el-form-item>
     
        <el-form-item>
          <el-button type="primary" @click="handleQuery"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetQuery"><el-icon><Refresh /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card stat-card--blue" shadow="hover" @click="handleStatCardClick('all')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon size="28"><List /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalCount }}</div>
              <div class="stat-label">累计结算单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card--green" shadow="hover" @click="handleStatCardClick('settled')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon size="28"><Money /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.totalAmount }}</div>
              <div class="stat-label">累计结算金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card--orange" shadow="hover" @click="handleStatCardClick('pending')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon size="28"><Clock /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingCount }}</div>
              <div class="stat-label">待结算</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card--purple" shadow="hover" @click="handleStatCardClick('today')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon size="28"><TrendCharts /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.todayAmount }}</div>
              <div class="stat-label">今日结算</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 订单列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>结算单列表</span>
        </div>
      </template>
      <el-table v-loading="loading" :data="orderList" stripe border>
        <el-table-column label="登记单号" prop="checkinNo" width="150" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">{{ row.checkinNo }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="住养信息" min-width="160" align="center">
          <template #default="{ row }">
            <div class="owner-info">
              <div class="owner-name">{{ row.residentName }}</div>
              <div class="owner-phone">{{ row.contactPhone }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="入住日期" prop="checkinDate" min-width="100" />
        <el-table-column label="离店日期" prop="checkoutDate" min-width="100">
          <template #default="{ row }">
            <span v-if="row.checkoutDate">{{ row.checkoutDate }}</span>
            <span v-else style="color: #909399">待定</span>
          </template>
        </el-table-column>
        <el-table-column label="床位" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.roomName ? row.roomName + '·' : '' }}{{ row.bedNo || '未分配' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实际天数" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.estimatedDays" style="color: #409EFF; font-weight: 600">{{ row.estimatedDays }}天</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="押金合计" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.totalDeposit" style="color: #E6A23C">¥{{ row.totalDeposit }}</span>
            <span v-else style="color: #909399">¥0</span>
          </template>
        </el-table-column>
        <el-table-column label="应收金额" width="110" align="right">
          <template #default="{ row }">
            <span v-if="row.settledFinalAmount !== undefined && row.settledFinalAmount !== null" :style="row.settledFinalAmount >= 0 ? 'color:#f56c6c;font-weight:600' : 'color:#67c23a;font-weight:600'">
              {{ row.settledFinalAmount >= 0 ? '¥' : '-¥' }}{{ Math.abs(Number(row.settledFinalAmount)).toFixed(2) }}
            </span>
            <span v-else style="color: #909399">¥0</span>
          </template>
        </el-table-column>
        <el-table-column label="结算状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.settled)" size="small">{{ getStatusText(row.settled) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.settled >= 1" type="primary" link size="small" @click="handleItems(row)">
              <el-icon><Tickets /></el-icon>明细
            </el-button>
            <el-button v-if="row.settled === 1" type="success" link size="small" @click="handleSettle(row)">
              <el-icon><Check /></el-icon>去结算
            </el-button>
            <el-button v-if="row.settled === 2" type="warning" link size="small" @click="handleDetail(row)">
              <el-icon><View /></el-icon>详情
            </el-button>
            <el-button v-if="row.settled === 2" type="info" link size="small" @click="handlePrint(row)">
              <el-icon><Printer /></el-icon>打印
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 费用明细抽屉 -->
    <el-drawer v-model="itemDrawerVisible" :title="itemDrawerTitle" size="760px" destroy-on-close>
      <div v-loading="itemLoading">
        <el-table :data="itemList" stripe border size="small" empty-text="暂无费用明细">
          <el-table-column label="费用项" prop="itemName" min-width="140" show-overflow-tooltip />
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.itemType === '0' ? 'primary' : 'info'">
                {{ feeTypeName(row.itemType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="计费方式" width="90" align="center">
            <template #default="{ row }">{{ chargeModeName(row.chargeMode) }}</template>
          </el-table-column>
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">
              {{ row.unitPrice != null ? '¥' + Number(row.unitPrice).toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" width="70" align="center" />
          <el-table-column label="天数" width="70" align="center">
            <template #default="{ row }">{{ row.days != null ? row.days : '-' }}</template>
          </el-table-column>
          <el-table-column label="小计" width="110" align="right">
            <template #default="{ row }">
              <span style="color:#f56c6c;font-weight:600">¥{{ formatAmount(row.subtotal) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="item-summary">
          <span>合计</span>
          <span class="item-summary-amount">¥{{ formatAmount(itemTotal) }}</span>
        </div>
        <div class="item-tip">
          明细合计应与结算单小计一致；“康养费”为套餐基础费单列行。若为空，说明该单为明细接入前的历史数据。
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { getSettlementList, getSettlementStat, getSettlementItems } from '@/api/care/billing'
import { ElMessage } from 'element-plus'

const { proxy } = getCurrentInstance()
const router = useRouter()

const loading = ref(false)
const orderList = ref([])
const total = ref(0)

const stats = reactive({
  totalCount: 0,
  totalAmount: '0.00',
  pendingCount: 0,
  todayAmount: '0.00'
})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  checkinNo: '',
  residentName: '',
  contactPhone: '',
  dateRange: [],
  settledStatus: 1 //0未结算 1-待结算(默认), 2-已结算, -1 -全部
})

function getStatusType(status) {
  // settled: 0-否，1-待结算，2-已结算
  const map = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[status] || 'info'
}

function getStatusText(status) {
  // settled: 0-否，1-待结算，2-已结算
  const map = { 0: '未结算', 1: '待结算', 2: '已结算' }
  return map[status] || '未知'
}

async function getList() {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      checkinNo: queryParams.checkinNo,
      residentName: queryParams.residentName,
      contactPhone: queryParams.contactPhone
    }
    
    // 日期范围参数
    if (queryParams.dateRange && queryParams.dateRange.length === 2) {
      params.startDate = queryParams.dateRange[0]
      params.endDate = queryParams.dateRange[1]
    }
    
    // 结算状态参数
    if (queryParams.settledStatus !== 'all') {
      params.settled = queryParams.settledStatus
    }
    
    const res = await getSettlementList(params)
    orderList.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
  } catch (error) {
    console.error('获取结算列表失败:', error)
    proxy.$modal.msgError('获取结算列表失败')
  } finally {
    loading.value = false
  }
}

async function getStats() {
  try {
    const res = await getSettlementStat(queryParams)
    if (res.data) {
      stats.totalCount = res.data.totalCount || 0
      stats.totalAmount = res.data.totalAmount ? Number(res.data.totalAmount).toFixed(2) : '0.00'
      stats.pendingCount = res.data.pendingCount || 0
      stats.todayAmount = res.data.todayAmount ? Number(res.data.todayAmount).toFixed(2) : '0.00'
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
  getStats()
}

function resetQuery() {
  proxy.$refs.queryFormRef.resetFields()
  queryParams.dateRange = []
  queryParams.settledStatus = 1
  handleQuery()
}

// 统计卡片点击
function handleStatCardClick(type) {
  if (type === 'all') {
    queryParams.settledStatus = 'all'
  } else if (type === 'settled') {
    queryParams.settledStatus = 2
  } else if (type === 'pending') {
    queryParams.settledStatus = 1
  } else if (type === 'today') {
    // 今日结算：设置日期为今天，状态为已结算
    const today = new Date().toISOString().slice(0, 10)
    queryParams.dateRange = [today, today]
    queryParams.settledStatus = 2
  }
  handleQuery()
}

// 日期变更
function handleDateChange() {
  handleQuery()
}

// 状态切换
function handleStatusChange() {
  handleQuery()
}

// 获取状态按钮样式
function getStatusRadioStyle(status) {
  const currentStatus = queryParams.settledStatus
  if (status === 'all' && currentStatus === 'all') return 'primary'
  if (status === 1 && currentStatus === 1) return 'warning'
  if (status === 2 && currentStatus === 2) return 'success'
  return ''
}

function handleSettle(row) {
  router.push({
    path: '/eyang/settlement/form',
    query: { id: row.id }
  })
}

function handleDetail(row) {
  router.push({
    path: '/eyang/settlement/form',
    query: { id: row.id }
  })
}

// ==================== 费用明细抽屉 ====================
const itemDrawerVisible = ref(false)
const itemLoading = ref(false)
const itemList = ref([])
const itemRow = ref({})

const itemDrawerTitle = computed(() => {
  const name = itemRow.value?.residentName || ''
  const no = itemRow.value?.checkinNo || ''
  return `费用明细${name ? ' - ' + name : ''}${no ? '（' + no + '）' : ''}`
})

const itemTotal = computed(() =>
  itemList.value.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0)
)

const FEE_TYPE_NAMES = { 0: '基础', 1: '增值', 2: '餐饮', 3: '医疗', 4: '照护', 5: '赔偿', 6: '其他' }
const CHARGE_MODE_NAMES = { 0: '按天', 1: '按次', 2: '固定', 3: '按重', 4: '按年', 5: '按月' }

function feeTypeName(type) {
  return FEE_TYPE_NAMES[Number(type)] || '其他'
}

function chargeModeName(mode) {
  return CHARGE_MODE_NAMES[Number(mode)] || '-'
}

function formatAmount(val) {
  const n = Number(val)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

async function handleItems(row) {
  itemRow.value = row || {}
  itemList.value = []
  itemDrawerVisible.value = true
  itemLoading.value = true
  try {
    const res = await getSettlementItems(row.id)
    itemList.value = res.data || []
  } catch (error) {
    console.error('获取费用明细失败:', error)
    proxy.$modal.msgError('获取费用明细失败')
  } finally {
    itemLoading.value = false
  }
}

function handlePrint(row) {
  if (row.settled !== 2) {
    ElMessage.warning('该订单尚未结算，无法打印')
    return
  }
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>康养结算账单 - ${row.checkinNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif; 
          padding: 30px; 
          color: #2c3e50;
          background: #fff;
          line-height: 1.6;
        }
        .print-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #2c3e50;
          padding: 30px;
          background: #fff;
        }
        .print-header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 3px double #2c3e50;
        }
        .print-header h1 { 
          font-size: 32px; 
          margin-bottom: 10px;
          color: #2c3e50;
          letter-spacing: 8px;
          font-weight: bold;
        }
        .print-header .subtitle {
          font-size: 12px;
          color: #7f8c8d;
          letter-spacing: 2px;
        }
        .info-section { 
          margin-bottom: 25px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px;
        }
        .info-item { 
          display: flex;
          align-items: baseline;
        }
        .info-label { 
          font-weight: 600; 
          min-width: 90px; 
          color: #34495e;
          font-size: 13px;
        }
        .info-value { 
          flex: 1;
          color: #2c3e50;
          font-size: 13px;
        }
        .summary-section { 
          margin-top: 25px; 
          border-top: 2px solid #2c3e50; 
          padding-top: 20px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 4px;
        }
        .summary-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 12px; 
          font-size: 14px;
          color: #34495e;
        }
        .summary-row.total { 
          font-size: 20px; 
          font-weight: bold; 
          color: #409eff;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px dashed #bdc3c7;
        }
        .summary-row .label {
          color: #7f8c8d;
          font-size: 13px;
        }
        .summary-row .value {
          font-weight: 600;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #95a5a6; 
          font-size: 12px; 
          border-top: 1px dashed #bdc3c7; 
          padding-top: 20px;
        }
        .footer .shop-name {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .footer p {
          margin: 5px 0;
        }
        @media print {
          body { 
            padding: 0;
            background: #fff;
          }
          .print-container {
            border: none;
            padding: 20px;
          }
          .info-section,
          .summary-section {
            background: #f8f9fa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="print-header">
          <h1>养 老 结 算 账 单</h1>
          <div class="subtitle">RESIDENT CARE SETTLEMENT BILL</div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">登记单号：</span>
              <span class="info-value" style="font-weight: 600; color: #409eff;">${row.checkinNo || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">长者姓名：</span>
              <span class="info-value">${row.residentName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话：</span>
              <span class="info-value">${row.contactPhone || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">床位：</span>
              <span class="info-value">${(row.roomName ? row.roomName + '·' : '') + (row.bedNo || '未分配')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">入住日期：</span>
              <span class="info-value">${row.checkinDate || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">离店日期：</span>
              <span class="info-value">${row.checkoutDate || '待定'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">实际天数：</span>
              <span class="info-value">${row.estimatedDays ? row.estimatedDays + '天' : '-'}</span>
            </div>
          </div>
        </div>
        
        <div class="summary-section">
          <div class="summary-row">
            <span class="label">应收/应退金额：</span>
            <span class="value" style="${Number(row.settledFinalAmount || 0) >= 0 ? 'color: #f56c6c; font-size: 16px;' : 'color: #67c23a; font-size: 16px;'}">
              ${Number(row.settledFinalAmount || 0) >= 0 ? '¥' : '-¥'}${Math.abs(Number(row.settledFinalAmount || 0)).toFixed(2)}
            </span>
          </div>
          <div class="summary-row">
            <span class="label">押金合计：</span>
            <span class="value" style="color: #e6a23c;">¥${Number(row.totalDeposit || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row total">
            <span>实收金额：</span>
            <span>¥${Number(row.settledActualPayment || 0).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="shop-name">感谢您的惠顾！</div>
          <p>打印时间：${new Date().toLocaleString('zh-CN')}</p>
          <p style="margin-top: 8px; font-size: 11px; color: #bdc3c7;">本单据作为结算凭证，请妥善保管</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}

onMounted(() => {
  getList()
  getStats()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}
.page-subtitle {
  font-size: 13px;
  color: #86909c;
}
.search-card {
  margin-bottom: 16px;
}
.stats-row {
  margin-bottom: 16px;
}
.stat-card {
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.stat-card--blue { background: linear-gradient(135deg, #e8f4fd, #d0e9f9); }
.stat-card--green { background: linear-gradient(135deg, #e8f9ee, #cdf4d8); }
.stat-card--orange { background: linear-gradient(135deg, #fdf3e8, #fae3c0); }
.stat-card--purple { background: linear-gradient(135deg, #f0e8fd, #ddc8f9); }
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1d2129;
}
.stat-label {
  font-size: 13px;
  color: #86909c;
  margin-top: 2px;
}
.card-header {
  font-weight: 600;
  font-size: 15px;
}
.owner-info {
  line-height: 1.5;
}
.owner-name {
  font-weight: 600;
  font-size: 13px;
}
.owner-phone {
  font-size: 12px;
  color: #909399;
}
.pet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.item-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}
.item-summary-amount {
  font-size: 18px;
  color: #f56c6c;
}
.item-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
</style>
