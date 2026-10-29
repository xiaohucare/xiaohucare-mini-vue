<template>
  <div class="app-container dashboard-home">

    <!-- 欢迎栏：机构名 + 日期 + 三个高频动作 -->
    <div class="welcome-bar">
      <div class="welcome-left">
        <div class="welcome-avatar"><svg-icon icon-class="ginkgo" class="leaf-icon" style="font-size: 38px" /></div>
        <div>
          <div class="welcome-title">{{ '小护康养' }} · 机构养老管理</div>
          <div class="welcome-sub">今天是 {{ todayStr }}，祝您工作顺利</div>
        </div>
      </div>
      <div class="welcome-right">
        <el-button type="primary" round @click="$router.push('/eyang/checkin/form')">
          <el-icon><Edit /></el-icon>入住登记
        </el-button>
        <el-button type="warning" round @click="$router.push('/eyang/checkout')">
          <el-icon><Promotion /></el-icon>离店交接
        </el-button>
        <el-button round @click="$router.push('/kh/resident')">
          <el-icon><User /></el-icon>长者档案
        </el-button>
        <el-button link round @click="loadOverview">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 入住概况统计 -->
    <el-row :gutter="12" class="stats-row">
      <el-col :xs="12" :sm="6" class="stats-col">
        <div class="stat-card stat-card--v" @click="$router.push('/eyang/appointment')">
          <div class="stat-icon-wrap-md" style="background:#ecf5ff"><el-icon><Tickets /></el-icon></div>
          <div class="stat-num-md">{{ stats.todayAppointments }}</div>
          <div class="stat-label-md">今日预约</div>
          <div class="stat-bar" style="background:#409EFF"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" class="stats-col">
        <div class="stat-card stat-card--v" @click="$router.push('/eyang/boarding')">
          <div class="stat-icon-wrap-md" style="background:#f0f9eb"><el-icon><HomeFilled /></el-icon></div>
          <div class="stat-num-md">{{ stats.currentBoarding }}</div>
          <div class="stat-label-md">当前在住</div>
          <div class="stat-bar" style="background:#67C23A"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" class="stats-col">
        <div class="stat-card stat-card--v" @click="$router.push('/eyang/checkout')">
          <div class="stat-icon-wrap-md" style="background:#fdf6ec"><el-icon><Promotion /></el-icon></div>
          <div class="stat-num-md">{{ stats.todayCheckouts }}</div>
          <div class="stat-label-md">今日离店</div>
          <div class="stat-bar" style="background:#E6A23C"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" class="stats-col">
        <div class="stat-card stat-card--v" :class="{ 'stat-card--warn': stats.abnormalCount > 0 }" @click="$router.push('/eyang/boarding')">
          <div class="stat-icon-wrap-md" style="background:#fef0f0"><el-icon><WarningFilled /></el-icon></div>
          <div class="stat-num-md" :style="stats.abnormalCount > 0 ? 'color:#F56C6C' : ''">{{ stats.abnormalCount }}</div>
          <div class="stat-label-md">异常关注</div>
          <div class="stat-bar" style="background:#F56C6C"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 概况明细：床位 / 在住 / 今日预约 -->
    <el-row :gutter="12" class="detail-row">
      <el-col :xs="24" :md="8" class="flex-col">
        <el-card shadow="never" class="inner-card">
          <template #header>
            <div class="inner-header">
              <span>床位占用</span>
              <el-button link type="primary" size="small" @click="$router.push('/eyang/space')">房间床铺 →</el-button>
            </div>
          </template>
          <div class="scroll-body">
            <div v-for="space in spaceUsage" :key="space.type" class="space-item">
              <div class="space-meta">
                <span class="space-name">{{ space.name }}</span>
                <span class="space-count">{{ space.occupied }}<span class="space-total">/{{ space.total }}</span></span>
              </div>
              <el-progress :percentage="space.percentage" :color="space.color" :stroke-width="9" :show-text="false" />
            </div>
            <el-empty v-if="!spaceUsage.length" description="暂无床位数据" :image-size="40" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8" class="flex-col">
        <el-card shadow="never" class="inner-card">
          <template #header>
            <div class="inner-header">
              <span>在住长者</span>
              <el-button link type="primary" size="small" @click="$router.push('/eyang/boarding')">日程管理 →</el-button>
            </div>
          </template>
          <div class="scroll-body">
            <div v-for="resident in residents" :key="resident.id" class="resident-item">
              <el-avatar :size="32">{{ (resident.name || '').slice(0, 1) }}</el-avatar>
              <div class="resident-meta">
                <div class="resident-name-text">{{ resident.name }}<span class="resident-room">{{ resident.roomName }}</span></div>
                <div class="resident-days">已住 {{ resident.days }} 天</div>
              </div>
              <el-tag size="small" :type="residentStatusType(resident.status)" effect="light">{{ residentStatusLabel(resident.status) }}</el-tag>
            </div>
            <el-empty v-if="!residents.length" description="暂无在住长者" :image-size="40" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8" class="flex-col">
        <el-card shadow="never" class="inner-card">
          <template #header>
            <div class="inner-header">
              <span>今日预约</span>
              <el-button link type="primary" size="small" @click="$router.push('/eyang/appointment')">预约管理 →</el-button>
            </div>
          </template>
          <div class="scroll-body">
            <div v-for="appt in appointments" :key="appt.id" class="appt-item">
              <div class="appt-time">{{ formatHourMinute(appt.appointmentTime) }}</div>
              <div class="resident-meta">
                <div class="resident-name-text">{{ appt.residentName }}<span class="resident-room">{{ appt.bedCount || 1 }} 床</span></div>
                <div class="resident-days">家属 {{ appt.appointerName || '未填写' }}</div>
              </div>
              <el-tag size="small" :type="appt.status === 'CONFIRMED' ? 'success' : 'warning'" effect="light">
                {{ appt.status === 'CONFIRMED' ? '已确认' : '待确认' }}
              </el-tag>
            </div>
            <el-empty v-if="!appointments.length" description="今日暂无预约" :image-size="40" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 当日值班与最新公告 -->
    <el-row :gutter="12" class="detail-row">
      <el-col :xs="24" :md="9" class="flex-col">
        <el-card shadow="never" class="inner-card">
          <template #header>
            <div class="inner-header">
              <span>今日值班</span>
              <el-button link type="primary" size="small" @click="$router.push('/eyang/duty')">值班排班 →</el-button>
            </div>
          </template>
          <div class="scroll-body">
            <div v-for="person in dutyStaff" :key="person.id" class="duty-item">
              <el-avatar :size="30" :src="person.staffAvatar">{{ (person.staffName || '').slice(0, 1) }}</el-avatar>
              <div class="resident-meta">
                <div class="resident-name-text">{{ person.staffName }}<span class="resident-room">{{ person.remark || '值班人员' }}</span></div>
                <div class="resident-days">{{ person.staffPhone || '未登记联系电话' }}</div>
              </div>
              <!-- 在岗是常态不标色；被排了班但人已离职才提醒 -->
              <el-tag v-if="person.enabled === 0" size="small" type="danger" effect="light">已离职</el-tag>
            </div>
            <el-empty v-if="!dutyStaff.length" description="今日尚未排值班" :image-size="40" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="15" class="flex-col">
        <el-card shadow="never" class="inner-card">
          <template #header>
            <div class="inner-header">
              <span>最新公告</span>
              <el-button link type="primary" size="small" @click="openNoticeDrawer">更多公告 →</el-button>
            </div>
          </template>
          <div class="scroll-body">
            <div v-for="notice in notices" :key="notice.id" class="notice-item" @click="openNotice(notice)">
              <div class="notice-main">
                <el-tag size="small" :type="notice.tagType || 'info'" effect="light">{{ notice.tag }}</el-tag>
                <span class="notice-title">{{ notice.title }}</span>
              </div>
              <div class="notice-right">
                <span class="notice-date">{{ notice.date }}</span>
                <span class="notice-more">查看<el-icon><ArrowRight /></el-icon></span>
              </div>
            </div>
            <el-empty v-if="!notices.length" description="暂无生效公告" :image-size="40" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 合同概况：数据来自首页合同统计接口 /intra/care/home/contractStats -->
    <div class="action-bar">
      <span class="action-label"><el-icon><Document /></el-icon>合同</span>
      <span class="action-metric">待签署 <b>{{ contracts.pending }}</b> 份</span>
      <span class="action-metric">已签署 <b>{{ contracts.signed }}</b> 份</span>
      <span class="action-metric">本月新签 <b>{{ contracts.monthSigned }}</b> 份</span>
      <span class="action-metric" :class="{ 'action-metric--warn': contracts.expiringSoon > 0 }">30 天内到期 <b>{{ contracts.expiringSoon }}</b> 份</span>
      <span class="action-metric" :class="{ 'action-metric--warn': contracts.expired > 0 }">已逾期 <b>{{ contracts.expired }}</b> 份</span>
      <el-button class="action-btn" type="primary" link @click="$router.push('/kh/contract')">合同管理 →</el-button>
    </div>

    <!-- 常用功能：路径均与 sys_menu 中真实存在的菜单一致 -->
    <el-card shadow="never" class="shortcut-card">
      <template #header>
        <div class="inner-header"><span>常用功能</span></div>
      </template>
      <div class="shortcut-grid">
        <div v-for="sc in shortcuts" :key="sc.path" class="shortcut-item" @click="$router.push(sc.path)">
          <div class="shortcut-icon" :style="{ background: sc.bg }">
            <el-icon :size="20" :color="sc.color"><component :is="sc.icon" /></el-icon>
          </div>
          <div class="shortcut-label">{{ sc.label }}</div>
        </div>
      </div>
    </el-card>

    <!-- 开源信息 & 技术咨询服务 -->
    <el-row :gutter="12" class="detail-row footer-row">
      <el-col :xs="24" :md="13" class="flex-col">
        <el-card shadow="never" class="inner-card info-card">
          <template #header>
            <div class="inner-header">
              <span><el-icon><Connection /></el-icon> 开源信息</span>
              <el-tag size="small" type="success" effect="plain">MIT License</el-tag>
            </div>
          </template>
          <div class="info-body">
            <p class="info-desc">
              本项目 <b>小护康养 mini</b> 基于 <b>RuoYi-Vue3</b> 骨架二次开发，前端单份代码通过后端动态路由
              同时支撑平台运营端与机构端。代码遵循 MIT 协议开源，欢迎自由使用、修改与分发。
            </p>
            <div class="stack-tags">
              <span class="stack-tag" v-for="t in techStack" :key="t">{{ t }}</span>
            </div>
            <div class="repo-grid">
              <a class="repo-item" href="https://github.com/xiaohucare/xiaohucare-mini-vue" target="_blank" rel="noopener">
                <el-icon class="repo-item-icon"><Link /></el-icon>
                <span class="repo-item-text"><span class="repo-item-name">前端 · GitHub</span><span class="repo-item-sub">xiaohucare/mini-vue</span></span>
              </a>
              <a class="repo-item" href="https://gitee.com/chongkelai/xiaohucare-mini-vue" target="_blank" rel="noopener">
                <el-icon class="repo-item-icon"><Link /></el-icon>
                <span class="repo-item-text"><span class="repo-item-name">前端 · Gitee</span><span class="repo-item-sub">chongkelai/mini-vue</span></span>
              </a>
              <a class="repo-item" href="https://github.com/xiaohucare/xiaohucare-mini" target="_blank" rel="noopener">
                <el-icon class="repo-item-icon"><Link /></el-icon>
                <span class="repo-item-text"><span class="repo-item-name">后端 · GitHub</span><span class="repo-item-sub">xiaohucare/mini</span></span>
              </a>
              <a class="repo-item" href="https://gitee.com/chongkelai/xiaohucare-mini" target="_blank" rel="noopener">
                <el-icon class="repo-item-icon"><Link /></el-icon>
                <span class="repo-item-text"><span class="repo-item-name">后端 · Gitee</span><span class="repo-item-sub">chongkelai/mini</span></span>
              </a>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="11" class="flex-col">
        <el-card shadow="never" class="inner-card info-card">
          <template #header>
            <div class="inner-header">
              <span><el-icon><Service /></el-icon> 技术咨询服务</span>
            </div>
          </template>
          <div class="info-body">
            <ul class="service-list">
              <li>私有化部署 · 环境搭建与上线指导</li>
              <li>定制化开发 · 机构业务流程适配</li>
              <li>系统集成 · HIS / 智能硬件 / 视频物联对接</li>
              <li>技术培训 · 二开规范与运维支持</li>
            </ul>
            <div class="service-contact">
              <span class="contact-label">咨询邮箱</span>
              <span class="contact-value">
                chongkelai@qq.com
                <el-button link type="primary" size="small" @click="copyText('chongkelai@qq.com')">复制</el-button>
              </span>
            </div>
            <div class="service-wx">
              <el-image class="wx-qrcode" :src="wxQrcode" :preview-src-list="[wxQrcode]" :initial-index="0" fit="contain" preview-teleported />
              <div class="wx-tip">
                <span class="contact-label">微信咨询</span>
                <p class="wx-desc">扫码添加微信，获取产品演示、部署与定制开发等技术支持。</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 公告详情：后端返回富文本 HTML，列表预览已另存为纯文本；详情按富文本渲染（内容为管理端公告编辑器产出，与文章详情一致） -->
    <el-dialog v-model="noticeOpen" :title="noticeDetail.title || '公告详情'" width="520px">
      <div class="notice-full-meta">{{ noticeDetail.tag }} · {{ noticeDetail.date }}</div>
      <div class="notice-full-content" v-html="noticeDetail.content"></div>
      <template #footer>
        <el-button round @click="noticeOpen = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 更多公告：右侧抽屉翻页列表，对接 StoreNoticeController /intra/care/notice/list -->
    <el-drawer v-model="noticeDrawerOpen" title="公告列表" direction="rtl" size="460px">
      <div class="notice-drawer-body">
        <el-input v-model="noticeQuery.noticeTitle" placeholder="请输入公告标题搜索" clearable prefix-icon="Search" @keyup.enter="handleNoticeSearch" @clear="handleNoticeSearch" />
        <div v-loading="noticeLoading" class="notice-drawer-list">
          <div v-for="item in drawerNotices" :key="item.noticeId" class="notice-item" @click="openDrawerNotice(item)">
            <div class="notice-main">
              <el-tag size="small" :type="item.noticeType === '1' ? 'primary' : 'warning'" effect="light">{{ item.noticeType === '1' ? '通知' : '公告' }}</el-tag>
              <span class="notice-title">{{ item.noticeTitle }}</span>
            </div>
            <div class="notice-right">
              <span class="notice-date">{{ parseTime(item.createTime, '{y}-{m}-{d}') }}</span>
              <span class="notice-more">查看<el-icon><ArrowRight /></el-icon></span>
            </div>
          </div>
          <el-empty v-if="!noticeLoading && !drawerNotices.length" description="暂无公告数据" :image-size="40" />
        </div>
        <div class="notice-drawer-footer">
          <span class="notice-total">共 {{ noticeTotal }} 条</span>
          <el-pagination v-model:current-page="noticeQuery.pageNum" :page-size="noticeQuery.pageSize" :total="noticeTotal" layout="prev, pager, next" size="small" background @current-change="getDrawerNoticeList" />
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup name="DashboardHome">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBoardingStats, getSpaceUsage, getBoardingResidents, getTodayAppointments, getTodayDuty, getNotices, getStoreNoticeList, getContractStats } from '@/api/care/home'
import { parseTime } from '@/utils/ruoyi'
import wxQrcode from '@/assets/images/xhc_wx.jpg'

