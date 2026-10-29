<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
      
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="queryParams.deviceCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        
        <el-form-item label="时间范围" prop="dateRange">
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
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="20">
        <!-- 左侧地图 -->
        <el-col :span="16">
          <el-card shadow="never" class="mb20">
            <template #header>
              <div class="card-header">
                <span>轨迹地图</span>
                <div>
                  <el-button size="small" @click="playTrack" :disabled="trackList.length === 0">
                    <el-icon><VideoPlay /></el-icon>播放轨迹
                  </el-button>
                  <el-button size="small" @click="pauseTrack" v-if="isPlaying">
                    暂停
                  </el-button>
                  <el-button size="small" @click="clearTrack">清空</el-button>
                </div>
              </div>
            </template>
            <div id="trackMap" style="width: 100%; height: 600px;"></div>
          </el-card>
        </el-col>

        <!-- 右侧轨迹列表 -->
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>轨迹列表</span>
                <el-tag type="info">{{ trackList.length }} 条</el-tag>
              </div>
            </template>
            <el-table v-loading="loading" :data="trackList" stripe border height="550">
              <el-table-column label="时间" prop="trackTime" min-width="110" />
              <el-table-column label="位置" prop="address"   min-width="150" show-overflow-tooltip />
              <el-table-column label="速度" width="80" align="center">
                <template #default="{ row }">
                  {{ row.speed }}km/h
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="locatePoint(row)">定位</el-button>
                </template>
              </el-table-column>
            </el-table>
            <!-- 分页 -->
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="mt20">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总轨迹数" :value="stat.totalCount || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总里程" :value="stat.totalDistance || 0">
              <template #suffix>公里</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="平均速度" :value="stat.avgSpeed || 0">
              <template #suffix>km/h</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="最高速度" :value="stat.maxSpeed || 0">
              <template #suffix>km/h</template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt20">
        <el-col :span="24">
          <el-card shadow="hover" v-if="statLoading">
            <div style="text-align: center; padding: 20px;">
              <el-icon><Loading /></el-icon>
              <span>正在加载统计信息...</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, VideoPlay, Loading } from '@element-plus/icons-vue'
import { getGpsTrackList, getGpsTrackStat } from '@/api/gps/gpsTrack'
import TDTUtil from '@/utils/tianditu'

const route = useRoute()
const loading = ref(false)
const total = ref(0)
const trackList = ref([])
const stat = ref({})
const statLoading = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 50,
  residentId: null,
  deviceId: null,
  dateRange: []
})

let map = null
let trackLine = null
let markers = []
let animationInterval = null
let isPlaying = ref(false)
let carTrack = null

async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startTime = params.dateRange[0]
      params.endTime = params.dateRange[1]
    }
    delete params.dateRange
    
    const res = await getGpsTrackList(params)
    const data = res.data || res
    trackList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.totalCount || trackList.value.length
    
    // 绘制轨迹
    drawTrackOnMap(trackList.value)
  } catch (e) {
    console.error('加载轨迹失败:', e)
  } finally {
    loading.value = false
  }
}

async function getStat() {
  statLoading.value = true
  try {
    const params = { ...queryParams }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startTime = params.dateRange[0]
      params.endTime = params.dateRange[1]
    }
    delete params.dateRange
    
    const res = await getGpsTrackStat(params)
    stat.value = res.data || res || {}
  } catch (e) {
    console.error('加载统计失败:', e)
  } finally {
    statLoading.value = false
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
    pageSize: 50,
    residentId: null,
    deviceId: null,
    dateRange: []
  })
  getList()
  getStat()
}

async function initMap() {
  try {
    // 使用天地图工具类初始化地图
    map = await TDTUtil.initMap('trackMap', {
      center: [116.4074, 39.9042],
      zoom: 15
    })
  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error('地图初始化失败')
  }
}

