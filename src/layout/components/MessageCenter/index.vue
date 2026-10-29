<template>
  <!-- 触发器：铃铛 + 未读角标，有未读时呼吸光晕、悬停摇摆；
       组件为多根节点无法自动继承父级传入的 class，right-menu-item/hover-effect 需内联声明才能与 size-select 等图标同尺寸 -->
  <el-tooltip content="消息中心" effect="dark" placement="bottom">
    <div class="msg-center-trigger right-menu-item hover-effect" :class="{ 'has-unread': totalUnread > 0 }" @click="openDrawer">
      <el-badge :value="totalUnread" :max="99" :hidden="totalUnread === 0" class="msg-badge">
        <span class="bell-halo"></span>
        <el-icon :size="20" class="msg-bell-icon"><Bell /></el-icon>
      </el-badge>
    </div>
  </el-tooltip>

  <!-- 消息中心右侧抽屉：对接 api/store/message.js（browse/listStat/tips/browse/tips/read/detail） -->
  <el-drawer v-model="drawerVisible" direction="rtl" size="430px" class="msg-center-drawer">
    <template #header>
      <div class="msg-drawer-header">
        <div class="header-left">
          <div class="header-icon">
            <el-icon :size="16"><Bell /></el-icon>
          </div>
          <div class="header-text">
            <span class="msg-drawer-title">消息中心</span>
            <span class="msg-drawer-sub">未读 {{ totalUnread }} 条 · 共 {{ stat.total || 0 }} 条</span>
          </div>
        </div>
        <div class="header-actions">
          <el-button size="small" round plain icon="Check" @click="handleReadAll" v-if="canReadTips">全部已读</el-button>
          <el-button size="small" round type="primary" plain icon="EditPen" @click="goMessagePage">管理</el-button>
        </div>
      </div>
    </template>

    <!-- 状态统计卡片：点击可按状态筛选列表，再次点击取消 -->
    <div class="msg-stat">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="[card.key, { active: isStatActive(card) }]"
        @click="toggleStateFilter(card)"
      >
        <span class="stat-num">{{ card.value }}</span>
        <span class="stat-label">{{ card.label }}</span>
      </div>
    </div>

    <!-- 分类页签（全部/系统/活动/交易），带未读数角标 -->
    <el-tabs v-model="activeTab" class="msg-tabs" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in tabList" :key="tab.name" :name="tab.name">
        <template #title>
          <span>{{ tab.label }}</span>
          <el-badge v-if="tab.unread > 0" :value="tab.unread" :max="99" class="tab-badge" />
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-input
      v-model="queryParams.title"
      placeholder="搜索消息标题"
      size="small"
      clearable
      prefix-icon="Search"
      class="msg-search"
      @keyup.enter="handleQuery"
      @clear="handleQuery"
    />

    <div v-loading="loading" class="msg-list">
      <transition-group name="msg-fade">
        <div
          v-for="msg in messageList"
          :key="msg.id"
          class="msg-item"
          :class="{ expanded: expandedId === msg.id }"
          @click="toggleDetail(msg)"
        >
          <div class="msg-item-main">
            <!-- 分类图标 -->
            <div class="cat-icon" :class="'cat-' + (msg.tipsType ?? 0)">
              <el-icon :size="16"><component :is="tipsIcon(msg.tipsType)" /></el-icon>
            </div>
            <div class="msg-item-body">
              <div class="msg-item-top">
                <span class="msg-item-title">
                  <span v-if="isNew(msg)" class="new-dot"></span>
                  {{ msg.title }}
                </span>
                <el-icon class="msg-chevron"><ArrowRight /></el-icon>
              </div>
              <div class="msg-item-meta">
                <el-tag size="small" effect="plain" :type="getTipsTag(msg.tipsType)">{{ getTipsName(msg.tipsType) }}</el-tag>
                <el-tag size="small" :type="getStateTag(msg.state)">{{ getStateName(msg.state) }}</el-tag>
                <span class="msg-time">{{ parseTime(msg.createAt, '{m}-{d} {h}:{i}') }}</span>
                <span class="msg-views">
                  <el-icon :size="12"><View /></el-icon>{{ msg.viewCount || 0 }}
                </span>
              </div>
            </div>
          </div>
          <!-- 详情富文本：点击展开时经 detail 接口加载并累加浏览量 -->
          <div v-if="expandedId === msg.id" class="msg-content" v-html="msg.content"></div>
        </div>
      </transition-group>
      <el-empty v-if="!loading && !messageList.length" description="暂无消息" :image-size="60" />
    </div>

    <div class="msg-footer">
      <el-pagination
        v-if="total > queryParams.pageSize"
        v-model:current-page="queryParams.pageNum"
        :page-size="queryParams.pageSize"
        :total="total"
        layout="prev, pager, next"
        size="small"
        background
        @current-change="getList"
      />
      <el-button class="msg-view-all" text type="primary" @click="goMessagePage">查看全部消息 →</el-button>
    </div>
  </el-drawer>
