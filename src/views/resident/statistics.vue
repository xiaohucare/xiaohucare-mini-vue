<template>
  <div class="app-container resident-stat" v-loading="loading">
    <div class="head">
      <div>
        <div class="title"><el-icon><DataAnalysis /></el-icon>长者档案 · 统计分析</div>
        <div class="sub">按当前机构全量档案口径统计，不随筛选条件变化{{ updatedAt ? '；数据更新于 ' + updatedAt : '' }}</div>
      </div>
      <div class="ops">
        <el-radio-group v-model="trendMonths" size="small" @change="load">
          <el-radio-button :value="6">近 6 个月</el-radio-button>
          <el-radio-button :value="12">近 12 个月</el-radio-button>
          <el-radio-button :value="24">近 24 个月</el-radio-button>
        </el-radio-group>
        <el-button size="small" @click="load"><el-icon><Refresh /></el-icon>刷新</el-button>
        <el-button size="small" type="primary" plain @click="backToList"><el-icon><Back /></el-icon>返回档案列表</el-button>
      </div>
    </div>

    <el-empty v-if="!loading && !summary.total" description="暂无长者档案，录入后即可看到统计结果" />

    <template v-else>
      <el-divider content-position="left"><span class="sec-title">档案概况</span></el-divider>
      <el-row :gutter="16" class="kpi-row">
        <el-col :xs="12" :sm="8" :md="6" v-for="k in overviewKpis" :key="k.label">
          <div class="kpi-card" :style="{ borderLeftColor: k.color }">
            <div class="kpi-val" :style="{ color: k.color }">{{ k.value }}</div>
            <div class="kpi-label">{{ k.label }}</div>
          </div>
        </el-col>
      </el-row>

      <el-divider content-position="left"><span class="sec-title">重点照护人群</span></el-divider>
      <el-row :gutter="16" class="kpi-row">
        <el-col :xs="12" :sm="8" :md="6" v-for="k in careKpis" :key="k.label">
          <div class="kpi-card" :style="{ borderLeftColor: k.color }">
            <div class="kpi-val" :style="{ color: k.color }">{{ k.value }}</div>
            <div class="kpi-label">{{ k.label }}</div>
          </div>
        </el-col>
      </el-row>

      <el-divider content-position="left"><span class="sec-title">建档与入住趋势</span></el-divider>
      <div class="chart-box">
        <div class="chart-title">近 {{ trendMonths }} 个自然月新增建档 / 办理入住</div>
        <div ref="trendRef" class="chart chart-lg"></div>
      </div>

      <el-divider content-position="left"><span class="sec-title">结构分布</span></el-divider>
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <div class="chart-box"><div class="chart-title">年龄段分布</div><div ref="ageRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-box"><div class="chart-title">入住状态分布</div><div ref="checkInRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box"><div class="chart-title">照护等级分布</div><div ref="careRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box"><div class="chart-title">自理能力分布</div><div ref="selfCareRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box"><div class="chart-title">认知状况分布</div><div ref="cognitiveRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box"><div class="chart-title">跌倒风险分布</div><div ref="fallRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box"><div class="chart-title">性别分布</div><div ref="genderRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box"><div class="chart-title">医保类型分布</div><div ref="insuranceRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-box"><div class="chart-title">婚姻状况分布</div><div ref="maritalRef" class="chart"></div></div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-box"><div class="chart-title">文化程度分布</div><div ref="educationRef" class="chart"></div></div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup name="ResidentStatistics">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getResidentOverview } from '@/api/residents'
import {
  CARE_LEVEL_OPTIONS, SELF_CARE_OPTIONS, COGNITIVE_OPTIONS, FALL_RISK_OPTIONS,
  MARITAL_STATUS_OPTIONS, EDUCATION_OPTIONS, MEDICAL_INSURANCE_OPTIONS, CHECK_IN_STATUS_OPTIONS
} from '@/utils/careEnums'

const router = useRouter()

const loading = ref(false)
const trendMonths = ref(12)
const summary = ref({})
const updatedAt = ref('')

