<template>
  <div class="app-container space-manage">
    <!-- 统计概览 -->
    <el-row :gutter="16" class="mb16">
      <el-col :span="4" v-for="stat in statCards" :key="stat.label">
        <div class="stat-card" :style="{ borderColor: stat.color }">
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 左侧：楼栋 / 楼层 树 -->
      <el-col :span="5">
        <el-card shadow="never" class="tree-card" v-loading="treeLoading">
          <template #header>
            <div class="tree-header">
              <span class="tree-title"><el-icon><OfficeBuilding /></el-icon> 楼栋 / 楼层</span>
            </div>
          </template>
          <el-tree
            ref="treeRef"
            :key="treeKey"
            lazy
            :load="loadNode"
            node-key="nodeKey"
            :expand-on-click-node="false"
            highlight-current
            @node-click="onNodeClick">
            <template #default="{ data }">
              <span class="tree-node">
                <el-icon v-if="data.nodeType === 'building'"><House /></el-icon>
                <el-icon v-else><Grid /></el-icon>
                <span class="node-label">{{ data.nodeType === 'building' ? data.buildingName : (data.floorName || (data.floorNo + 'F')) }}</span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧：房间管理 -->
      <el-col :span="19">
        <el-card shadow="never">
          <div class="context-bar">
            <el-icon><Location /></el-icon>
            <span v-if="currentFloor">当前：{{ currentFloor.buildingName || '' }} · {{ currentFloor.floorName || (currentFloor.floorNo + 'F') }}</span>
            <span v-else-if="currentBuilding">当前：{{ currentBuilding.buildingName }}（全部楼层）</span>
            <span v-else class="muted">未选择楼栋/楼层（显示全部房间）</span>
            <div class="ctx-right">
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="card"><el-icon><Grid /></el-icon> 卡片</el-radio-button>
                <el-radio-button label="table"><el-icon><List /></el-icon> 表格</el-radio-button>
              </el-radio-group>
              <el-button link type="primary" icon="Refresh" @click="refreshAll">刷新</el-button>
            </div>
          </div>

          <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
            <el-form-item label="房间名称" prop="roomName">
              <el-input v-model="queryParams.roomName" placeholder="请输入房间名称" clearable style="width:160px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="房型" prop="roomType">
              <el-select v-model="queryParams.roomType" placeholder="全部" clearable style="width:130px">
                <el-option v-for="t in ROOM_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="全部" clearable style="width:130px">
                <el-option v-for="s in roomStatusOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div v-loading="loading" v-if="viewMode === 'card'" class="room-grid">
            <el-empty v-if="!roomList.length" description="当前筛选条件下暂无房间" />
            <el-row :gutter="16">
              <el-col v-for="room in roomList" :key="room.id" :xs="24" :sm="12" :md="8" :lg="6">
                <div class="room-card" :class="`room-card--${roomStatusKey(room.status)}`">
                  <div class="rc-top">
                    <div class="rc-name">
                      <span class="rc-no">{{ room.roomNo }}</span>
                      <span class="rc-title">{{ room.roomName || '未命名房间' }}</span>
                    </div>
                    <el-tag :type="roomStatusType(room.status)" size="small">{{ roomStatusLabel(room.status) }}</el-tag>
                  </div>
                  <div class="rc-meta">
                    <span>{{ getRoomTypeName(room.roomType) || '未设房型' }}</span>
                    <el-tag v-if="room.roomLevel != null" size="small" effect="plain" type="warning">{{ getRoomLevelName(room.roomLevel) }}</el-tag>
                    <span class="rc-gender">{{ genderLabel(room.genderType) }}</span>
                  </div>
                  <div class="rc-bed">
                    <span>床位占用</span>
                    <span class="rc-bed-val">{{ room.occupiedCount || 0 }} / {{ room.bedCount || 0 }}</span>
                  </div>
                  <div class="rc-bar"><div class="rc-bar-inner" :style="{ width: bedPercent(room) + '%' }"></div></div>
                  <div class="rc-price">¥{{ room.dailyPrice || 0 }} <span class="rc-unit">/床/天</span></div>
                  <div class="rc-cfg">
                    <el-tag v-if="room.hasToilet === 1" size="small" effect="plain" class="cfg-tag">卫浴</el-tag>
                    <el-tag v-if="room.hasBalcony === 1" size="small" effect="plain" class="cfg-tag">阳台</el-tag>
                    <el-tag v-if="room.hasNurseCall === 1" size="small" effect="plain" class="cfg-tag">呼叫器</el-tag>
                    <el-tag v-if="room.cameraDeviceId" size="small" effect="plain" type="info" class="cfg-tag">监控</el-tag>
                  </div>
                  <div class="rc-actions">
                    <el-button link type="primary" icon="Menu" @click="openBed(room)" v-hasPermi="['care:bed:list']">床位</el-button>
                    <el-button link type="success" icon="Plus" @click="openCheckin(room)" v-hasPermi="['care:checkin:add']">入住</el-button>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-table v-else v-loading="loading" :data="roomList" border>
            <el-table-column label="房间编号" prop="roomNo" width="100" />
            <el-table-column label="房间名称" prop="roomName" min-width="120" show-overflow-tooltip />
            <el-table-column label="房型" prop="roomType" width="90" align="center">
              <template #default="{ row }">{{ getRoomTypeName(row.roomType) || '-' }}</template>
            </el-table-column>
            <el-table-column label="房间等级" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.roomLevel != null" size="small" effect="plain" type="warning">{{ getRoomLevelName(row.roomLevel) }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="性别要求" width="80" align="center">
              <template #default="{ row }">{{ genderLabel(row.genderType) }}</template>
            </el-table-column>
            <el-table-column label="床位" width="80" align="center">
              <template #default="{ row }">{{ row.occupiedCount || 0 }} / {{ row.bedCount || 0 }}</template>
            </el-table-column>
            <el-table-column label="日单价" width="90" align="right">
              <template #default="{ row }"><span style="color:#f56c6c">¥{{ row.dailyPrice || 0 }}</span></template>
            </el-table-column>
            <el-table-column label="配置" min-width="150">
              <template #default="{ row }">
                <el-tag v-if="row.hasToilet === 1" size="small" effect="plain" class="cfg-tag">卫浴</el-tag>
                <el-tag v-if="row.hasBalcony === 1" size="small" effect="plain" class="cfg-tag">阳台</el-tag>
                <el-tag v-if="row.hasNurseCall === 1" size="small" effect="plain" class="cfg-tag">呼叫器</el-tag>
                <el-tag v-if="row.cameraDeviceId" size="small" effect="plain" type="info" class="cfg-tag">监控</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="roomStatusType(row.status)" size="small">{{ roomStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" icon="Menu" @click="openBed(row)" v-hasPermi="['care:bed:list']">床位</el-button>
                <el-button link type="success" icon="Plus" @click="openCheckin(row)" v-hasPermi="['care:checkin:add']">入住</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 床位抽屉 -->
    <el-drawer :title="`床位管理 - ${curRoom.roomName || curRoom.roomNo || ''}`" v-model="bedDrawer" size="62%" append-to-body>
      <div style="margin-bottom:12px">
        <span style="color:#909399;font-size:12px">房间「{{ curRoom.roomName || curRoom.roomNo }}」共 {{ bedList.length }} 张床位，床位档案由「房间管理」维护</span>
      </div>
      <el-table v-loading="bedLoading" :data="bedList" border>
        <el-table-column label="床位编号" prop="bedNo" min-width="110" />
        <el-table-column label="床位名称" prop="bedName" min-width="110" />
        <el-table-column label="类型" min-width="90" align="center"><template #default="{ row }"><el-tag size="small" effect="plain">{{ bedTypeLabel(row.bedType) }}</el-tag></template></el-table-column>
        <el-table-column label="入住长者" min-width="110">
          <template #default="{ row }"><span v-if="row.curResidentName" style="color:#409eff;font-weight:600">{{ row.curResidentName }}</span><span v-else style="color:#c0c4cc">空闲</span></template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center"><template #default="{ row }"><el-tag :type="bedStatusType(row.status)" size="small">{{ bedStatusLabel(row.status) }}</el-tag></template></el-table-column>
      </el-table>
    </el-drawer>

    <!-- 办理入住：选择床位 -->
    <el-dialog v-model="checkinBedOpen" :title="`选择床位 · ${checkinRoom.roomName || checkinRoom.roomNo || ''}`" width="580px" append-to-body>
      <div class="bed-pick-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>房间「{{ checkinRoom.roomName || checkinRoom.roomNo }}」共 {{ checkinRoom.bedCount || 0 }} 张床位，当前空闲 {{ freeBedList.length }} 张，点击床位即可办理入住</span>
      </div>
      <div v-loading="checkinBedLoading" class="bed-pick-grid">
        <el-empty v-if="!checkinBedLoading && !freeBedList.length" description="该房间暂无空闲床位" :image-size="70" />
        <div v-for="bed in freeBedList" :key="bed.id" class="bed-pick-item" @click="goCheckin(bed)">
          <el-icon><Menu /></el-icon>
          <span class="bp-no">{{ bed.bedNo }}</span>
          <span class="bp-type">{{ bedTypeLabel(bed.bedType) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="checkinBedOpen = false">取消</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup name="RoomStatus">
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { listAllBuildings } from '@/api/care/building'
import { listFloorByBuilding } from '@/api/care/floor'
import { listRoom, getRoomUsage } from '@/api/care/room'
import { listBedByRoom, listFreeBeds } from '@/api/care/bed'
import { getRoomLevelName, ROOM_TYPE_OPTIONS, getRoomTypeName } from '@/utils/careEnums'

const { proxy } = getCurrentInstance()
const router = useRouter()

// ─── 枚举/选项 ──────────────────────────────
const roomStatusOptions = [
  { value: 1, label: '空闲' }, { value: 2, label: '已预订' }, { value: 3, label: '已满房' },
  { value: 4, label: '维修中' }, { value: 5, label: '清洁中' }, { value: 0, label: '禁用' }
]
const bedTypeOptions = [{ value: 1, label: '普通床' }, { value: 2, label: '护理床' }, { value: 3, label: '康复床' }]
const bedStatusOptions = [
  { value: 1, label: '空闲' }, { value: 2, label: '占用' }, { value: 3, label: '预订' },
  { value: 4, label: '维修' }, { value: 5, label: '清洁' }, { value: 0, label: '禁用' }
]
const genderLabel = v => (v === 1 ? '男' : v === 2 ? '女' : '不限')
const roomStatusLabel = v => (roomStatusOptions.find(s => s.value === v) || {}).label || '未知'
const roomStatusType = v => ({ 1: 'success', 2: 'warning', 3: 'danger', 4: 'info', 5: 'primary', 0: 'info' }[v] || 'info')
const bedTypeLabel = v => (bedTypeOptions.find(t => t.value === v) || {}).label || '未知'
const bedStatusLabel = v => (bedStatusOptions.find(s => s.value === v) || {}).label || '未知'
const bedStatusType = v => ({ 1: 'success', 2: 'warning', 3: 'primary', 4: 'info', 5: 'primary', 0: 'info' }[v] || 'info')
const roomStatusKey = v => ({ 1: 'free', 2: 'booked', 3: 'full', 4: 'repair', 5: 'clean', 0: 'off' }[v] || 'free')
const bedPercent = room => { const t = room.bedCount || 0; return t ? Math.min(100, Math.round((room.occupiedCount || 0) / t * 100)) : 0 }

// ─── 统计概览 ───────────────────────────────
const usage = ref({})
const statCards = computed(() => {
  const u = usage.value || {}
  const cnt = (s) => (u[s] && u[s].totalCount) || 0
  const sum = Object.values(u).reduce((a, v) => a + (v.totalCount || 0), 0)
  const occupied = cnt(2) + cnt(3)
  return [
    { label: '房间总数', value: sum, color: '#303133' },
    { label: '空闲', value: cnt(1), color: '#67c23a' },
    { label: '已预订', value: cnt(2), color: '#e6a23c' },
    { label: '满房', value: cnt(3), color: '#409eff' },
    { label: '维修中', value: cnt(4), color: '#909399' },
    { label: '入住率', value: (sum > 0 ? Math.round(occupied / sum * 100) : 0) + '%', color: '#f56c6c' }
  ]
})
async function loadUsage() {
  try {
    const res = await getRoomUsage({ buildingId: queryParams.buildingId, floorId: queryParams.floorId })
    usage.value = res.data || {}
  } catch { usage.value = {} }
}

// ─── 左侧 楼栋/楼层 树 ─────────────────────
const treeRef = ref(null)
const treeKey = ref(0)
const treeLoading = ref(false)
const currentBuilding = ref(null)
const currentFloor = ref(null)

function refreshTree() { treeKey.value++ }

function loadNode(node, resolve) {
  if (node.level === 0) {
    listAllBuildings().then(res => {
      resolve((res.data || []).map(b => ({ ...b, nodeType: 'building', nodeKey: 'b_' + b.id })))
    }).catch(() => resolve([]))
  } else if (node.data.nodeType === 'building') {
    listFloorByBuilding(node.data.id).then(res => {
      resolve((res.data || []).map(f => ({ ...f, nodeType: 'floor', nodeKey: 'f_' + f.id, buildingId: node.data.id, buildingName: node.data.buildingName })))
    }).catch(() => resolve([]))
  } else {
    resolve([])
  }
}
function onNodeClick(data) {
  if (data.nodeType === 'building') {
    currentBuilding.value = data
    currentFloor.value = null
    queryParams.buildingId = data.id
    queryParams.floorId = undefined
  } else {
    currentFloor.value = data
    currentBuilding.value = { id: data.buildingId, buildingName: data.buildingName }
    queryParams.buildingId = data.buildingId
    queryParams.floorId = data.id
  }
  queryParams.pageNum = 1
  getList()
}

// ─── 房间 ──────────────────────────────────
const loading = ref(false)
const roomList = ref([])
const viewMode = ref('card')
const total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 12, buildingId: undefined, floorId: undefined, roomName: undefined, roomType: undefined, status: undefined })
function getList() {
  loading.value = true
  listRoom(queryParams).then(res => { roomList.value = res.data.list || []; total.value = res.data.totalCount || 0; loading.value = false })
    .catch(() => { loading.value = false })
  loadUsage()
}
function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); getList() }

