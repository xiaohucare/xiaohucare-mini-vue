<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="queryParams.deviceCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="报警类型" prop="alarmType">
          <el-select v-model="queryParams.alarmType" placeholder="请选择报警类型" clearable>
            <el-option label="进入围栏" value="ENTER" />
            <el-option label="离开围栏" value="LEAVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择处理状态" clearable>
            <el-option label="待处理" value="PENDING" />
            <el-option label="已处理" value="HANDLED" />
            <el-option label="已忽略" value="IGNORED" />
          </el-select>
        </el-form-item>
        <el-form-item label="报警时间" prop="dateRange">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="mb20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="总报警数" :value="stat.totalCount || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="待处理" :value="stat.pendingCount || 0" />
            <template #suffix>
              <el-tag type="danger" size="small">需处理</el-tag>
            </template>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="已处理" :value="stat.handledCount || 0" />
            <template #suffix>
              <el-tag type="success" size="small">已完成</el-tag>
            </template>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="处理率" :value="stat.handleRate || 0">
              <template #suffix>%</template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="alarmList" stripe border>
        <el-table-column label="长者姓名" prop="residentName" width="120" />
        <el-table-column label="围栏名称" prop="fenceName" width="150" show-overflow-tooltip />
        <el-table-column label="报警类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.alarmType === 'ENTER' ? 'warning' : 'danger'">
              {{ row.alarmType === 'ENTER' ? '进入围栏' : '离开围栏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报警级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmLevelType(row.alarmLevel)">
              {{ getAlarmLevelText(row.alarmLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报警消息" prop="alarmMessage" show-overflow-tooltip />
        <el-table-column label="触发位置" prop="triggerAddress" show-overflow-tooltip />
        <el-table-column label="报警时间" prop="triggerTime" width="160" />
        <el-table-column label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button link type="success" size="small" @click="handleHandle(row)" v-if="row.status === 'PENDING'" v-hasPermi="['gps:fencealarm:handle']">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="报警详情" width="80%" append-to-body>
      <el-descriptions :column="2" border v-if="currentAlarm">
        <el-descriptions-item label="长者姓名">{{ currentAlarm.residentName }}</el-descriptions-item>
        <el-descriptions-item label="家属姓名">{{ currentAlarm.guardianName }}</el-descriptions-item>
        <el-descriptions-item label="家属电话">{{ currentAlarm.guardianPhone }}</el-descriptions-item>
        <el-descriptions-item label="设备编码">{{ currentAlarm.deviceCode }}</el-descriptions-item>
        <el-descriptions-item label="围栏名称">{{ currentAlarm.fenceName }}</el-descriptions-item>
        <el-descriptions-item label="报警类型">
          <el-tag :type="currentAlarm.alarmType === 'ENTER' ? 'warning' : 'danger'">
            {{ currentAlarm.alarmType === 'ENTER' ? '进入围栏' : '离开围栏' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="报警级别">
          <el-tag :type="getAlarmLevelType(currentAlarm.alarmLevel)">
            {{ getAlarmLevelText(currentAlarm.alarmLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="getStatusType(currentAlarm.status)">
            {{ getStatusText(currentAlarm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="报警消息" :span="2">{{ currentAlarm.alarmMessage }}</el-descriptions-item>
        <el-descriptions-item label="触发位置" :span="2">{{ currentAlarm.triggerAddress || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="触发纬度">{{ currentAlarm.triggerLatitude }}</el-descriptions-item>
        <el-descriptions-item label="触发经度">{{ currentAlarm.triggerLongitude }}</el-descriptions-item>
        <el-descriptions-item label="报警时间" :span="2">{{ currentAlarm.triggerTime }}</el-descriptions-item>
        <el-descriptions-item label="通知状态">
          <el-tag :type="currentAlarm.isNotified === 1 ? 'success' : 'info'">
            {{ currentAlarm.isNotified === 1 ? '已通知' : '未通知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="通知时间">{{ currentAlarm.notifyTime || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 地图显示 -->
      <div class="mt20">
        <h4>报警位置</h4>
        <div id="alarmMap" style="width: 100%; height: 400px;"></div>
      </div>
    </el-dialog>

    <!-- 处理对话框 -->
    <el-dialog v-model="handleVisible" title="处理报警" width="600px" append-to-body>
      <el-form ref="handleFormRef" :model="handleForm" label-width="100px">
        <el-form-item label="处理状态">
          <el-radio-group v-model="handleForm.status">
            <el-radio label="HANDLED">已处理</el-radio>
            <el-radio label="IGNORED">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.handleNote" type="textarea" placeholder="请输入处理备注" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitHandle">确 定</el-button>
        <el-button @click="handleVisible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFenceAlarmList, getFenceAlarmDetail, handleFenceAlarm, getFenceAlarmStat } from '@/api/gps/gpsFenceAlarm'
import TDTUtil from '@/utils/tianditu'

const route = useRoute()
const loading = ref(false)
const total = ref(0)
const alarmList = ref([])
const stat = ref({})
const detailVisible = ref(false)
const handleVisible = ref(false)
const currentAlarm = ref(null)
const handleFormRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  residentId: null,
  deviceId: null,
  alarmType: '',
  status: '',
  dateRange: []
})

const handleForm = reactive({
  id: null,
  status: 'HANDLED',
  handleNote: ''
})

function getAlarmLevelType(level) {
  const map = { LOW: 'info', MEDIUM: 'warning', HIGH: 'danger' }
  return map[level] || 'info'
}

function getAlarmLevelText(level) {
  const map = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  return map[level] || level
}

function getStatusType(status) {
  const map = { PENDING: 'danger', HANDLED: 'success', IGNORED: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { PENDING: '待处理', HANDLED: '已处理', IGNORED: '已忽略' }
  return map[status] || status
}

async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startTime = params.dateRange[0]
      params.endTime = params.dateRange[1]
    }
    delete params.dateRange
    
    const res = await getFenceAlarmList(params)
    const data = res.data || res
    alarmList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.total || alarmList.value.length
  } catch (e) {
    console.error('加载围栏报警失败:', e)
  } finally {
    loading.value = false
  }
}

async function getStat() {
  try {
    const params = { ...queryParams }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startTime = params.dateRange[0]
      params.endTime = params.dateRange[1]
    }
    delete params.dateRange
    
    const res = await getFenceAlarmStat(params)
    stat.value = res.data || res || {}
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
  getStat()
}

function resetQuery() {
  Object.assign(queryParams, {
    pageNum: 1,
    pageSize: 10,
    residentId: null,
    alarmType: '',
    status: '',
    dateRange: []
  })
  getList()
  getStat()
}

async function handleDetail(row) {
  try {
    const res = await getFenceAlarmDetail(row.id)
    currentAlarm.value = res.data || res
    detailVisible.value = true
    
    nextTick(async () => {
      // 在地图上显示报警位置
      await initAlarmMap()
    })
  } catch (e) {
    ElMessage.error('获取报警详情失败')
  }
}

function handleHandle(row) {
  handleForm.id = row.id
  handleForm.status = 'HANDLED'
  handleForm.handleNote = ''
  handleVisible.value = true
}

async function submitHandle() {
  try {
    await handleFenceAlarm(handleForm)
    ElMessage.success('处理成功')
    handleVisible.value = false
    getList()
    getStat()
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

// 初始化报警地图
async function initAlarmMap() {
  try {
    // 检查是否有报警位置数据
    if (!currentAlarm.value || !currentAlarm.value.triggerLongitude || !currentAlarm.value.triggerLatitude) {
      console.warn('报警位置数据不完整，无法初始化地图')
      ElMessage.warning('报警位置数据不完整，无法显示地图')
      return
    }
    
    // 检查地图容器是否存在
    const container = document.getElementById('alarmMap')
    if (!container) {
      console.error('报警地图容器不存在')
      ElMessage.error('地图容器不存在')
      return
    }
    
    // 检查TDTUtil工具类是否可用
    if (!TDTUtil || typeof TDTUtil.initMap !== 'function') {
      console.warn('TDTUtil工具类不可用，等待天地图SDK加载...')
      
      // 添加重试计数器
      const retryCount = initAlarmMap.retryCount || 0
      
      // 如果重试次数超过5次，给出明确错误提示
      if (retryCount >= 5) {
        console.error('天地图SDK加载失败，已重试5次')
        ElMessage.error('天地图加载失败，请检查网络连接、天地图配置或TDTUtil工具类')
        initAlarmMap.retryCount = 0
        return
      }
      
      // 增加重试计数器
      initAlarmMap.retryCount = retryCount + 1
      
      // 延迟重试（每次重试延迟时间递增）
      const delay = 500 * (retryCount + 1)
      setTimeout(() => {
        initAlarmMap()
      }, delay)
      return
    }
    
    // 确保DOM已渲染
    await nextTick()
    
    // 初始化天地图
    const map = await TDTUtil.initMap('alarmMap', {
      center: [currentAlarm.value.triggerLongitude, currentAlarm.value.triggerLatitude],
      zoom: 16,
      showZoom: true,
      showScale: true,
      showMapType: true
    })
    
    // 添加标记
    TDTUtil.addMarker(map, {
      lng: currentAlarm.value.triggerLongitude,
      lat: currentAlarm.value.triggerLatitude,
      title: '报警位置'
    })
    
    // 自动调整地图视野以显示报警位置
    if (map && map.centerAndZoom && window.T && window.T.LngLat) {
      map.centerAndZoom(new window.T.LngLat(currentAlarm.value.triggerLongitude, currentAlarm.value.triggerLatitude), 16)
    } else {
      console.warn('地图centerAndZoom方法不可用，跳过自动调整')
    }
    
    console.log('报警地图初始化成功')
    
    // 重置重试计数器
    initAlarmMap.retryCount = 0
    
  } catch (error) {
    console.error('报警地图初始化失败:', error)
    ElMessage.error('地图加载失败，请检查天地图配置或TDTUtil工具类')
    
    // 重置重试计数器
    initAlarmMap.retryCount = 0
  }
}

onMounted(() => {
  // 从设备页面传递过来的参数（新版 residentId；兼容旧版 petId）
  const { deviceId, deviceName, residentId, petId, residentName } = route.query
  const _residentId = residentId || petId
  if (deviceId) {
    queryParams.deviceId = Number(deviceId)
    if (_residentId) {
      queryParams.residentId = Number(_residentId)
    }
    ElMessage.success(`正在查看设备 ${deviceName} 的围栏报警`)
    console.log('从设备页面跳转而来，设备ID:', deviceId, '长者ID:', _residentId, '长者姓名:', residentName)
  }

  getList()
  getStat()
})
</script>

<style scoped>
.mb20 { margin-bottom: 20px; }
.mt20 { margin-top: 20px; }
.stat-card { text-align: center; }
</style>
