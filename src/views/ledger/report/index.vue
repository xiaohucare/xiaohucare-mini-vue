<template>
  <div class="app-container ledger-report" v-loading="loading">
    <div class="toolbar">
      <span class="title">养老智慧台账 · 汇总报表</span>
      <div>
        <el-radio-group v-model="trendDays" size="small" @change="reload">
          <el-radio-button :value="7">近 7 天</el-radio-button>
          <el-radio-button :value="14">近 14 天</el-radio-button>
          <el-radio-button :value="30">近 30 天</el-radio-button>
        </el-radio-group>
        <el-button icon="Refresh" size="small" style="margin-left:8px" @click="reload">刷新</el-button>
      </div>
    </div>

    <!-- 概况卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="8" :md="6" v-for="k in kpis" :key="k.label">
        <div class="kpi-card" :style="{ borderLeftColor: k.color }">
          <div class="kpi-val" :style="{ color: k.color }">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card shadow="never"><template #header>探访工单生成趋势</template>
          <div ref="trendRef" class="chart chart-lg"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分布 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>工单状态分布</template>
          <div ref="statusRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>探访类型分布</template>
          <div ref="typeRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>老人风险等级分布</template>
          <div ref="riskRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>老人照护等级分布</template>
          <div ref="careRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="left"><span class="sec-title">巡访工单统计</span></el-divider>

    <!-- 巡访概况卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="8" :md="6" v-for="k in patrolKpis" :key="k.label">
        <div class="kpi-card" :style="{ borderLeftColor: k.color }">
          <div class="kpi-val" :style="{ color: k.color }">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 巡访趋势 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card shadow="never"><template #header>巡访工单生成趋势</template>
          <div ref="patrolTrendRef" class="chart chart-lg"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 巡访分布 + 隐患 Top -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>巡访状态分布</template>
          <div ref="patrolStatusRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>巡访类型分布</template>
          <div ref="patrolTypeRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>巡访风险等级分布</template>
          <div ref="patrolRiskRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never"><template #header>隐患项 Top 8（总数 / 已整改）</template>
          <div ref="riskTopRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <div class="empty-tip" v-if="!loading && allEmpty">暂无统计数据，请先录入老人档案或生成探访 / 巡访工单。</div>
  </div>
</template>

<script setup name="LedgerReport">
import * as echarts from 'echarts'
import { reportOverview, getDictData } from '@/api/care/ledger'
import {
  getLedgerVisitOrderStatusName, getLedgerVisitTypeName, getLedgerRiskLevelName,
  getCareLevelName,
  getLedgerPatrolTypeName, getLedgerPatrolOrderStatusName,
  LEDGER_VISIT_ORDER_STATUS_OPTIONS, LEDGER_VISIT_TYPE_OPTIONS, LEDGER_RISK_LEVEL_OPTIONS,
  CARE_LEVEL_OPTIONS,
  LEDGER_PATROL_ORDER_STATUS_OPTIONS, LEDGER_PATROL_TYPE_OPTIONS,
} from '@/utils/careEnums'

const loading = ref(false)
const trendDays = ref(14)
const allEmpty = ref(false)
const kpis = ref([])
const patrolKpis = ref([])
const riskCodeMap = ref({})

const trendRef = ref(null)
const statusRef = ref(null)
const riskRef = ref(null)
const careRef = ref(null)
const typeRef = ref(null)
let trendChart, statusChart, riskChart, careChart, typeChart

const patrolTrendRef = ref(null)
const patrolStatusRef = ref(null)
const patrolTypeRef = ref(null)
const patrolRiskRef = ref(null)
const riskTopRef = ref(null)
let patrolTrendChart, patrolStatusChart, patrolTypeChart, patrolRiskChart, riskTopChart

const PIE_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#36cfc9', '#9254de']

// 按 code 列表将 [{k,c}] 映射为图表用 [{name,value}]，并补齐未出现的分类为 0
function toSeries(dist, options, nameFn) {
  const map = {}
  ;(dist || []).forEach(d => { map[d.k] = d.c })
  return options.map(o => ({ name: nameFn(o.value), value: Number(map[o.value] || 0) }))
}

