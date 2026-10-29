<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="queryParams.deviceName" placeholder="请输入设备名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="queryParams.deviceCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="toolbar mb8">
        <el-button type="primary" @click="handleAdd" v-hasPermi="['gps:gpsdevice:submit']">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()" v-hasPermi="['gps:gpsdevice:delete']">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="deviceList" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="设备名称" prop="deviceName" show-overflow-tooltip min-width="130"/>
        <el-table-column label="设备编码" prop="deviceCode" min-width="120" />
        <el-table-column label="SIM卡号" prop="simCardNo" min-width="130" />
        <el-table-column label="绑定长者" prop="residentName" min-width="120" show-overflow-tooltip />
        <el-table-column label="电量" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getBatteryType(row.batteryLevel)">
              {{ row.batteryLevel }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="信号强度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getSignalType(row.signalStrength)">
              {{ row.signalStrength }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后位置" prop="lastAddress" show-overflow-tooltip />
        <el-table-column label="最后时间" prop="lastUpdateAt" width="160" />
        <el-table-column label="操作" align="center" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleUpdate(row)" v-hasPermi="['gps:gpsdevice:submit']">修改</el-button>
            <el-button link type="success" size="small" @click="handleSetFence(row)">围栏</el-button>
            <el-button link type="info" size="small" @click="handleViewTrack(row)">轨迹</el-button>
            <el-button link type="warning" size="small" @click="handleViewAlarm(row)">报警</el-button>
            <!-- <el-button link type="danger" size="small" @click="handleDelete(row)" v-hasPermi="['gps:gpsdevice:delete']">删除</el-button> -->
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog v-model="open" :title="title" width="700px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="SIM卡号" prop="simCardNo">
              <el-input v-model="form.simCardNo" placeholder="请输入SIM卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IMEI码" prop="imei">
              <el-input v-model="form.imei" placeholder="请输入IMEI码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="绑定长者" prop="residentId">
              <el-select v-model="form.residentId" placeholder="请选择长者" clearable filterable>
                <el-option label="长者1" :value="1" />
                <el-option label="长者2" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="康养订单" prop="boardingId">
              <el-select v-model="form.boardingId" placeholder="请选择康养订单" clearable>
                <el-option label="订单1" :value="1" />
                <el-option label="订单2" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="房间名称" prop="roomName">
          <el-input v-model="form.roomName" placeholder="请输入房间名称" />
        </el-form-item>
        <el-form-item label="绑定原因">
          <el-input v-model="form.bindReason" type="textarea" placeholder="请输入绑定原因" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="open = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getGpsDeviceList, getGpsDeviceDetail, submitGpsDevice, deleteGpsDevice } from '@/api/gps/gpsDevice'

const router = useRouter()
const loading = ref(false)
const total = ref(0)
const deviceList = ref([])
const selectedIds = ref([])
const open = ref(false)
const title = ref('')
const formRef = ref(null)

const queryParams = reactive({ pageNum: 1, pageSize: 10, deviceName: '', deviceCode: '', status: null })

const form = reactive({
  id: null,
  deviceName: '',
  deviceCode: '',
  simCardNo: '',
  imei: '',
  residentId: null,
  boardingId: null,
  roomName: '',
  bindReason: '',
  status: 1
})

const rules = {
  deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
  deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }]
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(s => s.id)
}

function getBatteryType(level) {
  if (level >= 80) return 'success'
  if (level >= 30) return 'warning'
  return 'danger'
}

function getSignalType(strength) {
  if (strength >= 80) return 'success'
  if (strength >= 50) return 'warning'
  return 'danger'
}

async function getList() {
  loading.value = true
  try {
    const res = await getGpsDeviceList(queryParams)
    const data = res.data || res
    deviceList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.total || deviceList.value.length
  } catch (e) {
    console.error('加载GPS设备失败:', e)
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { 
  Object.assign(queryParams, { pageNum: 1, deviceName: '', deviceCode: '', status: null })
  getList() 
}

function handleAdd() {
  Object.assign(form, {
    id: null,
    deviceName: '',
    deviceCode: '',
    simCardNo: '',
    imei: '',
    residentId: null,
    boardingId: null,
    roomName: '',
    bindReason: '',
    status: 1
  })
  title.value = '添加GPS设备'
  open.value = true
}

async function handleUpdate(row) {
  try {
    const res = await getGpsDeviceDetail(row.id)
    const data = res.data || res
    Object.assign(form, {
      id: data.id,
      deviceName: data.deviceName || '',
      deviceCode: data.deviceCode || '',
      simCardNo: data.simCardNo || '',
      imei: data.imei || '',
      residentId: data.residentId || null,
      boardingId: data.boardingId || null,
      roomName: data.roomName || '',
      bindReason: data.bindReason || '',
      status: data.status ?? 1
    })
    title.value = '修改GPS设备'
    open.value = true
  } catch (e) {
    ElMessage.error('获取设备信息失败')
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await submitGpsDevice({ ...form })
    ElMessage.success('操作成功')
    open.value = false
    getList()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function handleDelete(row) {
  const ids = row?.id || selectedIds.value
  if (!ids || !ids.length) { ElMessage.warning('请选择要删除的数据'); return }
  ElMessageBox.confirm('是否确认删除选中的GPS设备？', '提示', { type: 'warning' }).then(async () => {
    await deleteGpsDevice(ids)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 设置围栏 - 携带设备参数跳转
function handleSetFence(row) {
  router.push({
    path: '/e_gps/fence',
    query: {
      deviceId: row.id,
      deviceName: row.deviceName,
      deviceCode: row.deviceCode,
    }
  })
}

// 轨迹查看 - 携带设备参数跳转
function handleViewTrack(row) {
  router.push({
    path: '/e_gps/track',
    query: {
      deviceId: row.id,
      deviceName: row.deviceName,
      deviceCode: row.deviceCode,
      residentId: row.residentId,
      residentName: row.residentName
    }
  })
}

// 围栏报警 - 携带设备参数跳转
function handleViewAlarm(row) {
  router.push({
    path: '/e_gps/alarm',
    query: {
      deviceId: row.id,
      deviceName: row.deviceName,
      deviceCode: row.deviceCode,
      residentId: row.residentId,
      residentName: row.residentName
    }
  })
}

onMounted(getList)
</script>

<style scoped>
.toolbar { margin-bottom: 12px; }
</style>