// 年龄段 code 与后端 groupAge 的 case 分支一一对应
const AGE_GROUP_OPTIONS = [
  { value: 0, label: '未填' }, { value: 1, label: '70岁以下' }, { value: 2, label: '70-79岁' },
  { value: 3, label: '80-89岁' }, { value: 4, label: '90岁及以上' }
]
const GENDER_OPTIONS = [{ value: '男', label: '男' }, { value: '女', label: '女' }]
const PIE_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#36cfc9', '#9254de']

const overviewKpis = ref([])
const careKpis = ref([])

const trendRef = ref(null)
const ageRef = ref(null)
const checkInRef = ref(null)
const careRef = ref(null)
const selfCareRef = ref(null)
const cognitiveRef = ref(null)
const fallRef = ref(null)
const genderRef = ref(null)
const insuranceRef = ref(null)
const maritalRef = ref(null)
const educationRef = ref(null)
let trendChart, ageChart, checkInChart, careChart, selfCareChart, cognitiveChart
let fallChart, genderChart, insuranceChart, maritalChart, educationChart

function backToList() { router.push('/kh/resident') }

// [{k,c}] 按预设 code 列表映射为 [{name,value}]，未出现的分类补 0
function toSeries(dist, options) {
  const map = {}
  ;(dist || []).forEach(x => { map[x.k] = x.c })
  return options.map(o => ({ name: o.label, value: Number(map[o.value] || 0) }))
}
function useChart(inst, elRef) {
  if (!elRef.value) return null
  return inst || echarts.init(elRef.value)
}

async function load() {
  loading.value = true
  try {
    const res = await getResidentOverview(trendMonths.value)
    const d = res.data || {}
    const s = d.summary || {}
    summary.value = s
    overviewKpis.value = [
      { label: '档案总数', value: s.total || 0, color: '#409eff' },
      { label: '正常档案', value: s.active || 0, color: '#67c23a' },
      { label: '停用档案', value: s.stopped || 0, color: '#909399' },
      { label: '在住长者', value: s.checkIn || 0, color: '#36cfc9' },
      { label: '未入住', value: s.waitIn || 0, color: '#e6a23c' },
      { label: '已退住', value: s.checkedOut || 0, color: '#b0b3b8' },
      { label: '本月新增建档', value: s.monthNew || 0, color: '#9254de' },
      { label: '在住率', value: rateText(s.checkIn, s.total), color: '#5c8eff' }
    ]
    careKpis.value = [
      { label: '平均年龄', value: (s.avgAge || 0) + ' 岁', color: '#409eff' },
      { label: '80 岁及以上', value: s.aged80 || 0, color: '#f56c6c' },
      { label: '失能长者', value: s.highCare || 0, color: '#f78989' },
      { label: '高跌倒风险', value: s.highFallRisk || 0, color: '#e6a23c' },
      { label: '确诊认知障碍', value: s.highCognitive || 0, color: '#ff9f7f' },
      { label: '未填出生日期', value: s.noBirthDate || 0, color: '#909399' }
    ]
    updatedAt.value = formatTime(new Date())
    // 图表容器由 v-if 控制，等 DOM 就绪后再初始化 echarts
    await nextTick()
    renderCharts(d)
  } catch {
    summary.value = {}
  } finally {
    loading.value = false
  }
}