function reload() { load() }

function load() {
  loading.value = true
  reportOverview(trendDays.value).then(res => {
    const d = res.data || res
    const s = d.summary || {}
    kpis.value = [
      { label: '老人档案(正常)', value: s.elderTotal || 0, color: '#409eff' },
      { label: '高风险老人', value: s.elderHighRisk || 0, color: '#f56c6c' },
      { label: '工单总数', value: s.orderTotal || 0, color: '#303133' },
      { label: '待分配', value: s.orderWaitAssign || 0, color: '#909399' },
      { label: '进行中', value: s.orderDoing || 0, color: '#e6a23c' },
      { label: '已完成', value: s.orderDone || 0, color: '#67c23a' },
      { label: '完成率', value: (s.doneRate != null ? s.doneRate : 0) + '%', color: '#36cfc9' },
      { label: '本月新增工单', value: s.monthNew || 0, color: '#9254de' },
    ]

    const ps = d.patrolSummary || {}
    patrolKpis.value = [
      { label: '巡访工单', value: ps.patrolTotal || 0, color: '#303133' },
      { label: '待分派', value: ps.patrolWaitDispatch || 0, color: '#909399' },
      { label: '进行中', value: ps.patrolDoing || 0, color: '#e6a23c' },
      { label: '已结案', value: ps.patrolClosed || 0, color: '#67c23a' },
      { label: '结案率', value: (ps.patrolCloseRate != null ? ps.patrolCloseRate : 0) + '%', color: '#36cfc9' },
      { label: '本月新增', value: ps.patrolMonthNew || 0, color: '#9254de' },
      { label: '隐患总数', value: ps.riskTotal || 0, color: '#f56c6c' },
      { label: '隐患整改率', value: (ps.riskFixRate != null ? ps.riskFixRate : 0) + '%', color: '#409eff' },
    ]

    const hasData = (d.orderTrend || []).some(t => t.count > 0)
      || (d.orderByStatus || []).length || (d.elderByRisk || []).length
      || (d.patrolTrend || []).some(t => t.count > 0) || (d.patrolByStatus || []).length || (d.riskItemTop || []).length
    allEmpty.value = !hasData

    nextTick(() => {
      renderTrend(d.orderTrend || [])
      renderPie(statusChartInit(), toSeries(d.orderByStatus, LEDGER_VISIT_ORDER_STATUS_OPTIONS, getLedgerVisitOrderStatusName))
      renderPie(typeChartInit(), toSeries(d.orderByType, LEDGER_VISIT_TYPE_OPTIONS, getLedgerVisitTypeName))
      renderPie(riskChartInit(), toSeries(d.elderByRisk, LEDGER_RISK_LEVEL_OPTIONS, getLedgerRiskLevelName))
      renderBar(careChartInit(), toSeries(d.elderByCare, CARE_LEVEL_OPTIONS, getCareLevelName))

      renderTrend2(patrolTrendChartInit(), d.patrolTrend || [])
      renderPie(patrolStatusChartInit(), toSeries(d.patrolByStatus, LEDGER_PATROL_ORDER_STATUS_OPTIONS, getLedgerPatrolOrderStatusName))
      renderPie(patrolTypeChartInit(), toSeries(d.patrolByType, LEDGER_PATROL_TYPE_OPTIONS, getLedgerPatrolTypeName))
      renderPie(patrolRiskChartInit(), toSeries(d.patrolByRisk, LEDGER_RISK_LEVEL_OPTIONS, getLedgerRiskLevelName))
      renderRiskTop(riskTopChartInit(), d.riskItemTop || [])
    })
    loading.value = false
  }).catch(() => { loading.value = false })
}

