<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
          <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="queryParams.deviceCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        
        <el-form-item label="围栏名称" prop="fenceName">
          <el-input v-model="queryParams.fenceName" placeholder="请输入围栏名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="围栏类型" prop="fenceType">
          <el-select v-model="queryParams.fenceType" placeholder="请选择围栏类型" clearable>
            <el-option label="圆形" value="CIRCLE" />
            <el-option label="多边形" value="POLYGON" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="toolbar mb8">
        <el-button type="primary" @click="handleAdd" v-hasPermi="['gps:fence:submit']">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()" v-hasPermi="['gps:fence:delete']">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="fenceList" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="设备编码" prop="deviceCode" min-width="120" />
        <el-table-column label="围栏编号" prop="fenceCode" show-overflow-tooltip min-width="220" />
        <el-table-column label="围栏名称" prop="fenceName" show-overflow-tooltip min-width="220" />
        <el-table-column label="围栏类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.fenceType === 1 || row.fenceType === 'CIRCLE') ? 'primary' : 'success'">
              {{ (row.fenceType === 1 || row.fenceType === 'CIRCLE') ? '圆形' : '多边形' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="半径/米" prop="radius" width="100" align="center" />
        <el-table-column label="中心位置" prop="centerAddress" show-overflow-tooltip min-width="120"/>
        <el-table-column label="报警级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmLevelType(row.alarmLevel)">
              {{ getAlarmLevelText(row.alarmLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报警类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmType(row.alarmType)">
              {{ getAlarmTypeText(row.alarmType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- <el-table-column label="关联长者" prop="residentNames" show-overflow-tooltip min-width="220"/> -->
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'info'">
              {{ row.isActive === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleUpdate(row)" v-hasPermi="['gps:fence:submit']">修改</el-button>
            <el-button link type="info" size="small" @click="handleViewMap(row)">地图</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" v-hasPermi="['gps:fence:delete']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog v-model="open" :title="title" width="80%" append-to-body :close-on-click-modal="false">
      <el-row :gutter="20">
        <!-- 左侧表单 -->
        <el-col :span="10">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="围栏名称" prop="fenceName">
              <el-input v-model="form.fenceName" placeholder="请输入围栏名称" />
            </el-form-item>
            <el-form-item label="围栏类型" prop="fenceType">
              <el-radio-group v-model="form.fenceType" @change="handleFenceTypeChange">
                <el-radio label="CIRCLE">圆形</el-radio>
                <el-radio label="POLYGON">多边形</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="中心位置" prop="centerLatitude" v-if="form.fenceType === 'CIRCLE'">
              <el-button type="primary" @click="showMapPicker">在地图上选点</el-button>
             
            </el-form-item>
             <el-form-item label="" prop="centerLatitude" v-if="form.fenceType === 'CIRCLE'">
             
              <div class="coord-info" v-if="form.centerLatitude && form.centerLongitude">
                <div class="coord-item">
                  <span class="coord-label">纬度:</span>
                  <span class="coord-value">{{ form.centerLatitude.toFixed(6) }}</span>
                </div>
                <div class="coord-item">
                  <span class="coord-label">经度:</span>
                  <span class="coord-value">{{ form.centerLongitude.toFixed(6) }}</span>
                </div>
                <div class="coord-item">
                  <span class="coord-label">地址:</span>
                  <span class="coord-value">{{ form.centerAddress || '未解析' }}</span>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="多边形顶点" v-if="form.fenceType === 'POLYGON'">
              <el-button type="primary" @click="showMapPicker">在地图上绘制</el-button>
              </el-form-item>
             <el-form-item label="" prop="centerLatitude" v-if="form.fenceType === 'POLYGON'">  
              <div class="coord-info" v-if="form.polygonPoints && form.polygonPoints.length > 0">
                <div class="coord-item">
                  <span class="coord-label">顶点数:</span>
                  <span class="coord-value">{{ form.polygonPoints.length }} 个</span>
                </div>
                <div class="coord-item" style="flex-direction: column; align-items: flex-start;">
                  <span class="coord-label">坐标列表:</span>
                  <div class="points-list">
                    <div v-for="(point, index) in form.polygonPoints" :key="index" class="point-item">
                      顶点{{ index + 1 }}: ({{ point.lng.toFixed(6) }}, {{ point.lat.toFixed(6) }})
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="半径(米)" prop="radius" v-if="form.fenceType === 'CIRCLE'">
              <el-input-number v-model="form.radius" :min="10" :max="5000" controls-position="right" @change="updateFencePreview" />
            </el-form-item>
            <el-form-item label="报警级别" prop="alarmLevel">
              <el-select v-model="form.alarmLevel" placeholder="请选择报警级别">
                <el-option label="低" value="LOW" />
                <el-option label="中" value="MEDIUM" />
                <el-option label="高" value="HIGH" />
              </el-select>
            </el-form-item>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="启用报警" prop="alarmEnabled">
                  <el-switch v-model="form.alarmEnabled" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="报警类型" prop="alarmType" v-if="form.alarmEnabled === 1">
              <el-radio-group v-model="form.alarmType">
                <el-radio label="ENTER">进入</el-radio>
                <el-radio label="LEAVE">离开</el-radio>
                <el-radio label="BOTH">进出都报警</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="报警消息模板" prop="alarmMessage" v-if="form.alarmEnabled === 1">
              <el-input v-model="form.alarmMessage" placeholder="请输入报警消息模板，支持变量：{deviceName}, {fenceName}, {alarmType}" />
            </el-form-item>
            <el-form-item label="启用时间限制" prop="timeEnabled">
              <el-switch v-model="form.timeEnabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            
           

            <el-row :gutter="20" v-if="form.timeEnabled === 1">
              <el-col :span="12">
               <el-form-item label="开始时间" prop="startTime">
              <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" placeholder="请选择开始时间" />
            </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结束时间" prop="endTime" >
              <el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" placeholder="请选择结束时间" />
            </el-form-item>
              </el-col>
            </el-row>


          
            <el-form-item label="围栏描述">
              <el-input v-model="form.description" type="textarea" placeholder="请输入围栏描述" />
            </el-form-item>
             <el-form-item label="围栏备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
            </el-form-item>
           
           



          </el-form>
        </el-col>
        
        <!-- 右侧地图 -->
        <el-col :span="14">
          <div class="map-container">
            <div id="fenceMap" style="width: 100%; height: 500px;"></div>
          </div>
        </el-col>
      </el-row>
      <template #footer>
        <div style="text-align: center;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
      
    </el-dialog>

    <!-- 地图查看对话框 -->
    <el-dialog v-model="mapDialogVisible" title="围栏地图" width="1000px" append-to-body>
      <div id="viewMap" style="width: 100%; height: 600px;"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getFenceList, getFenceDetail, submitFence, deleteFence } from '@/api/gps/gpsFence'
import TDTUtil from '@/utils/tianditu'

const route = useRoute()
const loading = ref(false)
const total = ref(0)
const fenceList = ref([])
const selectedIds = ref([])
const open = ref(false)
const title = ref('')
const formRef = ref(null)
const mapDialogVisible = ref(false)

const queryParams = reactive({ pageNum: 1, pageSize: 10, fenceName: '', fenceType: '' })

const form = reactive({
  id: null,
  fenceName: '',
  fenceType: 'CIRCLE',
  centerLatitude: null,
  centerLongitude: null,
  centerAddress: '',
  radius: 100,
  polygonPoints: [], // 多边形顶点坐标
  alarmLevel: 'MEDIUM',
  residentIds: [],
  description: '',
  isActive: 1,
  // 设备关联信息
  deviceId: null,
  deviceName: '',
  deviceCode: '',
  // 报警配置信息
  alarmEnabled: 1,
  alarmType: 'BOTH',
  alarmMessage: '',
  timeEnabled: 0,
  startTime: '',
  endTime: '',
  remark: ''
})

const rules = {
  fenceName: [{ required: true, message: '围栏名称不能为空', trigger: 'blur' }],
  fenceType: [{ required: true, message: '请选择围栏类型', trigger: 'change' }]
}

let map = null
let fenceOverlay = null
let polygonTool = null // 多边形绘制工具
let circleTool = null  // 圆形绘制工具

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(s => s.id)
}

function getAlarmLevelType(level) {
  const map = { LOW: 'info', MEDIUM: 'warning', HIGH: 'danger' }
  return map[level] || 'info'
}

function getAlarmLevelText(level) {
  const map = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  return map[level] || level
}
function getAlarmType(type) {
  const map = { ENTER: '进入', LEAVE: '离开', BOTH: '进出都报警' }
  return map[type] || 'info'
}

function getAlarmTypeText(type) {
  const map = { ENTER: '进入', LEAVE: '离开', BOTH: '进出都报警' }
  return map[type] || type
}


async function getList() {
  loading.value = true
  try {
    const res = await getFenceList(queryParams)
    const data = res.data
    fenceList.value = data?.list || data.records || []
    total.value = data.totalCount || fenceList.value.length
  } catch (e) {
    console.error('加载围栏失败:', e)
  } finally {
    loading.value = false
  }
}

function handleQuery() { 
  // 转换围栏类型为数字
  const params = { ...queryParams }
  if (params.fenceType === 'CIRCLE') {
    params.fenceType = 1
  } else if (params.fenceType === 'POLYGON') {
    params.fenceType = 2
  }
  params.pageNum = 1
  getList() 
}
function resetQuery() { 
  Object.assign(queryParams, { pageNum: 1, fenceName: '', fenceType: '' })
  getList() 
}

function handleAdd() {
  Object.assign(form, {
    id: null,
    fenceName: '',
    fenceType: 'CIRCLE',
    centerLatitude: null,
    centerLongitude: null,
    centerAddress: '',
    radius: 100,
    polygonPoints: [],
    alarmLevel: 'MEDIUM',
    residentIds: [],
    description: '',
    isActive: 1,
    // 设备关联信息
    deviceId: null,
    deviceName: '',
    deviceCode: ''
  })
  
  // 检查是否有从设备页面传递过来的参数
  const { deviceId, deviceName, deviceCode } = route.query
  if (deviceId) {
    // 自动填充围栏名称
    form.fenceName = `${deviceName || '设备'}的围栏`
    // 保存设备关联信息
    form.deviceId = Number(deviceId)
    form.deviceName = deviceName || ''
    form.deviceCode = deviceCode || ''
    console.log('从设备页面跳转而来，设备ID:', deviceId, '设备编码:', deviceCode)
    ElMessage.info(`正在为设备 ${deviceName} 设置围栏`)
  }
  
  title.value = '添加电子围栏'
  open.value = true
  // 延迟初始化地图，确保对话框完全打开
  setTimeout(() => {
    initMap()
  }, 300)
}

async function handleUpdate(row) {
  try {
    const res = await getFenceDetail(row.id)
    const data = res.data || res
    
    // 转换围栏类型：1->CIRCLE, 2->POLYGON
    let fenceType = 'CIRCLE'
    if (data.fenceType === 2) {
      fenceType = 'POLYGON'
    }
    
    // 解析多边形顶点
    let polygonPoints = []
    if (data.polygonPoints) {
      try {
        polygonPoints = typeof data.polygonPoints === 'string' 
          ? JSON.parse(data.polygonPoints) 
          : data.polygonPoints
      } catch (e) {
        console.error('解析多边形顶点失败:', e)
        polygonPoints = []
      }
    }
    
    Object.assign(form, {
      id: data.id,
      fenceName: data.fenceName || '',
      fenceType: fenceType,
      centerLatitude: data.centerLatitude || null,
      centerLongitude: data.centerLongitude || null,
      centerAddress: data.centerAddress || '',
      deviceId: data.deviceId || null,
      deviceCode: data.deviceCode || '',
      radius: data.radius || 100,
      polygonPoints: polygonPoints,
      alarmLevel: data.alarmLevel || 'MEDIUM',
      residentIds: data.residentIds || [],
      description: data.description || '',
      isActive: data.isActive ?? 1,
      // 报警配置信息
      alarmEnabled: data.alarmEnabled ?? 1,
      alarmType: data.alarmType || 'BOTH',
      alarmMessage: data.alarmMessage || '',
      timeEnabled: data.timeEnabled ?? 0,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      remark: data.remark || ''
    })
    
    title.value = '修改电子围栏'
    open.value = true
    
    // 延迟初始化地图，确保对话框完全打开
    setTimeout(() => {
      initMap()
      // 等待地图初始化完成后再绘制围栏
      setTimeout(() => {
        drawFenceOnMap(data)
      }, 500)
    }, 300)
  } catch (e) {
    console.error('获取围栏信息失败:', e)
    ElMessage.error('获取围栏信息失败')
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate()
  
  try {
    // 准备提交数据
    const submitData = { ...form }
    
    // 转换围栏类型：CIRCLE->1, POLYGON->2
    if (submitData.fenceType === 'CIRCLE') {
      submitData.fenceType = 1
      // 圆形围栏，清空多边形顶点
      submitData.polygonPoints = null
    } else if (submitData.fenceType === 'POLYGON') {
      submitData.fenceType = 2
      // 多边形围栏，将顶点数组转为JSON字符串
      if (submitData.polygonPoints && submitData.polygonPoints.length > 0) {
        submitData.polygonPoints = JSON.stringify(submitData.polygonPoints)
      }
      // 清空圆形围栏参数
      submitData.centerLatitude = null
      submitData.centerLongitude = null
      submitData.radius = null
    }
    submitData.residentIds = submitData.residentIds.toString();
    
    // 添加设备关联信息到提交数据
    if (form.deviceId) {
      submitData.deviceId = form.deviceId
      submitData.deviceName = form.deviceName
      submitData.deviceCode = form.deviceCode
    }
    
    // 添加报警配置信息到提交数据
    submitData.alarmEnabled = form.alarmEnabled
    submitData.alarmType = form.alarmType
    submitData.alarmMessage = form.alarmMessage
    submitData.timeEnabled = form.timeEnabled
    submitData.startTime = form.startTime
    submitData.endTime = form.endTime
    submitData.remark = form.remark
    
    await submitFence(submitData)
    ElMessage.success('操作成功')
    open.value = false
    getList()
  } catch (e) {
    console.error('提交围栏数据失败:', e)
    ElMessage.error('操作失败')
  }
}

function handleDelete(row) {
  const ids = row?.id || selectedIds.value
  if (!ids || !ids.length) { ElMessage.warning('请选择要删除的数据'); return }
  ElMessageBox.confirm('是否确认删除选中的围栏？', '提示', { type: 'warning' }).then(async () => {
    await deleteFence(ids)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

function handleFenceTypeChange() {
  // 切换围栏类型时清除地图上的围栏和工具
  if (map) {
    TDTUtil.clearOverlays(map)
    // 移除点击事件
    if (window.circleClickHandler) {
      map.removeEventListener('click', window.circleClickHandler)
      delete window.circleClickHandler
    }
    // 关闭旧的绘制工具
    if (polygonTool) {
      polygonTool.close()
      polygonTool = null
    }
    if (circleTool) {
      circleTool.close()
      circleTool = null
    }
    
    // 根据类型初始化相应的绘制工具
    if (form.fenceType === 'POLYGON') {
      initPolygonTool()
    } else {
      initCircleTool()
    }
  }
}

function updateFencePreview() {
  // 更新围栏预览
  if (!map || !form.centerLatitude || !form.centerLongitude) return
  
  // 清除旧围栏
  TDTUtil.clearOverlays(map)
  
  // 重新绘制
  if (form.fenceType === 'CIRCLE' && form.radius) {
    // 添加中心点标记
    TDTUtil.addMarker(map, {
      lng: form.centerLongitude,
      lat: form.centerLatitude,
      title: '围栏中心点'
    })
    
    // 绘制圆形围栏
    TDTUtil.drawCircle(map, {
      center: { lng: form.centerLongitude, lat: form.centerLatitude },
      radius: form.radius,
      color: '#409EFF',
      fillColor: '#409EFF',
      fillOpacity: 0.2
    })
  }
}

function showMapPicker() {
  ElMessage.info({
    message: form.fenceType === 'CIRCLE' 
      ? '请在右侧地图上点击选择围栏中心点' 
      : '请在右侧地图上绘制多边形围栏（双击结束）',
    duration: 3000,
    showClose: true
  })
  
  // 高亮地图容器
  const mapContainer = document.querySelector('.map-container')
  if (mapContainer) {
    mapContainer.style.boxShadow = '0 0 15px rgba(64, 158, 255, 0.5)'
    mapContainer.style.borderColor = '#409EFF'
    setTimeout(() => {
      mapContainer.style.boxShadow = ''
      mapContainer.style.borderColor = ''
    }, 3000)
  }
}

// 初始化圆形绘制工具 - 使用手动点击方式
function initCircleTool() {
  if (!map) return
  
  console.log('开始初始化圆形绘制工具（手动点击模式）...')
  
  // 关闭多边形工具
  if (polygonTool) {
    polygonTool.close()
    polygonTool = null
  }
  
  // 清除地图上的旧覆盖物和事件
  TDTUtil.clearOverlays(map)
  
  // 移除旧的点击事件（如果存在）
  if (window.circleClickHandler) {
    map.removeEventListener('click', window.circleClickHandler)
    delete window.circleClickHandler
  }
  
  let clickStep = 0 // 0-等待选择中心点, 1-等待选择半径点
  let centerPoint = null
  
  // 创建点击事件处理函数
  const circleClickHandler = function(e) {
    const lnglat = e.lnglat
    const lng = lnglat.lng
    const lat = lnglat.lat
    
    console.log('地图点击:', { lng, lat, step: clickStep })
    
    if (clickStep === 0) {
      // 第一次点击：选择中心点
      centerPoint = { lng, lat }
      clickStep = 1
      
      // 在地图上显示中心点
      TDTUtil.addMarker(map, {
        lng: lng,
        lat: lat,
        title: '围栏中心点（点击设置半径）'
      })
      
      ElMessage.success('中心点已选择，请再次点击设置围栏半径')
      console.log('中心点已选择:', centerPoint)
      
    } else if (clickStep === 1) {
      // 第二次点击：设置半径
      const radiusPoint = { lng, lat }
      
      // 计算两点之间的距离（米）
      const distance = calculateDistance(centerPoint.lat, centerPoint.lng, lat, lng)
      const radius = Math.round(distance)
      
      console.log('半径点已选择:', radiusPoint, '距离:', radius, '米')
      
      // 清除旧覆盖物
      TDTUtil.clearOverlays(map)
      
      // 绘制圆形围栏
      TDTUtil.drawCircle(map, {
        center: centerPoint,
        radius: radius,
        color: '#409EFF',
        fillColor: '#409EFF',
        fillOpacity: 0.2
      })
      
      // 添加中心点标记
      TDTUtil.addMarker(map, {
        lng: centerPoint.lng,
        lat: centerPoint.lat,
        title: '围栏中心点'
      })
      
      // 更新表单数据
      form.centerLatitude = centerPoint.lat
      form.centerLongitude = centerPoint.lng
      form.radius = radius
      
      // 逆地址解析
      TDTUtil.reverseGeocode(centerPoint.lng, centerPoint.lat)
        .then(result => {
          form.centerAddress = result.address
          ElMessage.success(`圆形围栏设置成功: ${result.address}, 半径: ${radius}米`)
        })
        .catch(() => {
          form.centerAddress = `${centerPoint.lat.toFixed(6)}, ${centerPoint.lng.toFixed(6)}`
          ElMessage.success(`圆形围栏设置成功, 半径: ${radius}米`)
        })
      
      console.log('圆形围栏设置完成:', {
        center: centerPoint,
        radius: radius
      })
      
      // 重置状态，允许重新绘制
      clickStep = 0
      centerPoint = null
    }
  }
  
  // 存储事件处理函数引用以便后续移除
  window.circleClickHandler = circleClickHandler
  
  // 添加地图点击事件
  map.addEventListener('click', circleClickHandler)
  
  console.log('圆形绘制工具（手动点击模式）已初始化')
  ElMessage.info('请在地图上点击选择围栏中心点')
}

// 计算两点之间的距离（米）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 初始化多边形绘制工具
function initPolygonTool() {
  if (!map) return
  
  // 关闭圆形工具
  if (circleTool) {
    circleTool.close()
    circleTool = null
  }
  
  // 移除圆形工具的点击事件（如果存在）
  if (window.circleClickHandler) {
    map.removeEventListener('click', window.circleClickHandler)
    delete window.circleClickHandler
  }
  
  // 清除地图上的旧覆盖物
  TDTUtil.clearOverlays(map)
  
  // 创建多边形绘制工具
  polygonTool = TDTUtil.createPolygonTool(map, {
    showLabel: true,
    color: '#67C23A',
    fillColor: '#67C23A'
  })
  
  // 监听绘制完成事件
  polygonTool.addEventListener('draw', function(e) {
    const polygon = e.currentPolygon
    const points = e.currentLnglats
    
    // 保存多边形顶点坐标
    form.polygonPoints = points.map(p => ({
      lng: p.lng,
      lat: p.lat
    }))
    
    console.log('多边形顶点坐标:', form.polygonPoints)
    ElMessage.success(`多边形围栏绘制成功，共 ${form.polygonPoints.length} 个顶点`)
    
    // 自动调整地图视野
    const lngLats = points.map(p => new window.T.LngLat(p.lng, p.lat))
    map.setViewport(lngLats)
  })
  
  polygonTool.open()
  console.log('多边形绘制工具已开启')
  ElMessage.info('请在地图上依次点击绘制多边形顶点，双击结束绘制')
}

async function initMap() {
  try {
    console.log('开始初始化围栏地图...')
    
    // 确保DOM已渲染
    await nextTick()
    
    // 检查容器是否存在
    const container = document.getElementById('fenceMap')
    if (!container) {
      console.error('地图容器不存在')
      ElMessage.error('地图容器不存在')
      return
    }
    
    // 先清除旧地图实例
    if (map) {
      TDTUtil.clearOverlays(map)
      map = null
    }
    polygonTool = null
    circleTool = null
    
    // 使用天地图工具类初始化地图
    map = await TDTUtil.initMap('fenceMap', {
      center: [116.4074, 39.9042],
      zoom: 14,
      showZoom: true,
      showScale: true,
      showMapType: true
    })
    
    console.log('围栏地图初始化成功，当前类型:', form.fenceType)
    
    // 根据围栏类型初始化相应的绘制工具
    if (form.fenceType === 'POLYGON') {
      initPolygonTool()
    } else {
      initCircleTool()
    }
  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error('地图初始化失败，请检查天地图Key配置')
  }
}

function drawFenceOnMap(data) {
  // 在地图上绘制围栏
  if (!map) {
    console.error('地图实例不存在，无法绘制围栏')
    return
  }
  
  console.log('开始绘制围栏:', data)
  
  // 清除旧围栏
  TDTUtil.clearOverlays(map)
  
  // 判断围栏类型
  const fenceType = data.fenceType === 2 ? 'POLYGON' : 'CIRCLE'
  
  if (fenceType === 'CIRCLE' && data.centerLatitude && data.centerLongitude) {
    console.log('绘制圆形围栏:', {
      center: { lng: data.centerLongitude, lat: data.centerLatitude },
      radius: data.radius
    })
    
    // 绘制圆形围栏
    fenceOverlay = TDTUtil.drawCircle(map, {
      center: { lng: data.centerLongitude, lat: data.centerLatitude },
      radius: data.radius || 100,
      color: '#409EFF',
      fillColor: '#409EFF',
      fillOpacity: 0.2
    })
    
    // 添加中心点标记
    TDTUtil.addMarker(map, {
      lng: data.centerLongitude,
      lat: data.centerLatitude,
      title: data.fenceName || '围栏中心点'
    })
    
    // 自动调整地图视野以显示完整圆形
    const radius = data.radius || 100
    // 根据半径计算合适的缩放级别（经验公式）
    let zoom = 15
    if (radius > 1000) {
      zoom = 13
    } else if (radius > 500) {
      zoom = 14
    } else if (radius > 200) {
      zoom = 15
    } else {
      zoom = 16
    }
    map.centerAndZoom(new window.T.LngLat(data.centerLongitude, data.centerLatitude), zoom)
    
    console.log('圆形围栏绘制完成，缩放级别:', zoom)
  } else if (fenceType === 'POLYGON') {
    // 解析多边形顶点
    let polygonPoints = []
    if (data.polygonPoints) {
      try {
        polygonPoints = typeof data.polygonPoints === 'string' 
          ? JSON.parse(data.polygonPoints) 
          : data.polygonPoints
      } catch (e) {
        console.error('解析多边形顶点失败:', e)
      }
    }
    
    if (polygonPoints && polygonPoints.length > 0) {
      console.log('绘制多边形围栏，顶点数:', polygonPoints.length)
      
      // 绘制多边形围栏
      fenceOverlay = TDTUtil.drawPolygon(map, {
        points: polygonPoints,
        color: '#67C23A',
        fillColor: '#67C23A',
        fillOpacity: 0.2
      })
      
      // 自动调整地图视野以显示完整多边形
      const lngLats = polygonPoints.map(p => new window.T.LngLat(p.lng, p.lat))
      map.setViewport(lngLats)
      
      console.log('多边形围栏绘制完成，已自动调整视野')
    } else {
      console.warn('多边形顶点数据为空')
    }
  } else {
    console.warn('围栏数据不完整，无法绘制:', data)
  }
}

async function handleViewMap(row) {
  mapDialogVisible.value = true
  await nextTick()
  
  // 延迟初始化，确保对话框DOM完全渲染
  setTimeout(async () => {
    try {
      console.log('开始初始化查看地图...')
      
      // 判断围栏类型：1-圆形 2-多边形
      const fenceType = row.fenceType === 2 ? 'POLYGON' : 'CIRCLE'
      
      // 对于多边形，使用多边形的中心点或第一个顶点作为地图中心
      let mapCenter = [116.4074, 39.9042]
      if (fenceType === 'POLYGON' && row.polygonPoints) {
        try {
          const points = typeof row.polygonPoints === 'string' 
            ? JSON.parse(row.polygonPoints) 
            : row.polygonPoints
          if (points && points.length > 0) {
            mapCenter = [points[0].lng, points[0].lat]
          }
        } catch (e) {
          console.error('解析多边形顶点失败:', e)
        }
      } else if (row.centerLongitude && row.centerLatitude) {
        mapCenter = [row.centerLongitude, row.centerLatitude]
      }
      
      // 初始化查看地图
      const viewMap = await TDTUtil.initMap('viewMap', {
        center: mapCenter,
        zoom: 13,
        showZoom: true,
        showScale: true,
        showMapType: true
      })
      
      console.log('查看地图初始化成功')
      
      // 根据围栏类型绘制
      if (fenceType === 'CIRCLE' && row.centerLatitude && row.centerLongitude) {
        // 绘制圆形围栏
        TDTUtil.drawCircle(viewMap, {
          center: { lng: row.centerLongitude, lat: row.centerLatitude },
          radius: row.radius || 100,
          color: '#409EFF',
          fillColor: '#409EFF',
          fillOpacity: 0.2
        })
        
        TDTUtil.addMarker(viewMap, {
          lng: row.centerLongitude,
          lat: row.centerLatitude,
          title: row.fenceName || '围栏中心点'
        })
        
        // 自动调整地图视野以显示完整圆形
        const radius = row.radius || 100
        let zoom = 15
        if (radius > 1000) {
          zoom = 13
        } else if (radius > 500) {
          zoom = 14
        } else if (radius > 200) {
          zoom = 15
        } else {
          zoom = 16
        }
        viewMap.centerAndZoom(new window.T.LngLat(row.centerLongitude, row.centerLatitude), zoom)
        
        console.log('查看地图-圆形围栏绘制完成，缩放级别:', zoom)
      } else if (fenceType === 'POLYGON' && row.polygonPoints) {
        // 解析多边形顶点
        let polygonPoints = []
        try {
          polygonPoints = typeof row.polygonPoints === 'string' 
            ? JSON.parse(row.polygonPoints) 
            : row.polygonPoints
        } catch (e) {
          console.error('解析多边形顶点失败:', e)
        }
        
        if (polygonPoints && polygonPoints.length > 0) {
          // 绘制多边形围栏
          TDTUtil.drawPolygon(viewMap, {
            points: polygonPoints,
            color: '#67C23A',
            fillColor: '#67C23A',
            fillOpacity: 0.2
          })
          
          // 自动调整地图视野以显示完整多边形
          const lngLats = polygonPoints.map(p => new window.T.LngLat(p.lng, p.lat))
          viewMap.setViewport(lngLats)
          
          console.log('查看地图-多边形围栏绘制完成，已自动调整视野')
        } else {
          console.warn('多边形顶点数据为空')
          ElMessage.warning('该围栏没有多边形数据')
        }
      } else {
        console.warn('围栏数据不完整')
        ElMessage.warning('围栏数据不完整，无法显示')
      }
    } catch (error) {
      console.error('查看地图失败:', error)
      ElMessage.error('地图加载失败')
    }
  }, 300)
}


onMounted(() => {
  // 检查是否有从设备页面传递过来的参数
  const { deviceId, deviceName, deviceCode } = route.query
  if (deviceId) {
    queryParams.deviceId = Number(deviceId)
    if (deviceCode) {
      queryParams.deviceCode = deviceCode
    }
    ElMessage.success(`正在查看设备 ${deviceName} 的围栏`)
    console.log('从设备页面跳转而来，设备ID:', deviceId, '设备编码:', deviceCode)
  }
  getList()
})


</script>

<style scoped>
.toolbar { margin-bottom: 12px; }
.map-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}
.coord-info {
  margin-top: 0px;
  padding: 12px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  width: 90%;
}
.coord-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  min-height: 24px;
}
.coord-item:last-child {
  margin-bottom: 0;
}
.coord-label {
  font-weight: 600;
  min-width: 60px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.95);
}
.coord-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #fff;
  word-break: break-all;
  line-height: 1.6;
}
.points-list {
  width: 100%;
  margin-top: 6px;
  max-height: 150px;
  overflow-y: auto;
}
.point-item {
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  line-height: 1.6;
}
.point-item:last-child {
  border-bottom: none;
}
</style>