</template>

<script setup>
import { getMessageList, getMessageDetail, getMessageStat, getMessageTips, readMessageTips } from '@/api/care/message'
import { checkPermi } from '@/utils/permission'
import { parseTime } from '@/utils/ruoyi'

const router = useRouter()

const drawerVisible = ref(false)
const loading = ref(false)
const messageList = ref([])
const total = ref(0)
const expandedId = ref(null)
const activeTab = ref('all')
const activeStat = ref(null) // 当前按状态筛选值：null=不过滤 0/1/2
const stat = reactive({})
const unreadMap = ref({})
const lastIdMap = ref({}) // 各分类最新一条消息 id（tips.lastId），用于"新消息"标记
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: undefined })

const tipsTypes = [
  { value: 0, label: '系统' },
  { value: 1, label: '活动' },
  { value: 2, label: '交易' }
]

// 细粒度权限：tips/read 需要 edit，detail 需要 query；无权限时不发请求也不渲染入口，避免后端 403 弹提示
const canReadTips = computed(() => checkPermi(['care:storemessage:edit']))
const canQueryDetail = computed(() => checkPermi(['care:storemessage:query']))

/** 分类图标：系统=设置齿轮 活动=旗帜 交易=银行卡 */
function tipsIcon(tipsType) {
  const icons = { 0: 'Setting', 1: 'Flag', 2: 'CreditCard' }
  return icons[tipsType] || 'Setting'
}

// 总未读数 = 各分类 tips count 之和
const totalUnread = computed(() => Object.values(unreadMap.value).reduce((s, n) => s + (n || 0), 0))

const tabList = computed(() => [
  { name: 'all', label: '全部', unread: totalUnread.value },
  ...tipsTypes.map(t => ({ name: String(t.value), label: t.label, unread: unreadMap.value[t.value] || 0 }))
])

// 统计卡片：全部 + 三个状态
const statCards = computed(() => [
  { key: 'all', label: '全部', value: stat.total || 0, state: null },
  { key: 'pending', label: '待处理', value: stat.pending || 0, state: 0 },
  { key: 'handled', label: '已处理', value: stat.handled || 0, state: 1 },
  { key: 'closed', label: '已关闭', value: stat.closed || 0, state: 2 }
])

function isStatActive(card) {
  return card.key === 'all' ? activeStat.value === null : activeStat.value === card.state
}

/** 点击统计卡片切换状态筛选 */
function toggleStateFilter(card) {
  activeStat.value = isStatActive(card) ? null : card.state
  queryParams.pageNum = 1
  getList()
}

/** 是否为新消息：与所属分类的 tips.lastId 相同 */
function isNew(msg) {
  return lastIdMap.value[msg.tipsType] != null && String(lastIdMap.value[msg.tipsType]) === String(msg.id)
}

function getTipsName(tipsType) {
  const item = tipsTypes.find(t => t.value === tipsType)
  return item ? item.label : '系统'
}
function getTipsTag(tipsType) {
  const tags = { 0: 'info', 1: 'success', 2: 'warning' }
  return tags[tipsType] || 'info'
}
function getStateName(state) {
  const names = { 0: '待处理', 1: '已处理', 2: '已关闭' }
  return names[state] || '待处理'
}
function getStateTag(state) {
  const tags = { 0: 'danger', 1: 'success', 2: 'info' }
  return tags[state] || 'info'
}