const todayStr = computed(() => {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week[d.getDay()]}`
})


// 在住长者状态（后端返回 NORMAL / ATTENTION / ABNORMAL / ISOLATION）
const residentStatusMap = {
  NORMAL:    { label: '正常',   type: 'success' },
  ATTENTION: { label: '需关注', type: 'warning' },
  ABNORMAL:  { label: '异常',   type: 'danger'  },
  ISOLATION: { label: '隔离',   type: 'info'    }
}
function residentStatusLabel(s) { return residentStatusMap[s]?.label || '正常' }
function residentStatusType(s)  { return residentStatusMap[s]?.type  || 'success' }

function formatHourMinute(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 复制咨询邮箱：优先 Clipboard API，降级到 execCommand
function copyText(text) {
  const done = () => ElMessage.success(`已复制：${text}`)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
  } else {
    fallbackCopy(text, done)
  }
}
function fallbackCopy(text, done) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  try { document.execCommand('copy'); done() } catch (e) { ElMessage.error('复制失败，请手动选择') }
  document.body.removeChild(el)
}

const stats = ref({ todayAppointments: 0, currentBoarding: 0, todayCheckouts: 0, abnormalCount: 0 })
const spaceUsage = ref([])
const residents = ref([])
const appointments = ref([])
const contracts = ref({ pending: 0, signed: 0, completed: 0, voided: 0, total: 0, monthSigned: 0, expiringSoon: 0, expired: 0 })
const dutyStaff = ref([])
const notices = ref([])
const noticeOpen = ref(false)
const noticeDetail = ref({})

// 常用功能入口
const shortcuts = [
  { label: '到店登记', icon: 'Tickets',        bg: '#f0f9eb', color: '#67C23A', path: '/eyang/checkin' },
  { label: '离店交接', icon: 'Promotion',      bg: '#fdf6ec', color: '#E6A23C', path: '/eyang/checkout' },
  { label: '离店结算', icon: 'Money',          bg: '#fef0f0', color: '#F56C6C', path: '/eyang/settlement' },
  { label: '日程管理', icon: 'Calendar',       bg: '#ecf5ff', color: '#409EFF', path: '/eyang/boarding' },
  { label: '房间床铺', icon: 'OfficeBuilding', bg: '#ecf5ff', color: '#409EFF', path: '/eyang/space' },
  { label: '值班排班', icon: 'Clock',          bg: '#f4f4f5', color: '#909399', path: '/eyang/duty' },
  { label: '预约管理', icon: 'Postcard',       bg: '#f0f9eb', color: '#67C23A', path: '/eyang/appointment' },
  { label: '长者档案', icon: 'User',           bg: '#fef0f0', color: '#F56C6C', path: '/kh/resident' },
  { label: '会员卡',   icon: 'CreditCard',     bg: '#f5f0ff', color: '#7C3AED', path: '/kh/card' },
  { label: '合同管理', icon: 'Document',       bg: '#f5f0ff', color: '#7C3AED', path: '/kh/contract' },
  { label: '合同模板', icon: 'Notebook',       bg: '#f5f0ff', color: '#7C3AED', path: '/kh/contract-template' },
  { label: '收费套餐', icon: 'Coin',           bg: '#fdf6ec', color: '#E6A23C', path: '/st/hotel_packages' },
  { label: '结算统计', icon: 'DataLine',       bg: '#ecf5ff', color: '#409EFF', path: '/st/billing' },
  { label: '膳食管理', icon: 'Bowl',           bg: '#fdf6ec', color: '#E6A23C', path: '/ys/meals' },
  { label: '智能监护', icon: 'Location',       bg: '#f0f9eb', color: '#67C23A', path: '/e_gps/fence' },
  { label: '员工管理', icon: 'UserFilled',     bg: '#f4f4f5', color: '#909399', path: '/store/employee' }
]

// 开源信息卡片的技术栈标签
const techStack = ['Vue 3', 'Element Plus', 'Vite 6', 'Pinia', 'ECharts', 'vue-i18n', 'Axios']

// 后端统一用 R.ok()，成功码为 0（不是 200），各接口都按 res.code === 0 判断
function loadStats() {
  getBoardingStats().then(res => {
    if (res.code === 0 && res.data) stats.value = { ...stats.value, ...res.data }
  }).catch(() => {})
}

function loadSpaceUsage() {
  getSpaceUsage().then(res => {
    if (res.code === 0 && Array.isArray(res.data)) spaceUsage.value = res.data
  }).catch(() => {})
}

function loadResidents() {
  getBoardingResidents().then(res => {
    if (res.code === 0 && Array.isArray(res.data)) residents.value = res.data
  }).catch(() => {})
}

function loadAppointments() {
  getTodayAppointments().then(res => {
    if (res.code === 0 && Array.isArray(res.data)) appointments.value = res.data
  }).catch(() => {})
}

// 首页合同统计：后端一次返回各状态份数与到期提醒，不再按状态分页取总数发两次请求
function loadContracts() {
  getContractStats().then(res => {
    if (res.code === 0 && res.data) contracts.value = { ...contracts.value, ...res.data }
  }).catch(() => {})
}


// 值班与公告字段直接沿用后端返回（staffName/remark/staffPhone 与 tag/tagType/date/desc/content）
function loadDuty() {
  getTodayDuty().then(res => {
    if (res.code === 0 && Array.isArray(res.data)) dutyStaff.value = res.data
  }).catch(() => {})
}

function loadNotices() {
  getNotices().then(res => {
    if (res.code === 0 && Array.isArray(res.data)) notices.value = res.data
  }).catch(() => {})
}

function openNotice(notice) {
  noticeDetail.value = notice
  noticeOpen.value = true
}

/* 更多公告抽屉：对接 /intra/care/notice/list（TableDataInfo：rows/total），翻页 + 标题搜索 */
const noticeDrawerOpen = ref(false)
const noticeLoading = ref(false)
const drawerNotices = ref([])
const noticeTotal = ref(0)
const noticeQuery = reactive({ pageNum: 1, pageSize: 10, noticeTitle: '' })

function getDrawerNoticeList() {
  noticeLoading.value = true
  getStoreNoticeList(noticeQuery).then(res => {
    drawerNotices.value = res.rows || []
    noticeTotal.value = res.total || 0
  }).finally(() => { noticeLoading.value = false })
}

function handleNoticeSearch() {
  noticeQuery.pageNum = 1
  getDrawerNoticeList()
}

function openNoticeDrawer() {
  noticeDrawerOpen.value = true
  handleNoticeSearch()
}

// 抽屉行转成首页公告详情弹窗的数据口径（ noticeType: 1通知 2公告 ）
function openDrawerNotice(item) {
  noticeDetail.value = {
    title: item.noticeTitle,
    tag: item.noticeType === '1' ? '通知' : '公告',
    date: parseTime(item.createTime, '{y}-{m}-{d}'),
    content: item.noticeContent
  }
  noticeOpen.value = true
}

function loadOverview() {
  loadStats()
  loadSpaceUsage()
  loadResidents()
  loadAppointments()
  loadContracts()
  loadDuty()
  loadNotices()
}

onMounted(() => {
  loadOverview()
})
</script>

<style scoped>
.dashboard-home {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 欢迎栏 */
.welcome-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  padding: 20px 28px;
  margin-bottom: 16px;
  color: #fff;
}
.welcome-left  { display: flex; align-items: center; gap: 16px; }
.welcome-avatar {
  width: 56px; height: 56px;
  background: rgba(255,255,255,0.15); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.welcome-title { font-size: 19px; font-weight: 700; margin-bottom: 3px; }
.welcome-sub   { font-size: 13px; opacity: 0.85; }
.welcome-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.welcome-right :deep(.el-button--primary.is-link),
.welcome-right :deep(.el-button.is-link) { color: #fff; opacity: 0.9; }

/* 统计卡片 */
.stats-row { margin-bottom: 16px; }
.stats-col { display: flex; margin-bottom: 10px; }
.stat-card {
  position: relative;
  flex: 1;
  display: flex;
  background: #fff; border-radius: 12px;
  border: 1.5px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden; transition: all 0.2s; cursor: pointer;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
.stat-card--warn { border-color: #fde2e2; background: linear-gradient(135deg, #fff 80%, #fff0f0 100%); }
.stat-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 3px; border-radius: 0 0 12px 12px;
}
.stat-card--v {
  flex-direction: column; align-items: center; justify-content: center;
  padding: 14px 6px 20px; gap: 3px; text-align: center;
}
.stat-icon-wrap-md {
  font-size: 22px; width: 40px; height: 40px;
  border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  margin-bottom: 2px;
}
.stat-num-md   { font-size: 24px; font-weight: 700; color: #1d2129; line-height: 1.1; }
.stat-label-md { font-size: 12px; color: #86909c; }

/* 明细区 */
.detail-row { margin-bottom: 16px; }
.flex-col { display: flex; flex-direction: column; margin-bottom: 12px; }
.inner-card { flex: 1; display: flex; flex-direction: column; }
.inner-card :deep(.el-card__header) { padding: 10px 14px; flex-shrink: 0; }
.inner-card :deep(.el-card__body)   { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.inner-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; font-weight: 600;
}

.scroll-body {
  flex: 1;
  min-height: 180px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.scroll-body::-webkit-scrollbar { width: 4px; }
.scroll-body::-webkit-scrollbar-track { background: transparent; }
.scroll-body::-webkit-scrollbar-thumb { background: #e4e7ed; border-radius: 2px; }
.scroll-body::-webkit-scrollbar-thumb:hover { background: #c0c4cc; }

/* 床位占用 */
.space-item { padding: 6px 8px; background: #f5f7fa; border-radius: 8px; }
.space-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.space-name  { font-size: 13px; font-weight: 500; color: #1d2129; }
.space-count { font-size: 13px; font-weight: 600; color: #1d2129; }
.space-total   { color: #c0c4cc; font-weight: 400; }

/* 在住长者 / 今日预约 列表项 */
.resident-item, .appt-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; background: #f5f7fa; border-radius: 8px; }
.resident-meta  { flex: 1; min-width: 0; }
.resident-name-text { font-size: 13px; font-weight: 600; color: #1d2129; }
.resident-room      { font-size: 11px; color: #86909c; font-weight: 400; margin-left: 6px; }
.resident-days      { font-size: 11px; color: #86909c; margin-top: 1px; }
.appt-time {
  flex-shrink: 0; width: 46px; text-align: center;
  font-size: 13px; font-weight: 600; color: #409EFF;
}

/* 当日值班 */
.duty-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; background: #f5f7fa; border-radius: 8px; }

/* 公告列表 */
.notice-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #e4e7ed;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
}
.notice-item:hover { background: #f0f5ff; border-left-color: #409EFF; }
.notice-main  { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.notice-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.notice-title { font-size: 13px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notice-date  { font-size: 11px; color: #c0c4cc; }
.notice-more  { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: #409EFF; opacity: 0; transition: opacity 0.15s; }
.notice-item:hover .notice-more { opacity: 1; }
.notice-full-meta { font-size: 12px; color: #86909c; margin-bottom: 10px; }
.notice-full-content { font-size: 13px; color: #1d2129; line-height: 1.7; word-break: break-word; }
.notice-full-content :deep(img) { max-width: 100%; height: auto; }
.notice-full-content :deep(p) { margin: 0 0 8px; }
.notice-full-content :deep(p:last-child) { margin-bottom: 0; }
.notice-full-content :deep(h1),
.notice-full-content :deep(h2),
.notice-full-content :deep(h3) { margin: 10px 0 8px; font-weight: 700; }
.notice-full-content :deep(ul),
.notice-full-content :deep(ol) { padding-left: 20px; margin: 0 0 8px; }
.notice-full-content :deep(a) { color: #409EFF; }

/* 更多公告抽屉 */
.notice-drawer-body { display: flex; flex-direction: column; height: 100%; gap: 12px; }
.notice-drawer-list {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e4e7ed; border-radius: 2px; }
}
.notice-drawer-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 10px; border-top: 1px solid #f0f0f0; flex-shrink: 0;
}
.notice-total { font-size: 12px; color: #86909c; }

/* 合同待办条 */
.action-bar {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  background: #fff; border: 1.5px solid #f0f0f0; border-radius: 12px;
  padding: 12px 18px; margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.action-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #1d2129; }
.action-metric { font-size: 13px; color: #4e5969; }
.action-metric b { font-size: 16px; color: #1d2129; margin-left: 2px; }
.action-metric--warn b { color: #F56C6C; }
.action-btn { margin-left: auto; }

/* 常用功能 */
.shortcut-card { margin-bottom: 0; }
.shortcut-card :deep(.el-card__header) { padding: 10px 14px; }
.shortcut-card :deep(.el-card__body) { padding: 14px 16px; }
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px 10px;
}
.shortcut-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: transform 0.15s;
}
.shortcut-item:hover { transform: translateY(-3px); }
.shortcut-icon {
  width: 44px; height: 44px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
}
.shortcut-label { font-size: 12px; color: #606266; text-align: center; }

/* 开源信息 & 技术咨询服务 */
.footer-row { margin-top: 16px; margin-bottom: 0; }
.info-card .inner-header span { display: inline-flex; align-items: center; gap: 5px; }
.info-body { display: flex; flex-direction: column; gap: 12px; }
.info-desc { margin: 0; font-size: 12.5px; line-height: 1.7; color: #4e5969; }
.info-desc b { color: #1d2129; font-weight: 600; }
.stack-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.stack-tag {
  font-size: 11.5px; color: #4e5969; padding: 2px 10px; border-radius: 4px;
  background: #f0f5ff; border: 1px solid #dfeaff;
}
.repo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.repo-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px; text-decoration: none;
  background: #f5f7fa; border: 1px solid #eef0f3; transition: all 0.15s; min-width: 0;
}
.repo-item:hover { border-color: #cfe3ff; background: #f0f5ff; transform: translateY(-1px); }
.repo-item-icon { font-size: 15px; color: #909399; flex-shrink: 0; }
.repo-item:hover .repo-item-icon { color: #409EFF; }
.repo-item-text { display: flex; flex-direction: column; min-width: 0; }
.repo-item-name { font-size: 12.5px; font-weight: 600; color: #1d2129; }
.repo-item-sub { font-size: 11px; color: #86909c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.service-list { margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.9; color: #4e5969; }
.service-list li { list-style: disc; }
.service-contact {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 12px; background: #f5f7fa; border-radius: 8px; margin-top: 2px;
}
.contact-label { font-size: 12px; color: #86909c; flex-shrink: 0; }
.contact-value { font-size: 12.5px; font-weight: 600; color: #1d2129; word-break: break-all; }
.service-wx { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #f5f7fa; border-radius: 8px; }
.wx-qrcode { width: 84px; height: 84px; flex-shrink: 0; border-radius: 6px; background: #fff; cursor: zoom-in; }
.wx-tip { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.wx-desc { margin: 0; font-size: 12px; line-height: 1.6; color: #4e5969; }
</style>
