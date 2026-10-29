<template>
  <div class="app-container duty-page">

    <!-- 顶部工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button @click="changeWeek(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="week-range">{{ weekStart }} ~ {{ weekEnd }}</span>
          <el-button @click="changeWeek(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button type="primary" text @click="goToday">今天</el-button>
          <el-tag type="info" effect="plain" style="margin-left:12px">
            本周共 {{ totalDutyCount }} 人次值班
          </el-tag>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="openSetDialog">
            <el-icon><Setting /></el-icon> 批量设置值班
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 一周值班卡片 -->
    <div class="week-grid" v-loading="loading">
      <div
        v-for="day in weekDays"
        :key="day.date"
        class="week-day-card"
        :class="{ 'is-today': day.isToday }"
        @click="openSetDialogForDate(day.date)"
      >
        <div class="day-header">
          <div class="day-date">{{ day.date }}</div>
          <div class="day-week">{{ day.weekName }}</div>
          <el-tag v-if="day.isToday" size="small" type="primary" effect="dark">今天</el-tag>
        </div>
        <div class="day-duty-list">
          <div v-if="day.dutyList.length > 0" class="duty-items">
            <div v-for="item in day.dutyList" :key="item.id" class="duty-item">
              <el-avatar :size="28" :src="item.staffAvatar" class="duty-mini-avatar">
                {{ item.staffName ? item.staffName.slice(0,1) : '?' }}
              </el-avatar>
              <div class="duty-item-info">
                <div class="duty-item-name">{{ item.staffName }}</div>
              </div>
              <el-button link type="danger" size="small" class="duty-remove-btn" @click.stop="handleRemove(item, day.date)">
                <el-icon><Remove /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-else class="empty-tip">
            <el-icon><Calendar /></el-icon>
            <span>未设置</span>
          </div>
        </div>
        <div class="day-footer">
          <span class="duty-count">{{ day.dutyList.length }} 人</span>
          <el-button link type="primary" size="small">设置</el-button>
        </div>
      </div>
    </div>

    <!-- 设置值班 Dialog -->
    <el-dialog
      v-model="setDialogVisible"
      :title="dialogMode === 'single' ? `设置 ${selectedDate} 值班` : '批量设置周值班'"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="dialog-date-tip">
        <el-icon><Calendar /></el-icon>
        <span v-if="dialogMode === 'single'">日期：<strong>{{ selectedDate }}</strong></span>
        <span v-else>模式：<strong>按日期单独设置（点击某天单独设置）</strong></span>
        <el-tag size="small" type="warning" effect="light" style="margin-left:8px">设置后将覆盖当日值班</el-tag>
      </div>

      <div class="staff-select-wrap" v-loading="staffLoading">
        <div v-if="allStaff.length > 0">
          <el-checkbox-group v-model="selectedStaffIds" class="staff-checkbox-group">
            <div
              v-for="staff in allStaff"
              :key="staff.id"
              class="staff-select-item"
              :class="{ 'is-selected': selectedStaffIds.includes(staff.id) }"
            >
              <el-checkbox :label="staff.id" class="staff-checkbox">
                <div class="staff-item-inner">
                  <el-avatar :size="36" :src="staff.avatar" class="staff-sel-avatar">
                    {{ staff.name ? staff.name.slice(0,1) : '?' }}
                  </el-avatar>
                  <div class="staff-sel-info">
                    <div class="staff-sel-name">{{ staff.name }}</div>
                    <div class="staff-sel-phone">{{ staff.phone || '无手机号' }}</div>
                  </div>
                  <el-tag size="small" :type="staff.enabled === 1 ? 'success' : 'info'" effect="plain">
                    {{ staff.enabled === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </div>
        <el-empty v-else description="暂无可用值班人员，请先在「值班人员」页面添加" :image-size="80" />
      </div>

      <div class="dialog-selected-tip" v-if="selectedStaffIds.length > 0">
        已选 <strong style="color:#409EFF">{{ selectedStaffIds.length }}</strong> 人
      </div>

      <template #footer>
        <el-button @click="setDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="setLoading" @click="handleConfirmSet">确认设置</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup name="BoardingDuty">
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { ArrowLeft, ArrowRight, Setting, Remove, Calendar } from '@element-plus/icons-vue'
import { getDutyList, setDuty, removeDuty, getStaffAll } from '@/api/care/boardingStaff'

const { proxy } = getCurrentInstance()

// ===== 周视图 =====
const today = new Date()
const pad = n => String(n).padStart(2, '0')
const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

const weekBaseDate = ref(new Date(today)) // 本周基准日期（用于计算周一/周日）

const weekDays = ref([])
const loading = ref(false)
const weekDataMap = ref({}) // { '2024-01-01': [...] }

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 计算本周的起始（周日）和结束（周六）
const weekStart = computed(() => {
  const d = new Date(weekBaseDate.value)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return formatDate(d)
})

const weekEnd = computed(() => {
  const d = new Date(weekBaseDate.value)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  return formatDate(d)
})

const totalDutyCount = computed(() => {
  return weekDays.value.reduce((sum, day) => sum + day.dutyList.length, 0)
})

function buildWeekDays() {
  const base = new Date(weekBaseDate.value)
  const day = base.getDay()
  const start = new Date(base)
  start.setDate(base.getDate() - day) // 周日

  const days = []
  const todayStr = formatDate(today)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = formatDate(d)
    days.push({
      date: dateStr,
      weekName: weekNames[i],
      isToday: dateStr === todayStr,
      dutyList: weekDataMap.value[dateStr] || []
    })
  }
  weekDays.value = days
}

function changeWeek(offset) {
  const d = new Date(weekBaseDate.value)
  d.setDate(d.getDate() + offset * 7)
  weekBaseDate.value = d
  loadWeekData()
}

function goToday() {
  weekBaseDate.value = new Date(today)
  loadWeekData()
}

function loadWeekData() {
  loading.value = true
  weekDataMap.value = {}

  const promises = weekDays.value.map(day =>
    getDutyList(day.date).then(res => {
      if (res.code === 0) {
        weekDataMap.value[day.date] = Array.isArray(res.data) ? res.data : []
      }
    }).catch(() => {
      weekDataMap.value[day.date] = []
    })
  )

  Promise.all(promises).finally(() => {
    buildWeekDays()
    loading.value = false
  })
}

// ===== 移除 =====
function handleRemove(item, date) {
  proxy.$modal.confirm(`确定要将【${item.staffName || '该人员'}】从 ${date} 的值班中移除吗？`).then(() => {
    removeDuty(item.id).then(res => {
      if (res.code === 0) {
        proxy.$modal.msgSuccess('移除成功')
        loadWeekData()
      }
    })
  }).catch(() => {})
}

// ===== 设置值班 Dialog =====
const setDialogVisible = ref(false)
const dialogMode = ref('single') // 'single' 或 'batch'
const staffLoading = ref(false)
const setLoading = ref(false)
const allStaff = ref([])
const selectedStaffIds = ref([])

function openSetDialog() {
  dialogMode.value = 'batch'
  selectedStaffIds.value = []
  setDialogVisible.value = true
  loadAllStaff()
}

function openSetDialogForDate(date) {
  dialogMode.value = 'single'
  selectedDate.value = date
  selectedStaffIds.value = (weekDataMap.value[date] || []).map(d => d.staffId).filter(Boolean)
  setDialogVisible.value = true
  loadAllStaff()
}

const selectedDate = ref(formatDate(today))

function loadAllStaff() {
  staffLoading.value = true
  getStaffAll().then(res => {
    if (res.code === 0) {
      allStaff.value = Array.isArray(res.data) ? res.data : []
    }
  }).catch(() => {
    allStaff.value = []
  }).finally(() => {
    staffLoading.value = false
  })
}

function handleConfirmSet() {
  setLoading.value = true
  setDuty({
    date: selectedDate.value,
    staffIds: selectedStaffIds.value
  }).then(res => {
    if (res.code === 0) {
      proxy.$modal.msgSuccess('值班设置成功')
      setDialogVisible.value = false
      loadWeekData()
    } else {
      proxy.$modal.msgError(res.msg || '设置失败')
    }
  }).catch(() => {
    proxy.$modal.msgError('设置失败')
  }).finally(() => {
    setLoading.value = false
  })
}

onMounted(() => {
  buildWeekDays()
  loadWeekData()
})
</script>

<style scoped>
.duty-page { padding: 16px; }

.toolbar-card { margin-bottom: 12px; }
.toolbar-card :deep(.el-card__body) { padding: 14px 20px; }
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.week-range {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  padding: 0 4px;
}

/* 周视图网格 */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  min-height: 400px;
}