// ─── 床位 ──────────────────────────────────
const bedDrawer = ref(false)
const bedLoading = ref(false)
const curRoom = ref({})
const bedList = ref([])
function openBed(row) { curRoom.value = row; bedDrawer.value = true; loadBeds() }
function loadBeds() {
  bedLoading.value = true
  listBedByRoom(curRoom.value.id).then(res => { bedList.value = res.data || []; bedLoading.value = false })
    .catch(() => { bedLoading.value = false })
}
function refreshAll() { refreshTree(); getList() }

// ─── 办理入住：先选床位，再跳登记表单 ─────────
const checkinBedOpen = ref(false)
const checkinBedLoading = ref(false)
const checkinRoom = ref({})
const freeBedList = ref([])

function openCheckin(row) {
  if (Number(row.status) === 0) { proxy.$modal.msgWarning('该房间已禁用，无法办理入住'); return }
  if (Number(row.status) === 4) { proxy.$modal.msgWarning('该房间维修中，无法办理入住'); return }
  const bedCount = Number(row.bedCount) || 0
  const occupied = Number(row.occupiedCount) || 0
  if (bedCount > 0 && occupied >= bedCount) { proxy.$modal.msgWarning('该房间床位已满，无法办理入住'); return }
  checkinRoom.value = row
  freeBedList.value = []
  checkinBedOpen.value = true
  loadFreeBeds()
}

