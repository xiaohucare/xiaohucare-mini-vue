<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb20">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon stat-icon--appointment">&#128197;</div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.todayAppointments }}</div>
            <div class="stat-label">今日预约</div>
          </div>
          <div class="stat-trend stat-trend--up">+2 &#8593;</div>
          <div class="stat-bar stat-bar--appointment"></div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon stat-icon--boarding">&#127968;</div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.currentBoarding }}</div>
            <div class="stat-label">在住长者</div>
          </div>
          <div class="stat-trend stat-trend--normal">在住中</div>
          <div class="stat-bar stat-bar--boarding"></div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon stat-icon--checkout">&#9989;</div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.todayCheckouts }}</div>
            <div class="stat-label">今日退住</div>
          </div>
          <div class="stat-trend stat-trend--out">今日 &#8595;</div>
          <div class="stat-bar stat-bar--checkout"></div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card stat-card--alert" :class="{ 'stat-card--alert-active': statistics.abnormalCount > 0 }">
          <div class="stat-icon stat-icon--alert">&#9888;&#65039;</div>
          <div class="stat-body">
            <div class="stat-value" :style="statistics.abnormalCount > 0 ? 'color:#F56C6C' : ''">{{ statistics.abnormalCount }}</div>
            <div class="stat-label">异常关注</div>
          </div>
          <div class="stat-trend stat-trend--alert" v-if="statistics.abnormalCount > 0">需处理</div>
          <div class="stat-trend stat-trend--normal" v-else>一切正常</div>
          <div class="stat-bar stat-bar--alert"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="mb20">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="$router.push('/eyang/appointment')" round>
              <el-icon><Plus /></el-icon>新增预约
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/eyang/checkin')" round>
              <el-icon><Edit /></el-icon>入住登记
            </el-button>
            <el-button type="warning" size="large" @click="$router.push('/eyang/space')" round>
              <el-icon><OfficeBuilding /></el-icon>空间管理
            </el-button>
            <el-button type="info" size="large" @click="$router.push('/eyang/boarding')" round>
              <el-icon><List /></el-icon>日常记录
            </el-button>
            <el-button type="danger" size="large" @click="$router.push('/eyang/checkout')" round>
              <el-icon><Check /></el-icon>退住办理
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 今日预约 -->
      <el-col :xs="24" :lg="12" class="mb20">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>今日预约入住</span>
              <el-button link type="primary" @click="$router.push('/eyang/appointment')">查看更多</el-button>
            </div>
          </template>
          <el-table :data="todayAppointments" style="width: 100%" size="small">
            <el-table-column label="时间" width="120">
              <template #default="scope">
                {{ formatTime(scope.row.appointmentTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="residentName" label="长者" />
            <el-table-column prop="bedCount" label="床位" width="80" />
            <el-table-column prop="appointerName" label="家属" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.status === 'CONFIRMED' ? 'success' : 'warning'">
                  {{ scope.row.status === 'CONFIRMED' ? '已确认' : '待确认' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="todayAppointments.length === 0" description="今日暂无预约" />
        </el-card>
      </el-col>

      <!-- 当前康养 -->
      <el-col :xs="24" :lg="12" class="mb20">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>在住长者</span>
              <el-button link type="primary" @click="$router.push('/eyang/boarding')">查看更多</el-button>
            </div>
          </template>
          <div class="boarding-residents">
            <div v-for="resident in currentResidents" :key="resident.id" class="boarding-resident-item">
              <el-avatar :size="50" :src="resident.avatar" />
              <div class="resident-info">
                <div class="resident-name">{{ resident.name }}</div>
                <div class="resident-detail">{{ resident.roomName }} | 已住{{ resident.days }}天</div>
              </div>
              <el-tag :type="getStatusType(resident.status)" size="small">{{ getStatusLabel(resident.status) }}</el-tag>
            </div>
          </div>
          <el-empty v-if="currentResidents.length === 0" description="当前无在住长者" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 空间使用情况 -->
      <el-col :xs="24" :lg="12" class="mb20">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>空间使用情况</span>
              <el-button link type="primary" @click="$router.push('/eyang/space')">管理空间</el-button>
            </div>
          </template>
          <div class="space-usage">
            <div v-for="space in spaceUsage" :key="space.type" class="space-item">
              <div class="space-info">
                <span class="space-name">{{ space.name }}</span>
                <span class="space-count">{{ space.occupied }}/{{ space.total }}</span>
              </div>
              <el-progress 
                :percentage="space.percentage" 
                :color="space.color"
                :stroke-width="12"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 待办事项 -->
      <el-col :xs="24" :lg="12" class="mb20">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(todo, index) in todoList"
              :key="index"
              :type="todo.type"
              :timestamp="todo.time"
            >
              {{ todo.content }}
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="todoList.length === 0" description="暂无待办事项" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近动态 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>最近动态</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :type="activity.type"
              :timestamp="activity.time"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="CareDashboard">
import { ref, onMounted } from 'vue'
import { getBoardingStats, getTodayAppointments, getCurrentResidents, getSpaceUsage } from '@/api/care/home'

const statistics = ref({
  todayAppointments: 0,
  currentBoarding: 0,
  todayCheckouts: 0,
  abnormalCount: 0
})

const todayAppointments = ref([])

const currentResidents = ref([])

const spaceUsage = ref([])

const todoList = ref([
  { time: '09:00', content: '张奶奶需要散步活动', type: 'primary' },
  { time: '12:00', content: '李爷爷午餐时间', type: 'success' },
  { time: '14:00', content: '王奶奶家属预约入住', type: 'warning' },
  { time: '17:00', content: '赵爷爷晚餐时间', type: 'primary' }
])

const recentActivities = ref([
  { time: '2026-03-15 09:30', content: '张奶奶完成散步，身体状况良好', type: 'success' },
  { time: '2026-03-15 08:15', content: '李爷爷完成早餐', type: 'primary' },
  { time: '2026-03-15 08:00', content: '王奶奶入住登记完成', type: 'warning' },
  { time: '2026-03-14 18:00', content: '赵爷爷完成晚餐', type: 'primary' },
  { time: '2026-03-14 17:30', content: '张奶奶活动30分钟', type: 'success' }
])

function getStatusType(status) {
  const map = {
    'NORMAL': 'success',
    'ATTENTION': 'warning',
    'ABNORMAL': 'danger',
    'ISOLATION': 'info'
  }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = {
    'NORMAL': '正常',
    'ATTENTION': '需关注',
    'ABNORMAL': '异常',
    'ISOLATION': '隔离'
  }
  return map[status] || status
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  // 如果是日期字符串，提取时间部分或者显示日期
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return dateStr
  }
  // 格式化为 MM-DD
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 加载统计数据
async function loadStats() {
  try {
    const res = await getBoardingStats()
    if (res && res.data) {
      statistics.value = res.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载今日预约
async function loadTodayAppointments() {
  try {
    const res = await getTodayAppointments()
    if (res && res.data) {
      todayAppointments.value = res.data
    }
  } catch (error) {
    console.error('加载今日预约失败:', error)
  }
}

// 加载在住长者
async function loadCurrentResidents() {
  try {
    const res = await getCurrentResidents()
    if (res && res.data) {
      currentResidents.value = res.data
    }
  } catch (error) {
    console.error('加载在住长者失败:', error)
  }
}

// 加载空间使用情况
async function loadSpaceUsage() {
  try {
    const res = await getSpaceUsage()
    if (res && res.data) {
      spaceUsage.value = res.data
    }
  } catch (error) {
    console.error('加载空间使用情况失败:', error)
  }
}

onMounted(() => {
  loadStats()
  loadTodayAppointments()
  loadCurrentResidents()
  loadSpaceUsage()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 22px;
  background: #fff;
  border-radius: 12px;
  border: 1.5px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
  transition: all 0.2s;
  cursor: default;
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
}
.stat-card--alert-active {
  border-color: #fde2e2;
  background: linear-gradient(135deg, #fff 80%, #fff0f0 100%);
}

.stat-icon {
  font-size: 26px;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon--appointment { background: #ecf5ff; }
.stat-icon--boarding    { background: #f0f9eb; }
.stat-icon--checkout    { background: #fdf6ec; }
.stat-icon--alert       { background: #fef0f0; }

.stat-body { flex: 1; min-width: 0; }
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: #86909c;
  margin-top: 3px;
}

.stat-trend {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}
.stat-trend--up     { background: #ecf5ff; color: #409EFF; }
.stat-trend--normal { background: #f0f9eb; color: #67C23A; }
.stat-trend--out    { background: #fdf6ec; color: #E6A23C; }
.stat-trend--alert  { background: #fef0f0; color: #F56C6C; }

.stat-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 0 0 12px 12px;
}
.stat-bar--appointment { background: #409EFF; }
.stat-bar--boarding    { background: #67C23A; }
.stat-bar--checkout    { background: #E6A23C; }
.stat-bar--alert       { background: #F56C6C; }

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 140px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.boarding-residents {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.boarding-resident-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

.resident-info {
  flex: 1;
  margin-left: 15px;
}

.resident-name {
  font-weight: bold;
  font-size: 14px;
}

.resident-detail {
  font-size: 12px;
  color: #909399;
}

.space-usage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.space-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.space-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.space-name {
  font-weight: bold;
}

.space-count {
  color: #909399;
  font-size: 14px;
}

.mb20 {
  margin-bottom: 20px;
}
</style>