function renderCharts(d) {
  trendChart = useChart(trendChart, trendRef)
  ageChart = useChart(ageChart, ageRef)
  checkInChart = useChart(checkInChart, checkInRef)
  careChart = useChart(careChart, careRef)
  selfCareChart = useChart(selfCareChart, selfCareRef)
  cognitiveChart = useChart(cognitiveChart, cognitiveRef)
  fallChart = useChart(fallChart, fallRef)
  genderChart = useChart(genderChart, genderRef)
  insuranceChart = useChart(insuranceChart, insuranceRef)
  maritalChart = useChart(maritalChart, maritalRef)
  educationChart = useChart(educationChart, educationRef)

  drawTrend(trendChart, d.monthTrend || [])
  drawBar(ageChart, toSeries(d.ageDist, AGE_GROUP_OPTIONS))
  drawPie(checkInChart, toSeries(d.checkInStatusDist, CHECK_IN_STATUS_OPTIONS))
  drawPie(careChart, toSeries(d.careLevelDist, CARE_LEVEL_OPTIONS))
  drawPie(selfCareChart, toSeries(d.selfCareDist, SELF_CARE_OPTIONS))
  drawPie(cognitiveChart, toSeries(d.cognitiveDist, COGNITIVE_OPTIONS))
  drawPie(fallChart, toSeries(d.fallRiskDist, FALL_RISK_OPTIONS))
  drawPie(genderChart, toSeries(d.genderDist, GENDER_OPTIONS))
  drawPie(insuranceChart, toSeries(d.medicalInsuranceDist, MEDICAL_INSURANCE_OPTIONS))
  drawPie(maritalChart, toSeries(d.maritalDist, MARITAL_STATUS_OPTIONS))
  drawPie(educationChart, toSeries(d.educationDist, EDUCATION_OPTIONS))
}

function drawTrend(chart, trend) {
  if (!chart) return
  chart.setOption({
    color: ['#409eff', '#67c23a'],
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, data: ['新增建档', '办理入住'] },
    grid: { left: 44, right: 20, top: 16, bottom: 34 },
    xAxis: { type: 'category', boundaryGap: false, data: trend.map(t => String(t.month).slice(2)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '新增建档', type: 'line', smooth: true, data: trend.map(t => t.created), areaStyle: { opacity: 0.12 } },
      { name: '办理入住', type: 'line', smooth: true, data: trend.map(t => t.admitted), areaStyle: { opacity: 0.08 } }
    ]
  }, true)
}
function drawBar(chart, data) {
  if (!chart) return
  chart.setOption({
    color: ['#409eff'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 44, right: 16, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.map(x => x.name), axisLabel: { interval: 0, fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', barMaxWidth: 46, data: data.map(x => x.value), label: { show: true, position: 'top' } }]
  }, true)
}
function drawPie(chart, data) {
  if (!chart) return
  chart.setOption({
    color: PIE_COLORS,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['42%', '64%'], center: ['50%', '44%'], avoidLabelOverlap: true,
      label: { formatter: '{b}\n{c}' }, data
    }]
  }, true)
}

function rateText(part, all) {
  if (!all) return '0%'
  return Math.round((Number(part || 0) * 1000) / Number(all)) / 10 + '%'
}
// 本地时区格式化（toISOString 走 UTC，凌晨会少一天）
function formatTime(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

function resizeAll() {
  ;[trendChart, ageChart, checkInChart, careChart, selfCareChart, cognitiveChart,
    fallChart, genderChart, insuranceChart, maritalChart, educationChart].forEach(c => c && c.resize())
}

onMounted(() => { load(); window.addEventListener('resize', resizeAll) })
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  ;[trendChart, ageChart, checkInChart, careChart, selfCareChart, cognitiveChart,
    fallChart, genderChart, insuranceChart, maritalChart, educationChart].forEach(c => c && c.dispose())
})
</script>

<style scoped>
.head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
.title { display: inline-flex; align-items: center; gap: 6px; font-size: 18px; font-weight: 600; color: #303133; }
.sub { margin-top: 6px; font-size: 12px; color: #a8abb2; }
.ops { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sec-title { font-size: 15px; font-weight: 600; color: #303133; }
.kpi-row { margin-bottom: 8px; }
.kpi-card { background: #fff; border: 1px solid #ebeef5; border-left: 4px solid #409eff; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px; }
.kpi-val { font-size: 24px; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.kpi-label { margin-top: 6px; color: #909399; font-size: 13px; }
.chart-box { background: #fff; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px 14px 6px; margin-bottom: 16px; }
.chart-title { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.chart { height: 280px; width: 100%; }
.chart-lg { height: 320px; }
</style>