/** 查询列表：与消息页相同口径解析 data.list/rows 与 totalCount/total */
function getList() {
  loading.value = true
  expandedId.value = null
  const params = {
    ...queryParams,
    tipsType: activeTab.value === 'all' ? undefined : Number(activeTab.value),
    state: activeStat.value === null ? undefined : activeStat.value
  }
  getMessageList(params).then(response => {
    const pageData = response.data || {}
    messageList.value = pageData.list || pageData.rows || []
    total.value = pageData.totalCount || pageData.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 查询状态统计 */
function getStat() {
  getMessageStat().then(response => {
    Object.assign(stat, response.data || {})
  })
}

/** 查询未读提示，聚合成 tipsType -> count / lastId 映射 */
function getTips() {
  getMessageTips().then(response => {
    const map = {}
    const idMap = {}
    ;(response.data || []).forEach(item => {
      map[item.tipsType] = item.count || 0
      if (item.lastId != null) idMap[item.tipsType] = item.lastId
    })
    unreadMap.value = map
    lastIdMap.value = idMap
  })
}

function refreshAll() {
  getList()
  getStat()
  getTips()
}

function openDrawer() {
  drawerVisible.value = true
  refreshAll()
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function handleTabChange() {
  queryParams.pageNum = 1
  getList()
}

/** 点击条目展开/收起详情（detail 接口顺带累加浏览量） */
function toggleDetail(msg) {
  if (expandedId.value === msg.id) {
    expandedId.value = null
    return
  }
  expandedId.value = msg.id
  // 无 query 权限时只展开已有内容，不调 detail 接口（列表接口未返回正文时展不开）
  if (!msg.content && canQueryDetail.value) {
    getMessageDetail(msg.id).then(response => {
      const detail = response.data || {}
      msg.content = detail.content
      msg.viewCount = detail.viewCount != null ? detail.viewCount : (msg.viewCount || 0) + 1
      getStat()
    })
  }
}

/** 全部已读：按当前分类清零未读数，'全部' 页签则清零所有分类 */
function handleReadAll() {
  const data = activeTab.value === 'all' ? {} : { tipsType: Number(activeTab.value) }
  readMessageTips(data).then(() => {
    ElMessage.success('已全部标记为已读')
    getTips()
  })
}

/** 跳转门店消息管理页（http://localhost/ys/store-message） */
function goMessagePage() {
  drawerVisible.value = false
  // 路由由 sys_menu 动态生成：优先按菜单 route_name(storemessage) 跳转，目录路径调整也不受影响；
  // 未注册时回退到实际路径 /ys/store-message
  if (router.hasRoute('storemessage')) {
    router.push({ name: 'storemessage' }).catch(() => router.push('/ys/store-message'))
  } else {
    router.push('/ys/store-message').catch(() => {})
  }
}

// 徽标需要未读数，进入系统即拉取一次
onMounted(() => {
  getTips()
})
</script>

<style lang="scss" scoped>
.msg-center-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 与 Navbar 内 right-menu-item/hover-effect 同尺寸规格（尺寸对齐 size-select 等 18px 图标） */
  height: 100%;
  padding: 0 8px;
  font-size: 30px;
  color: #5a5e66;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.025);
  }

  .msg-badge {
    position: relative;
  }

  // 未读呼吸光晕
  .bell-halo {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.18) 0%, transparent 70%);
    opacity: 0;
    pointer-events: none;
  }

  &.has-unread .bell-halo {
    opacity: 1;
    animation: msg-halo-pulse 2s ease-in-out infinite;
  }

  .msg-bell-icon {
    color: #5a5e66;
    transition: color 0.2s, transform 0.2s;
  }

  &:hover {
    .msg-bell-icon {
      color: #409eff;
      animation: msg-bell-swing 0.6s ease-in-out;
    }
  }
}

@keyframes msg-halo-pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 1; }
}

@keyframes msg-bell-swing {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(14deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(6deg); }
  80% { transform: rotate(-4deg); }
}
</style>