function drawTrackOnMap(tracks) {
  if (!tracks || tracks.length === 0 || !map) return
  
  try {
    // 清除旧轨迹
    clearTrack()
    
    // 绘制轨迹线
    const points = tracks.map(t => ({ lng: t.longitude, lat: t.latitude }))
    const lngLats = points.map(p => new window.T.LngLat(p.lng, p.lat))
    
    trackLine = new window.T.Polyline(lngLats, {
      color: 'blue',
      weight: 3,
      opacity: 0.8
    })
    map.addOverLay(trackLine)
    
    // 添加轨迹点标记
    tracks.forEach((track, index) => {
      const marker = new window.T.Marker(new window.T.LngLat(track.longitude, track.latitude))
      marker.addEventListener('click', function() {
        const info = new window.T.InfoWindow()
        info.setContent(`
          <div>
            <p>时间: ${track.trackTime}</p>
            <p>位置: ${track.address || '未知'}</p>
            <p>速度: ${track.speed} km/h</p>
          </div>
        `)
        marker.openInfoWindow(info)
      })
      map.addOverLay(marker)
      markers.push(marker)
    })
    
    // 调整地图视野
    TDTUtil.setViewport(map, points)
  } catch (error) {
    console.error('绘制轨迹失败:', error)
  }
}

function clearTrack() {
  // 清除轨迹
  if (!map) return
  
  TDTUtil.clearOverlays(map)
  trackLine = null
  markers = []
}

async function locatePoint(row) {
  // 定位到指定点
  if (!map) {
    ElMessage.error('地图未初始化，请稍后重试')
    return
  }
  
  try {
    // 确保天地图 CarTrack 扩展库已加载
    await loadCarTrackLibraries()
    
    // 移动到当前位置
    map.centerAndZoom(new window.T.LngLat(row.longitude, row.latitude), 18)
    
    // 创建自定义图标
    const icon = new window.T.Icon({
      iconUrl: 'http://api.tianditu.gov.cn/img/map/markerA.png',
      iconSize: new window.T.Point(29, 37),
      iconAnchor: new window.T.Point(10, 25)
    })
    
    // 创建标记点
    const marker = new window.T.Marker(new window.T.LngLat(row.longitude, row.latitude), {
      icon: icon,
      title: row.address || '未知位置'
    })
    
    // 确保 marker 创建成功
    if (!marker) {
      ElMessage.error('标记点创建失败')
      return
    }
    
    // 确保 map 对象有效
    if (!map || !map.addOverLay) {
      ElMessage.error('地图对象无效')
      return
    }
    
    // 清除之前的标记点
    clearTrack()
    
    // 添加标记点
    map.addOverLay(marker)
    
    // 添加信息窗口
    const info = new window.T.InfoWindow()
    info.setContent(`
      <div style="padding: 8px;">
        <p><strong>时间:</strong> ${row.trackTime}</p>
        <p><strong>位置:</strong> ${row.address || '未知位置'}</p>
        <p><strong>速度:</strong> ${row.speed} km/h</p>
      </div>
    `)
    marker.openInfoWindow(info)
    
    ElMessage.success('定位到: ' + (row.address || '未知位置'))
  } catch (error) {
    console.error('定位失败:', error)
    ElMessage.error('定位失败: ' + (error.message || '未知错误'))
  }
}

async function playTrack() {
  if (!trackList.value || trackList.value.length === 0) {
    ElMessage.warning('没有轨迹数据可播放')
    return
  }
  
  try {
    // 确保天地图 CarTrack 扩展库已加载
    await loadCarTrackLibraries()
    
    // 清除当前地图上的所有覆盖物
    clearTrack()
    
    // 准备轨迹数据
    const points = trackList.value.map(t => ({
      lng: t.longitude,
      lat: t.latitude,
      time: t.trackTime,
      address: t.address || '未知位置',
      speed: t.speed || 0
    }))
    
    // 转换为天地图格式
    const lngLats = points.map(p => new window.T.LngLat(p.lng, p.lat))
    
    // 初始化 CarTrack
    if (carTrack) {
      carTrack.stop()
      carTrack.clear()
    }
    
    carTrack = new window.T.CarTrack(map, {
      interval: 25, // 更新间隔(ms)
      speed: 1000, // 速度 米/秒
      dynamicLine: true, // 动态路线
      polylinestyle: { // 路线样式
        color: '#2C64A7',
        weight: 6,
        opacity: 0.9
      },
      arrowStyle: { // 箭头样式
        display: true,
        offset: 30,
        repeat: 60,
        pixelSize: 5,
        headAngle: 75,
        color: '#fff',
        weight: 3
      },
      passedLineColor: '#0000ff', // 已通过路线颜色
      notPassedLineColor: '#ff0000', // 未通过路线颜色
      Datas: lngLats,
      loop: false // 不循环播放
    })
    
    // 开始播放
    carTrack.start()
    isPlaying.value = true
    
    // 添加控制按钮
    addCarTrackControls()
    
    ElMessage.success('轨迹播放已开始')
    
  } catch (error) {
    console.error('轨迹播放失败:', error)
    ElMessage.error('轨迹播放失败: ' + (error.message || '未知错误'))
  }
}

