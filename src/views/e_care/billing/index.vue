<template>
  <div class="app-container billing-overview">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon size="26" color="#409EFF"><Money /></el-icon>
        <span class="page-title">收费总览</span>
        <span class="page-subtitle">康养 & 洗护收费数据汇总</span>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="dateRange"
          type="monthrange"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          value-format="YYYY-MM"
          style="width:260px"
          @change="loadData"
        />
        <el-button type="primary" @click="loadData"><el-icon><Refresh /></el-icon>刷新</el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">本月总收入</span>
            <el-tag :type="kpi.monthGrowth >= 0 ? 'success' : 'danger'" size="small">{{ kpi.monthGrowth >= 0 ? '+' : '' }}{{ kpi.monthGrowth }}%</el-tag>
          </div>
          <div class="kpi-value">¥{{ kpi.monthIncome }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">上月 ¥{{ kpi.lastMonthIncome }}</span>
            <el-icon v-if="kpi.monthGrowth >= 0" color="#67C23A"><Top /></el-icon>
            <el-icon v-else color="#F56C6C"><Bottom /></el-icon>
          </div>
          <div class="kpi-icon kpi-icon--green"><el-icon size="36"><Money /></el-icon></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">今日收入</span>
            <el-tag size="small">实时</el-tag>
          </div>
          <div class="kpi-value">¥{{ kpi.todayIncome }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">结算 {{ kpi.todayOrders }} 单</span>
          </div>
          <div class="kpi-icon kpi-icon--blue"><el-icon size="36"><TrendCharts /></el-icon></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">康养收入</span>
            <el-tag type="primary" size="small">本月</el-tag>
          </div>
          <div class="kpi-value">¥{{ kpi.boardingIncome }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">{{ kpi.boardingOrders }} 单康养</span>
          </div>
          <div class="kpi-icon kpi-icon--purple"><el-icon size="36"><House /></el-icon></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">在住长者</span>
            <el-tag type="success" size="small">康养中</el-tag>
          </div>
          <div class="kpi-value">{{ kpi.residentCount }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">本月新增 {{ kpi.monthCheckinCount }} 人</span>
          </div>
          <div class="kpi-icon kpi-icon--orange"><el-icon size="36"><Avatar /></el-icon></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行指标 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card kpi-card--small" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">在押押金</span>
            <el-tag type="warning" size="small">待退还</el-tag>
          </div>
          <div class="kpi-value">¥{{ kpi.holdingDeposit }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">共 {{ kpi.depositCount }} 笔</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card kpi-card--small" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">待结算订单</span>
            <el-tag type="danger" size="small">需处理</el-tag>
          </div>
          <div class="kpi-value">{{ kpi.pendingOrders }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">预计 ¥{{ kpi.pendingAmount }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card kpi-card--small" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">本月新增登记</span>
            <el-tag type="success" size="small">本月</el-tag>
          </div>
          <div class="kpi-value">{{ kpi.monthCheckinCount }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">康养登记单</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="kpi-card kpi-card--small" shadow="never">
          <div class="kpi-header">
            <span class="kpi-title">本月结算单</span>
            <el-tag type="info" size="small">已完成</el-tag>
          </div>
          <div class="kpi-value">{{ kpi.boardingOrders }}</div>
          <div class="kpi-footer">
            <span class="kpi-compare">合计 ¥{{ kpi.boardingIncome }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间：趋势图 + 收入构成 -->
    <el-row :gutter="16" style="margin-bottom:16px">
      <!-- 收入趋势 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>收入趋势（近30天）</span>
              <el-radio-group v-model="trendType" size="small" @change="changeTrendType">
                <el-radio-button label="daily">按日</el-radio-button>
                <el-radio-button label="weekly">按周</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-area">
            <!-- 模拟柱状图 -->
            <div class="bar-chart">
              <div
                v-for="(item, idx) in trendData"
                :key="idx"
                class="bar-item"
              >
                <el-tooltip :content="`${item.date}: ¥${item.amount}`" placement="top">
                  <div class="bar-wrapper">
                    <div
                      class="bar"
                      :style="{ height: `${(item.amount / maxTrendAmount) * 120}px` }"
                      :class="item.amount === maxTrendAmount ? 'bar--highlight' : ''"
                    ></div>
                  </div>
                </el-tooltip>
                <div class="bar-label">{{ item.shortDate }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 收入构成饼图 -->
      <el-col :span="8">
        <el-card shadow="never" style="height:100%">
          <template #header>
            <span>收入构成</span>
          </template>
          <div class="pie-area">
            <div class="donut-chart">
              <svg viewBox="0 0 200 200" width="160" height="160">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f0f0f0" stroke-width="28" />
                <circle
                  v-for="(seg, i) in donutSegments"
                  :key="i"
                  cx="100" cy="100" r="70" fill="none"
                  :stroke="seg.color"
                  stroke-width="28"
                  :stroke-dasharray="seg.dasharray"
                  :stroke-dashoffset="seg.dashoffset"
                  transform="rotate(-90 100 100)" />
                <text x="100" y="96" text-anchor="middle" font-size="14" fill="#1d2129" font-weight="600">总收入</text>
                <text x="100" y="114" text-anchor="middle" font-size="12" fill="#409EFF" font-weight="700">¥{{ kpi.monthIncome }}</text>
              </svg>
            </div>
            <div class="pie-legend">
              <div v-for="item in incomeComposition" :key="item.name" class="legend-item">
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-value">¥{{ item.amount }}</span>
                <span class="legend-percent">{{ item.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方：最近结算记录 + 支付方式 -->
    <el-row :gutter="16" style="margin-bottom:16px">
      <!-- 最近结算记录 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>最近结算记录</span>
              <el-button type="primary" link @click="$router.push('/billing/settlement')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="recentSettlements" stripe size="default">
            <el-table-column label="结算单号" prop="settlementNo" min-width="200" />
            <el-table-column label="服务类型" prop="serviceType" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.serviceType === 'boarding' ? 'primary' : 'success'" size="small">
                  {{ row.serviceType === 'boarding' ? '康养' : '洗护' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="长者/家属" min-width="140">
              <template #default="{ row }">
                <div>
                  <span class="pet-name-text">{{ row.residentName }}</span>
                  <span class="owner-name-text"> / {{ row.contactName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="服务内容" prop="serviceContent" min-width="120" show-overflow-tooltip />
            <el-table-column label="结算金额" prop="totalAmount" width="100" align="right">
              <template #default="{ row }">
                <span class="amount-primary">¥{{ row.totalAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" prop="payMethod" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getPayMethodType(row.payMethod)" size="small">{{ getPayMethodText(row.payMethod) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="status" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : (row.status === 2 ? 'info' : 'warning')" size="small">
                  {{ row.status === 1 ? '已结算' : (row.status === 2 ? '已退款' : '待结算') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结算时间" prop="settledAt" min-width="150" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 支付方式分布 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" style="height:100%">
          <template #header><span>支付方式分布</span></template>
          <div class="pay-distribution">
            <div v-for="item in payMethods" :key="item.name" class="pay-item">
              <div class="pay-header">
                <span class="pay-name">{{ item.name }}</span>
                <span class="pay-percent">{{ item.percent }}%</span>
              </div>
              <el-progress :percentage="item.percent" :color="item.color" :show-text="false" />
              <div class="pay-amount">¥{{ item.amount }}</div>
            </div>
            <el-empty v-if="!payMethods.length" description="本月暂无结算数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部：快捷操作 -->
    <el-row style="display: none;">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header><span>快捷操作</span></template>
          <div class="quick-actions-grid">
            <div class="action-item" @click="$router.push('/eyang/checkout')">
              <div class="action-icon action-icon--blue"><el-icon size="22"><DocumentChecked /></el-icon></div>
              <div class="action-text">
                <div class="action-name">离店结算</div>
                <div class="action-desc">处理长者离店账单</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item" @click="$router.push('/pet-grooming/jobs')">
              <div class="action-icon action-icon--cyan"><el-icon size="22"><Scissors /></el-icon></div>
              <div class="action-text">
                <div class="action-name">洗护作业</div>
                <div class="action-desc">洗护服务计费</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item" @click="$router.push('/billing/deposit')">
              <div class="action-icon action-icon--green"><el-icon size="22"><Wallet /></el-icon></div>
              <div class="action-text">
                <div class="action-name">押金管理</div>
                <div class="action-desc">收取/退还押金</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item" @click="$router.push('/billing/deductions')">
              <div class="action-icon action-icon--orange"><el-icon size="22"><List /></el-icon></div>
              <div class="action-text">
                <div class="action-name">扣费记录</div>
                <div class="action-desc">查看扣费明细</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>

            <!-- <div class="action-item" @click="$router.push('/billing/packages')">
              <div class="action-icon action-icon--purple"><el-icon size="22"><Box /></el-icon></div>
              <div class="action-text">
                <div class="action-name">收费套餐</div>
                <div class="action-desc">套餐销售管理</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item" @click="$router.push('/billing/fee-items')">
              <div class="action-icon action-icon--gray"><el-icon size="22"><Setting /></el-icon></div>
              <div class="action-text">
                <div class="action-name">收费类目</div>
                <div class="action-desc">管理费用配置</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div> -->

          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getBillingStatistics, getTodayIncome } from '@/api/care/billing'

const dateRange = ref([])
const trendType = ref('daily')

const kpi = reactive({
  monthIncome: '0.00',
  lastMonthIncome: '0.00',
  monthGrowth: 0,
  todayIncome: '0.00',
  todayOrders: 0,
  boardingIncome: '0.00',
  boardingOrders: 0,
  residentCount: 0,
  monthCheckinCount: 0,
  holdingDeposit: '0.00',
  depositCount: 0,
  pendingOrders: 0,
  pendingAmount: '0.00'
})

const incomeComposition = ref([])

const payMethods = ref([])

const trendRaw = ref([])
// 按日/按周聚合（周：每 7 天为一桶求和），trendType 切换无需重新请求
function toWeekly(list) {
  const buckets = []
  for (let i = 0; i < list.length; i += 7) {
    const slice = list.slice(i, i + 7)
    if (!slice.length) continue
    const sum = slice.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)
    buckets.push({
      date: `${slice[0].date} ~ ${slice[slice.length - 1].date}`,
      shortDate: `${slice[0].date}起`,
      amount: sum.toFixed(2)
    })
  }
  return buckets
}
const trendData = computed(() => trendType.value === 'weekly' ? toWeekly(trendRaw.value) : trendRaw.value)
const maxTrendAmount = computed(() => {
  const amounts = trendData.value.map(d => parseFloat(d.amount) || 0)
  return Math.max(...amounts, 1)
})

// 甜甜圈图：按收入构成百分比动态计算每段弧（周长 2πr, r=70）
const CIRC = 2 * Math.PI * 70
const donutSegments = computed(() => {
  const list = incomeComposition.value || []
  const total = list.reduce((s, it) => s + (parseFloat(it.percent) || 0), 0) || 100
  let offset = 0
  return list.map(it => {
    const len = ((parseFloat(it.percent) || 0) / total) * CIRC
    const seg = { color: it.color, dasharray: `${len} ${CIRC - len}`, dashoffset: -offset }
    offset += len
    return seg
  })
})

const recentSettlements = ref([])

// 支付方式常量
const PAYMENT_METHODS = [
  { value: 'cash',        label: '现金' },
  { value: 'wechat',      label: '微信支付' },
  { value: 'alipay',      label: '支付宝' },
  { value: 'card',        label: '银行卡' },
  { value: 'member_card', label: '会员卡' }
]

function getPayMethodType(method) {
  const map = { wechat: 'success', alipay: 'primary', cash: 'warning', card: 'info', member_card: 'danger' }
  return map[method] || 'info'
}

function getPayMethodText(method) {
  const payMethod = PAYMENT_METHODS.find(item => item.value === method)
  return payMethod ? payMethod.label : method
}

function changeTrendType() {
  // trendData 为 computed，切换 trendType 自动重算，无需重新拉取
}

async function loadData() {
  try {
    const res = await getBillingStatistics({ dateRange: dateRange.value })
    if (res.code === 0 && res.data) {
      // 更新 KPI
      if (res.data.kpi) {
        Object.assign(kpi, res.data.kpi)
      }
      // 更新收入构成
      if (res.data.composition) {
        incomeComposition.value = res.data.composition
      }
      // 更新趋势数据（原始按日）
      if (res.data.trendData) {
        trendRaw.value = res.data.trendData
      }
      // 更新支付方式分布
      if (res.data.payMethods) {
        payMethods.value = res.data.payMethods
      }
      // 更新最近结算记录
      if (res.data.recentSettlements) {
        recentSettlements.value = res.data.recentSettlements
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.billing-overview {}
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
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* KPI 卡片 */
.kpi-row { margin-bottom: 16px; }
.kpi-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  padding: 4px 0;
}
.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.kpi-title { font-size: 13px; color: #86909c; }
.kpi-value { font-size: 26px; font-weight: 700; color: #1d2129; margin-bottom: 8px; }
.kpi-footer { display: flex; align-items: center; gap: 4px; }
.kpi-compare { font-size: 12px; color: #909399; }
.kpi-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.15;
}
.kpi-icon--green { background: #67C23A; }
.kpi-icon--blue { background: #409EFF; }
.kpi-icon--orange { background: #E6A23C; }
.kpi-icon--red { background: #F56C6C; }
.kpi-icon--purple { background: #9747FF; }
.kpi-card--small .kpi-value { font-size: 22px; }
.kpi-card--small .kpi-icon { display: none; }

/* 图表区域 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
.chart-area {
  height: 160px;
  display: flex;
  align-items: flex-end;
  padding: 10px 0;
}
.bar-chart {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 140px;
  padding: 0 8px;
}
.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.bar-wrapper {
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
  height: 120px;
  cursor: pointer;
}
.bar {
  width: 60%;
  max-width: 32px;
  background: linear-gradient(180deg, #7fb8f7, #409EFF);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: all 0.3s;
}
.bar:hover { background: linear-gradient(180deg, #409EFF, #2d7bc4); }
.bar--highlight { background: linear-gradient(180deg, #f9a825, #E6A23C); }
.bar-label { font-size: 11px; color: #909399; }

/* 饼图区域 */
.pie-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.donut-chart { display: flex; justify-content: center; }
.pie-legend { width: 100%; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 13px;
  border-bottom: 1px dashed #f5f5f5;
}
.legend-item:last-child { border-bottom: none; }
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-name { flex: 1; color: #606266; }
.legend-value { font-weight: 600; color: #1d2129; }
.legend-percent { color: #909399; font-size: 12px; width: 40px; text-align: right; }

/* 快捷操作 */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.action-item:hover { background: #f5f7fa; }
.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-icon--blue { background: #ecf5ff; color: #409EFF; }
.action-icon--green { background: #f0f9eb; color: #67C23A; }
.action-icon--orange { background: #fdf6ec; color: #E6A23C; }
.action-icon--purple { background: #f4f0fc; color: #9747FF; }
.action-icon--cyan { background: #e6fffb; color: #13C2C2; }
.action-icon--gray { background: #f5f7fa; color: #909399; }
.action-text { flex: 1; }
.action-name { font-size: 14px; font-weight: 500; color: #1d2129; }
.action-desc { font-size: 12px; color: #86909c; margin-top: 2px; }
.action-arrow { color: #c0c4cc; }

/* 支付分布 */
.pay-distribution { display: flex; flex-direction: column; gap: 14px; }
.pay-item {}
.pay-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
.pay-name { color: #606266; }
.pay-percent { font-weight: 600; color: #1d2129; }
.pay-amount { font-size: 12px; color: #909399; margin-top: 3px; text-align: right; }

/* 表格文字 */
.pet-name-text { font-weight: 600; color: #1d2129; }
.owner-name-text { color: #86909c; font-size: 12px; }
.amount-primary { color: #409EFF; font-weight: 600; }
</style>