function loadFreeBeds() {
  checkinBedLoading.value = true
  listFreeBeds({ roomId: checkinRoom.value.id })
    .then(res => { freeBedList.value = res.data || [] })
    .catch(() => { freeBedList.value = []; proxy.$modal.msgError('查询空闲床位失败，请检查「床位列表」权限') })
    .finally(() => { checkinBedLoading.value = false })
}

function goCheckin(bed) {
  const room = checkinRoom.value
  checkinBedOpen.value = false
  router.push({
    path: '/eyang/checkin/form',
    query: {
      roomId: room.id,
      roomName: room.roomName || room.roomNo || '',
      buildingId: room.buildingId ?? queryParams.buildingId,
      floorId: room.floorId ?? queryParams.floorId,
      bedId: bed.id,
      bedNo: bed.bedNo
    }
  })
}

onMounted(() => { getList() })
</script>

<style scoped>
.space-manage .mb16 { margin-bottom: 16px; }
.stat-card { background: #fff; border-radius: 10px; border-left: 4px solid #dcdfe6; padding: 14px 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.space-manage .tree-card { height: calc(100vh - 190px); overflow: auto; }
.tree-header { display: flex; justify-content: space-between; align-items: center; }
.tree-title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
.tree-node { display: flex; align-items: center; gap: 4px; width: 100%; font-size: 14px; }
.tree-node .node-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.context-bar { margin-bottom: 12px; color: #606266; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.context-bar .muted { color: #c0c4cc; }
.context-bar .ctx-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.cfg-tag { margin-right: 4px; }

/* ── 房间卡片 ── */
.room-grid { min-height: 120px; }
.room-card { background: #fff; border: 1px solid #ebeef5; border-left: 4px solid #67c23a; border-radius: 10px; padding: 14px; margin-bottom: 16px; box-shadow: 0 1px 6px rgba(0,0,0,.05); transition: all .2s; }
.room-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,.12); transform: translateY(-2px); }
.room-card--free { border-left-color: #67c23a; }
.room-card--booked { border-left-color: #e6a23c; }
.room-card--full { border-left-color: #409eff; }
.room-card--repair { border-left-color: #909399; }
.room-card--clean { border-left-color: #409eff; }
.room-card--off { border-left-color: #c0c4cc; }
.rc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
.rc-name { display: flex; flex-direction: column; overflow: hidden; }
.rc-no { font-size: 13px; color: #909399; }
.rc-title { font-size: 16px; font-weight: 700; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rc-meta { display: flex; align-items: center; gap: 8px; margin: 10px 0 8px; font-size: 13px; color: #606266; flex-wrap: wrap; }
.rc-gender { color: #909399; }
.rc-bed { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #606266; }
.rc-bed-val { font-weight: 600; }
.rc-bar { height: 6px; background: #f0f2f5; border-radius: 3px; overflow: hidden; margin: 6px 0 10px; }
.rc-bar-inner { height: 100%; background: linear-gradient(90deg, #67c23a, #409eff); transition: width .3s; }
.rc-price { font-size: 18px; font-weight: 700; color: #f56c6c; margin-bottom: 8px; }
.rc-unit { font-size: 12px; color: #909399; font-weight: 400; }
.rc-cfg { min-height: 24px; margin-bottom: 8px; }
.rc-actions { display: flex; justify-content: space-between; border-top: 1px dashed #eee; padding-top: 8px; }

/* ── 入住选床 ── */
.bed-pick-tip { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #909399; margin-bottom: 14px; }
.bed-pick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; min-height: 96px; }
.bed-pick-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; background: #fafcff; border: 1px solid #e4e7ed; border-radius: 10px; cursor: pointer; transition: all .18s; }
.bed-pick-item:hover { border-color: #67c23a; background: #f0f9eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(103,194,58,.18); }
.bed-pick-item .el-icon { font-size: 18px; color: #67c23a; }
.bp-no { font-size: 15px; font-weight: 700; color: #1d2129; }
.bp-type { font-size: 12px; color: #909399; }
</style>