async function pauseTrack() {
  if (carTrack) {
    carTrack.pause()
    isPlaying.value = false
    ElMessage.info('轨迹播放已暂停')
  }
}

async function loadCarTrackLibraries() {
  // 动态加载 CarTrack 所需的库
  return new Promise((resolve, reject) => {
    // 检查是否已经加载了必要的库
    if (window.d3 && window.T && window.T.CarTrack) {
      resolve()
      return
    }
    
    // 加载 D3 库
    const d3Script = document.createElement('script')
    d3Script.src = 'http://lbs.tianditu.gov.cn/js/lib/d3/d3.min.js'
    d3Script.onload = () => {
      // 加载 D3SvgOverlay 库
      const d3SvgOverlayScript = document.createElement('script')
      d3SvgOverlayScript.src = 'http://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/D3SvgOverlay.js'
      d3SvgOverlayScript.onload = () => {
        // 加载 CarTrack 库
        const carTrackScript = document.createElement('script')
        carTrackScript.src = 'http://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/CarTrack.js'
        carTrackScript.onload = () => {
          resolve()
        }
        carTrackScript.onerror = (error) => {
          console.error('CarTrack 库加载失败:', error)
          reject(error)
        }
        document.head.appendChild(carTrackScript)
      }
      d3SvgOverlayScript.onerror = (error) => {
        console.error('D3SvgOverlay 库加载失败:', error)
        reject(error)
      }
      document.head.appendChild(d3SvgOverlayScript)
    }
    d3Script.onerror = (error) => {
      console.error('D3 库加载失败:', error)
      reject(error)
    }
    document.head.appendChild(d3Script)
  })
}

function addCarTrackControls() {
  // 添加控制按钮
  const controlDiv = document.createElement('div')
  controlDiv.className = 'car-track-controls'
  controlDiv.innerHTML = `
    <div class="car-track-control-buttons" style="position: absolute; top: 10px; right: 10px; z-index: 1000; background: rgba(255,255,255,0.9); padding: 8px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <button id="carTrackStartBtn" style="margin-right: 5px; background-color: #409EFF; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">开始</button>
      <button id="carTrackPauseBtn" style="margin-right: 5px; background-color: #E6A23C; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">暂停</button>
      <button id="carTrackStopBtn" style="background-color: #F56C6C; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">停止</button>
    </div>
  `
  const mapContainer = document.getElementById('trackMap')
  if (mapContainer) {
    mapContainer.appendChild(controlDiv)
    
    // 绑定事件
    document.getElementById('carTrackStartBtn').onclick = () => {
      if (carTrack) {
        carTrack.start()
        isPlaying.value = true
      }
    }
    
    document.getElementById('carTrackPauseBtn').onclick = () => {
      if (carTrack) {
        carTrack.pause()
        isPlaying.value = false
      }
    }
    
    document.getElementById('carTrackStopBtn').onclick = () => {
      if (carTrack) {
        carTrack.stop()
        carTrack.clear()
        isPlaying.value = false
        ElMessage.info('轨迹播放已停止')
        
        // 清理控制按钮
        if (controlDiv.parentNode) {
          controlDiv.parentNode.removeChild(controlDiv)
        }
      }
    }
  }
}

onMounted(() => {
  // 检查是否有从设备页面传递过来的参数
  const { deviceId, deviceName, residentId, deviceCode } = route.query
  if (deviceId) {
    queryParams.deviceId = Number(deviceId)
    // if (residentId) {
    //   queryParams.residentId = Number(residentId)
    // }
    if (deviceCode) {
      queryParams.deviceCode = deviceCode
    }
    ElMessage.success(`正在查看设备 ${deviceName} 的轨迹`)
    console.log('从设备页面跳转而来，设备ID:', deviceId, '长者ID:', residentId)
  }
  getList()
  getStat()
  nextTick(() => initMap())
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mb20 { margin-bottom: 20px; }
.mt20 { margin-top: 20px; }
.track-play-control {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}
</style>