function ensureChart(inst, elRef) {
  if (!elRef.value) return null
  if (!inst) inst = echarts.init(elRef.value)
  return inst
}
function statusChartInit() { statusChart = ensureChart(statusChart, statusRef); return statusChart }
function typeChartInit() { typeChart = ensureChart(typeChart, typeRef); return typeChart }
function riskChartInit() { riskChart = ensureChart(riskChart, riskRef); return riskChart }
function careChartInit() { careChart = ensureChart(careChart, careRef); return careChart }
function patrolTrendChartInit() { patrolTrendChart = ensureChart(patrolTrendChart, patrolTrendRef); return patrolTrendChart }
function patrolStatusChartInit() { patrolStatusChart = ensureChart(patrolStatusChart, patrolStatusRef); return patrolStatusChart }
function patrolTypeChartInit() { patrolTypeChart = ensureChart(patrolTypeChart, patrolTypeRef); return patrolTypeChart }
function patrolRiskChartInit() { patrolRiskChart = ensureChart(patrolRiskChart, patrolRiskRef); return patrolRiskChart }
function riskTopChartInit() { riskTopChart = ensureChart(riskTopChart, riskTopRef); return riskTopChart }

function renderTrend(trend) {
  trendChart = ensureChart(trendChart, trendRef)
  if (!trendChart) return
  trendChart.setOption({
    color: ['#409eff'],
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: trend.map(t => t.date.slice(5)), boundaryGap: false },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '生成工单', type: 'line', smooth: true, data: trend.map(t => t.count),
      areaStyle: { opacity: 0.15 },
    }],
  }, true)
}

function renderPie(chart, data) {
  if (!chart) return
  chart.setOption({
    color: PIE_COLORS,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['42%', '66%'], center: ['50%', '44%'], avoidLabelOverlap: true,
      label: { formatter: '{b}\n{c}' }, data,
    }],
  }, true)
}

function renderBar(chart, data) {
  if (!chart) return
  chart.setOption({
    color: ['#67c23a'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.map(x => x.name) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', barMaxWidth: 46, data: data.map(x => x.value), label: { show: true, position: 'top' } }],
  }, true)
}

function renderTrend2(chart, trend) {
  if (!chart) return
  chart.setOption({
    color: ['#e6a23c'],
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: trend.map(t => t.date.slice(5)), boundaryGap: false },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ name: '生成工单', type: 'line', smooth: true, data: trend.map(t => t.count), areaStyle: { opacity: 0.15 } }],
  }, true)
}

function renderRiskTop(chart, top) {
  if (!chart) return
  const names = top.map(x => riskCodeMap.value[x.k] || x.k)
  chart.setOption({
    color: ['#f56c6c', '#67c23a'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, data: ['总数', '已整改'] },
    grid: { left: 40, right: 20, top: 20, bottom: 46 },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: names.length > 4 ? 30 : 0 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '总数', type: 'bar', barMaxWidth: 32, data: top.map(x => x.c) },
      { name: '已整改', type: 'bar', barMaxWidth: 32, data: top.map(x => x.fixed) },
    ],
  }, true)
}

function resizeAll() { [trendChart, statusChart, riskChart, careChart, typeChart, patrolTrendChart, patrolStatusChart, patrolTypeChart, patrolRiskChart, riskTopChart].forEach(c => c && c.resize()) }

function loadRiskDict() {
  getDictData('ledger_risk_item').then(res => {
    const map = {}
    ;(res.data || []).forEach(x => { map[x.dictValue] = x.dictLabel })
    riskCodeMap.value = map
  })
}

onMounted(() => { loadRiskDict(); load(); window.addEventListener('resize', resizeAll) })
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  ;[trendChart, statusChart, riskChart, careChart, typeChart, patrolTrendChart, patrolStatusChart, patrolTypeChart, patrolRiskChart, riskTopChart].forEach(c => c && c.dispose())
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar .title { font-size: 18px; font-weight: 600; color: #303133; }
.kpi-row { margin-bottom: 8px; }
.kpi-card { background: #fff; border: 1px solid #ebeef5; border-left: 4px solid #409eff; border-radius: 6px; padding: 16px 18px; margin-bottom: 16px; }
.kpi-val { font-size: 26px; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.kpi-label { margin-top: 6px; color: #909399; font-size: 13px; }
.chart-row { margin-bottom: 16px; }
.chart { height: 300px; width: 100%; }
.chart-lg { height: 320px; }
.empty-tip { text-align: center; color: #909399; padding: 24px 0; }
.sec-title { font-size: 15px; font-weight: 600; color: #303133; }
</style>