<style lang="scss">
/* el-drawer 内容经 teleport 渲染到 body，抽屉样式使用非 scoped + 类名前缀隔离 */
.msg-center-drawer {
  .el-drawer__header {
    margin-bottom: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f0f2f5;
  }

  .el-drawer__body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-top: 0;
  }

  /* ---------- 头部 ---------- */
  .msg-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: linear-gradient(135deg, #66b1ff, #409eff);
      box-shadow: 0 4px 10px rgba(64, 158, 255, 0.35);
    }

    .header-text {
      display: flex;
      flex-direction: column;
      line-height: 1.3;

      .msg-drawer-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .msg-drawer-sub {
        font-size: 12px;
        color: #a8abb2;
      }
    }
  }

  /* ---------- 统计卡片 ---------- */
  .msg-stat {
    display: flex;
    gap: 8px;
    padding-bottom: 12px;

    .stat-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 10px 4px 8px;
      border-radius: 10px;
      border: 1px solid #f0f0f0;
      background: #fafbfc;
      cursor: pointer;
      transition: all 0.2s;

      .stat-num {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.2;
        color: #303133;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      &.all {
        .stat-num { color: #409eff; }
        &.active { border-color: #409eff; background: rgba(64, 158, 255, 0.08); }
      }

      &.pending {
        .stat-num { color: #f56c6c; }
        &.active { border-color: #f56c6c; background: rgba(245, 108, 108, 0.08); }
      }

      &.handled {
        .stat-num { color: #67c23a; }
        &.active { border-color: #67c23a; background: rgba(103, 194, 58, 0.08); }
      }

      &.closed {
        .stat-num { color: #909399; }
        &.active { border-color: #909399; background: rgba(144, 147, 153, 0.1); }
      }
    }
  }

  /* ---------- 页签与搜索 ---------- */
  .msg-tabs {
    .el-tabs__header {
      margin-bottom: 8px;
    }

    .el-tabs__nav-wrap::after {
      height: 1px;
      background-color: #f0f2f5;
    }

    .tab-badge {
      margin-left: 8px;
      margin-top: -8px;
      vertical-align: middle;

      .el-badge__content.is-fixed {
        right: 4px;
      }
    }
  }

  .msg-search {
    margin-bottom: 10px;

    .el-input__wrapper {
      border-radius: 8px;
    }
  }

  /* ---------- 消息列表 ---------- */
  .msg-list {
    flex: 1;
    overflow-y: auto;
    margin: 0 -4px;
    padding: 0 4px;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }

    .msg-item {
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;

      &:hover {
        background-color: #f7f9fc;

        .msg-chevron {
          opacity: 1;
          color: #409eff;
        }
      }

      &.expanded {
        background-color: #f7f9fc;
        border-color: #e3ecf7;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);

        .msg-item-title {
          color: #409eff;
        }

        .msg-chevron {
          opacity: 1;
          transform: rotate(90deg);
          color: #409eff;
        }
      }

      & + .msg-item {
        margin-top: 4px;
      }

      .msg-item-main {
        display: flex;
        gap: 10px;
      }

      /* 分类图标 */
      .cat-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        margin-top: 2px;

        &.cat-0 { background: linear-gradient(135deg, #a1abff, #7d8cf8); }
        &.cat-1 { background: linear-gradient(135deg, #6fe3a5, #45c784); }
        &.cat-2 { background: linear-gradient(135deg, #ffd48a, #f5b544); }
      }

      .msg-item-body {
        flex: 1;
        min-width: 0;
      }

      .msg-item-top {
        display: flex;
        align-items: center;
        gap: 8px;

        .msg-item-title {
          flex: 1;
          font-size: 14px;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;

          .new-dot {
            flex-shrink: 0;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-right: 6px;
            background: #f56c6c;
            box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.15);
            animation: msg-dot-blink 1.6s ease-in-out infinite;
          }
        }

        .msg-chevron {
          flex-shrink: 0;
          font-size: 12px;
          color: #c0c4cc;
          opacity: 0;
          transition: all 0.25s;
        }
      }

      .msg-item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
        font-size: 12px;
        color: #909399;

        .msg-time, .msg-views {
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .msg-views {
          margin-left: auto;
        }
      }

      /* 详情富文本 */
      .msg-content {
        margin-top: 10px;
        padding: 12px 14px;
        background-color: #fff;
        border: 1px solid #ebeef5;
        border-radius: 10px;
        font-size: 13px;
        line-height: 1.75;
        color: #606266;
        max-height: 280px;
        overflow-y: auto;
        animation: msg-content-in 0.25s ease;

        img {
          max-width: 100%;
          border-radius: 6px;
        }

        p {
          margin: 4px 0;
        }
      }
    }
  }

  /* ---------- 底部 ---------- */
  .msg-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid #f0f2f5;

    .msg-view-all {
      font-size: 13px;
    }
  }

  @keyframes msg-dot-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  @keyframes msg-content-in {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 列表进出场动画 */
  .msg-fade-enter-active {
    transition: all 0.3s ease;
  }

  .msg-fade-enter-from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