@media (max-width: 1400px) {
  .week-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 900px) {
  .week-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .week-grid { grid-template-columns: 1fr; }
}

.week-day-card {
  background: #fff;
  border: 1.5px solid #e4e7ed;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}
.week-day-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.12);
  transform: translateY(-2px);
}
.week-day-card.is-today {
  border-color: #409EFF;
  background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 10px;
}
.day-date { font-size: 14px; font-weight: 600; color: #1d2129; }
.day-week { font-size: 12px; color: #86909c; }

.day-duty-list { flex: 1; min-height: 60px; }
.duty-items { display: flex; flex-direction: column; gap: 6px; }
.duty-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: background 0.15s;
}
.duty-item:hover { background: #ecf5ff; }
.duty-mini-avatar { flex-shrink: 0; }
.duty-item-info { flex: 1; min-width: 0; }
.duty-item-name { font-size: 13px; font-weight: 500; color: #1d2129; }
.duty-remove-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.duty-item:hover .duty-remove-btn { opacity: 1; }

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #c0c4cc;
  font-size: 12px;
  gap: 4px;
}

.day-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  margin-top: 10px;
}
.duty-count { font-size: 12px; color: #86909c; }

/* 设置弹窗 */
.dialog-date-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}
.staff-select-wrap {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 8px;
}
.staff-select-wrap::-webkit-scrollbar { width: 4px; }
.staff-select-wrap::-webkit-scrollbar-thumb { background: #e4e7ed; border-radius: 2px; }

.staff-checkbox-group { display: flex; flex-direction: column; gap: 4px; }
.staff-select-item {
  border-radius: 8px;
  padding: 6px 8px;
  transition: background 0.15s;
}
.staff-select-item:hover { background: #f5f7fa; }
.staff-select-item.is-selected { background: #ecf5ff; }

.staff-checkbox { width: 100%; }
.staff-checkbox :deep(.el-checkbox__label) { width: 100%; }
.staff-item-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.staff-sel-avatar { flex-shrink: 0; }
.staff-sel-info { flex: 1; min-width: 0; }
.staff-sel-name { font-size: 14px; font-weight: 500; color: #1d2129; }
.staff-sel-phone { font-size: 12px; color: #86909c; }

.dialog-selected-tip {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
  text-align: right;
}
</style>
