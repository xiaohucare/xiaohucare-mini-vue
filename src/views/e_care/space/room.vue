<template>
  <div class="app-container space-manage">
    <splitpanes ref="panesRef" :horizontal="appStore.device === 'mobile'" class="default-theme space-panes" @resized="onPanesResized">
      <!-- 左侧：楼栋 / 楼层 树 -->
      <pane :size="treePaneSize" min-size="14">
        <el-card ref="treeCardRef" shadow="never" class="tree-card" v-loading="treeLoading">
          <template #header>
            <div class="tree-header">
              <span class="tree-title"><el-icon><OfficeBuilding /></el-icon> 楼栋 / 楼层</span>
              <el-button link type="primary" icon="Plus" @click="handleAddBuilding" v-hasPermi="['care:building:submit']">楼栋</el-button>
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
                <span class="node-ops">
                  <template v-if="data.nodeType === 'building'">
                    <el-button link type="primary" icon="Plus" @click.stop="handleAddFloor(data)" v-hasPermi="['care:floorplan:submit']" title="新增楼层" />
                    <el-button link type="primary" icon="Edit" @click.stop="handleEditBuilding(data)" v-hasPermi="['care:building:submit']" title="编辑楼栋" />
                    <el-button link type="danger" icon="Delete" @click.stop="handleDeleteBuilding(data)" v-hasPermi="['care:building:delete']" title="删除楼栋" />
                  </template>
                  <template v-else>
                    <el-button link type="primary" icon="Edit" @click.stop="handleEditFloor(data)" v-hasPermi="['care:floorplan:submit']" title="编辑楼层" />
                    <el-button link type="danger" icon="Delete" @click.stop="handleDeleteFloor(data)" v-hasPermi="['care:floorplan:delete']" title="删除楼层" />
                  </template>
                </span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </pane>

      <!-- 右侧：房间管理 -->
      <pane :size="roomPaneSize" min-size="46">
        <el-card shadow="never" class="room-card">
          <div class="context-bar">
            <el-icon><Location /></el-icon>
            <span v-if="currentFloor">当前：{{ currentFloor.buildingName || '' }} · {{ currentFloor.floorName || (currentFloor.floorNo + 'F') }}</span>
            <span v-else-if="currentBuilding">当前：{{ currentBuilding.buildingName }}（全部楼层）</span>
            <span v-else class="muted">未选择楼栋/楼层（显示全部房间，建议先在左侧选择）</span>
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
              <el-button type="success" plain icon="Plus" @click="handleAddRoom" v-hasPermi="['care:room:submit']">新增房间</el-button>
            </el-form-item>
          </el-form>

          <el-table ref="roomTableRef" v-loading="loading" :data="roomList" border>
            <el-table-column label="房间编号" prop="roomNo" width="100" />
            <el-table-column label="房间名称" prop="roomName" min-width="120" />
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
            <el-table-column label="床位" width="90" align="center">
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
            <el-table-column label="操作" width="270" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" icon="Menu" @click="openBed(row)" v-hasPermi="['care:bed:list']">床位</el-button>
                <el-button link type="success" icon="Plus" @click="goCheckin(row)" v-hasPermi="['care:checkin:add']">入住</el-button>
                <el-button link type="primary" icon="Edit" @click="handleEditRoom(row)" v-hasPermi="['care:room:submit']">编辑</el-button>
                <el-button link type="danger" icon="Delete" @click="handleDeleteRoom(row)" v-hasPermi="['care:room:delete']">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
      </pane>
    </splitpanes>

    <!-- 楼栋 新增/编辑 -->
    <el-dialog :title="buildingTitle" v-model="buildingOpen" width="800px" append-to-body>
      <el-form ref="buildingFormRef" :model="buildingForm" :rules="buildingRules" label-width="96px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="楼栋编号" prop="buildingNo"><el-input v-model="buildingForm.buildingNo" placeholder="如：A1" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="楼栋名称" prop="buildingName"><el-input v-model="buildingForm.buildingName" placeholder="如：银杏楼" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="楼栋类型" prop="buildingType">
              <el-radio-group v-model="buildingForm.buildingType">
                <el-radio :label="1">独立楼栋</el-radio>
                <el-radio :label="2">楼层分区</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="总楼层数" prop="totalFloors"><el-input-number v-model="buildingForm.totalFloors" :min="0" :max="200" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="用途分区" prop="usageType">
              <el-select v-model="buildingForm.usageType" filterable allow-create default-first-option clearable placeholder="请选择或输入" style="width:100%">
                <el-option v-for="u in usageOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="负责人" prop="managerName"><el-input v-model="buildingForm.managerName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sortOrder"><el-input-number v-model="buildingForm.sortOrder" :min="0" :max="999" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status"><el-switch v-model="buildingForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="buildingForm.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitBuildingForm">确 定</el-button><el-button @click="buildingOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 楼层 新增/编辑 -->
    <el-dialog :title="floorTitle" v-model="floorOpen" width="560px" append-to-body>
      <el-form ref="floorFormRef" :model="floorForm" :rules="floorRules" label-width="100px">
        <el-row :gutter="18">
          <el-col :span="24" style="margin-bottom:6px;color:#909399;font-size:12px;padding-left:14px;">所属楼栋：{{ floorForm.buildingName }}</el-col>
          <el-col :span="12"><el-form-item label="楼层编号" prop="floorNo"><el-input-number v-model="floorForm.floorNo" :min="-10" :max="200" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="楼层名称" prop="floorName"><el-input v-model="floorForm.floorName" placeholder="如：1F/护理一层" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="主要朝向" prop="orientation">
            <el-radio-group v-model="floorForm.orientation">
              <el-radio :label="'东'">东</el-radio>
              <el-radio :label="'西'">西</el-radio>
              <el-radio :label="'南'">南</el-radio>
              <el-radio :label="'北'">北</el-radio>
            </el-radio-group>
          </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="有无电梯" prop="hasElevator"><el-switch v-model="floorForm.hasElevator" :active-value="1" :inactive-value="0" active-text="有" inactive-text="无" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="floorForm.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitFloorForm">确 定</el-button><el-button @click="floorOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 房间 新增/编辑 -->
    <el-dialog :title="roomTitle" v-model="roomOpen" width="80%" append-to-body>
      <el-form ref="roomFormRef" :model="roomForm" :rules="roomRules" label-width="100px">
        <el-divider content-position="left">位置</el-divider>
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="楼栋" prop="buildingId">
              <el-select v-model="roomForm.buildingId" placeholder="请选择楼栋" style="width:100%" @change="onRoomBuildingChange">
                <el-option v-for="b in buildings" :key="b.id" :label="b.buildingName" :value="b.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼层" prop="floorId">
              <el-select v-model="roomForm.floorId" placeholder="请选择楼层" style="width:100%" :disabled="!roomForm.buildingId">
                <el-option v-for="f in roomFormFloors" :key="f.id" :label="f.floorName || (f.floorNo + 'F')" :value="f.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
         <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="房间编号" prop="roomNo"><el-input v-model="roomForm.roomNo" placeholder="如：201" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="房间名称" prop="roomName"><el-input v-model="roomForm.roomName" placeholder="如：阳光双人间" /></el-form-item></el-col>
          </el-row>
         <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="房型" prop="roomType">
              <el-select v-model="roomForm.roomType" clearable placeholder="请选择房型" style="width:100%">
                <el-option v-for="t in ROOM_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="朝向" prop="orientation">
             <el-radio-group v-model="roomForm.orientation">
              <el-radio :label="'东'">东</el-radio>
              <el-radio :label="'西'">西</el-radio>
              <el-radio :label="'南'">南</el-radio>
              <el-radio :label="'北'">北</el-radio>
            </el-radio-group>
          </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">床位与收费</el-divider>
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="床位总数" prop="bedCount"><el-input-number v-model="roomForm.bedCount" :min="1" :max="50" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="房间等级" prop="roomLevel">
              <el-select v-model="roomForm.roomLevel" placeholder="请选择房间等级" style="width:100%" clearable>
                <el-option v-for="item in ROOM_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格类型" prop="spacePriceType">
              <el-select v-model="roomForm.spacePriceType" style="width:100%"><el-option label="普通价格" :value="0" /><el-option label="会员价格" :value="1" /></el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别要求" prop="genderType">
               <el-radio-group v-model="roomForm.genderType">
                <el-radio :label="0">不限</el-radio>
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="面积(㎡)" prop="area"><el-input-number v-model="roomForm.area" :min="0" :precision="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sortOrder"><el-input-number v-model="roomForm.sortOrder" :min="0" :max="999" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-divider content-position="left">设施与状态</el-divider>
        <el-row :gutter="18">
          <el-col :span="6"><el-form-item label="独立卫浴" prop="hasToilet"><el-switch v-model="roomForm.hasToilet" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="阳台" prop="hasBalcony"><el-switch v-model="roomForm.hasBalcony" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="床头呼叫器" prop="hasNurseCall"><el-switch v-model="roomForm.hasNurseCall" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
          <el-col :span="6">
            <el-form-item label="房态" prop="status">
              <el-select v-model="roomForm.status" style="width:100%"><el-option v-for="s in roomStatusOptions" :key="s.value" :label="s.label" :value="s.value" /></el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="监控设备编号" prop="cameraDeviceId"><el-input v-model="roomForm.cameraDeviceId" placeholder="选填，用于视频直播" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="适老设施" prop="facilityJson"><el-input v-model="roomForm.facilityJson" placeholder="如：扶手,防滑地垫,护理床" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="房间说明" prop="content"><el-input v-model="roomForm.content" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="roomForm.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRoomForm">确 定</el-button><el-button @click="roomOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 床位抽屉 -->
    <el-drawer :title="`床位管理 - ${curRoom.roomName || curRoom.roomNo || ''}`" v-model="bedDrawer" size="62%" append-to-body>
      <div style="margin-bottom:12px">
        <el-button type="primary" plain icon="Plus" @click="handleAddBed" v-hasPermi="['care:bed:submit']">新增床位</el-button>
        <span style="margin-left:12px;color:#909399;font-size:12px">房间「{{ curRoom.roomName || curRoom.roomNo }}」共 {{ bedList.length }} 张床位</span>
      </div>
      <el-table v-loading="bedLoading" :data="bedList" border>
        <el-table-column label="床位编号" prop="bedNo" min-width="110" />
        <el-table-column label="床位名称" prop="bedName" min-width="110" />
        <el-table-column label="类型" min-width="90" align="center"><template #default="{ row }"><el-tag size="small" effect="plain">{{ bedTypeLabel(row.bedType) }}</el-tag></template></el-table-column>
        <el-table-column label="入住长者" min-width="110">
          <template #default="{ row }"><span v-if="row.curResidentName" style="color:#409eff;font-weight:600">{{ row.curResidentName }}</span><span v-else style="color:#c0c4cc">空闲</span></template>
        </el-table-column>
        <!-- <el-table-column label="日单价" width="90" align="right"><template #default="{ row }"><span style="color:#f56c6c">¥{{ row.dailyPrice || 0 }}</span></template></el-table-column>
        -->
        <el-table-column label="状态" width="90" align="center"><template #default="{ row }"><el-tag :type="bedStatusType(row.status)" size="small">{{ bedStatusLabel(row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditBed(row)" v-hasPermi="['care:bed:submit']">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteBed(row)" v-hasPermi="['care:bed:delete']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 床位 新增/编辑 -->
    <el-dialog :title="bedTitle" v-model="bedOpen" width="600px" append-to-body>
      <el-form ref="bedFormRef" :model="bedForm" :rules="bedRules" label-width="100px">
        <el-row :gutter="18">
          <el-col :span="24" style="margin-bottom:6px;color:#909399;font-size:12px;padding-left:14px;">所属房间：{{ bedForm.roomName }}</el-col>
          <el-col :span="12"><el-form-item label="床位编号" prop="bedNo"><el-input v-model="bedForm.bedNo" placeholder="如：201-1" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="床位名称" prop="bedName"><el-input v-model="bedForm.bedName" placeholder="如：201-靠窗床" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="床位类型" prop="bedType">
              <el-select v-model="bedForm.bedType" style="width:100%"><el-option v-for="t in bedTypeOptions" :key="t.value" :label="t.label" :value="t.value" /></el-select>
            </el-form-item>
          </el-col>
          <!-- 
          <el-col :span="12"><el-form-item label="床位日单价" prop="dailyPrice"><el-input-number v-model="bedForm.dailyPrice" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
          -->
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="bedForm.status" style="width:100%"><el-option v-for="s in selectableBedStatus" :key="s.value" :label="s.label" :value="s.value" /></el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sortOrder"><el-input-number v-model="bedForm.sortOrder" :min="0" :max="999" style="width:100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="bedForm.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
        <el-alert type="info" :closable="false" show-icon title="“占用/入住长者”由入住登记流程自动维护，此处仅管理床位基础档案。" />
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitBedForm">确 定</el-button><el-button @click="bedOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="StoreSpace">
import { useRouter } from 'vue-router'
import { listAllBuildings, getBuilding, submitBuilding, deleteBuilding } from '@/api/care/building'
import { listFloorByBuilding, getFloor, submitFloor, deleteFloor } from '@/api/care/floor'
import { listRoom, getRoom, submitRoom, deleteRoom } from '@/api/care/room'
import { listBedByRoom, getBed, submitBed, deleteBed } from '@/api/care/bed'
import { ROOM_LEVEL_OPTIONS, getRoomLevelName, ROOM_TYPE_OPTIONS, getRoomTypeName } from '@/utils/careEnums'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import useAppStore from '@/store/modules/app'

const { proxy } = getCurrentInstance()
const router = useRouter()
const appStore = useAppStore()

// ─── 枚举/选项 ──────────────────────────────
const usageOptions = ['养护区', '自理区', '康复区', '认知照护区', '安宁疗护区']
const roomStatusOptions = [
  { value: 1, label: '空闲' }, { value: 2, label: '已预订' }, { value: 3, label: '已满房' },
  { value: 4, label: '维修中' }, { value: 5, label: '清洁中' }, { value: 0, label: '禁用' }
]
const bedTypeOptions = [{ value: 1, label: '普通床' }, { value: 2, label: '护理床' }, { value: 3, label: '康复床' }]
const bedStatusOptions = [
  { value: 1, label: '空闲' }, { value: 2, label: '占用' }, { value: 3, label: '预订' },
  { value: 4, label: '维修' }, { value: 5, label: '清洁' }, { value: 0, label: '禁用' }
]
const selectableBedStatus = [
  { value: 1, label: '空闲' }, { value: 4, label: '维修' }, { value: 5, label: '清洁' }, { value: 0, label: '禁用' }
]
const genderLabel = v => (v === 1 ? '男' : v === 2 ? '女' : '不限')
const roomStatusLabel = v => (roomStatusOptions.find(s => s.value === v) || {}).label || '未知'
const roomStatusType = v => ({ 1: 'success', 2: 'warning', 3: 'danger', 4: 'info', 5: 'primary', 0: 'info' }[v] || 'info')
const bedTypeLabel = v => (bedTypeOptions.find(t => t.value === v) || {}).label || '未知'
const bedStatusLabel = v => (bedStatusOptions.find(s => s.value === v) || {}).label || '未知'
const bedStatusType = v => ({ 1: 'success', 2: 'warning', 3: 'primary', 4: 'info', 5: 'primary', 0: 'info' }[v] || 'info')

// ─── 左右分栏 ──────────────────────────
/** 左树宽度占比的本地记忆 key */
const TREE_PANE_KEY = 'store-space-tree-pane-size'
/** 默认左树占比（与 min-size 保持同一量纲：百分比） */
const DEFAULT_TREE_SIZE = 20
const panesRef = ref(null)
const treeCardRef = ref(null)
const roomTableRef = ref(null)
// size 只在初始化时读一次：拖拽后尺寸由 splitpanes 内部维护，再写 :size 会触发二次布局
const treePaneSize = ref(loadTreePaneSize())
const roomPaneSize = computed(() => 100 - treePaneSize.value)

function loadTreePaneSize() {
  const saved = Number(localStorage.getItem(TREE_PANE_KEY))
  // 脏数据或越界值直接回落默认，避免下次进入页面时右侧表格被挤没
  return saved >= 14 && saved <= 45 ? saved : DEFAULT_TREE_SIZE
}

/**
 * 拖拽（或双击分隔线最大化）结束：记住左树占比，并重算表格固定列
 * splitpanes 4.x 的 resized 事件不回传各 pane 尺寸，故用卡片实际宽度反算百分比
 */
function onPanesResized() {
  if (appStore.device !== 'mobile') {
    const total = panesRef.value?.$el?.clientWidth
    const treeWidth = treeCardRef.value?.$el?.clientWidth
    if (total && treeWidth) localStorage.setItem(TREE_PANE_KEY, String(Math.round((treeWidth / total) * 100)))
  }
  // 容器宽度变了，el-table 的 fixed="right" 操作列需要重新对齐
  nextTick(() => roomTableRef.value?.doLayout())
}

// ─── 左侧 楼栋/楼层 树 ─────────────────────
const treeRef = ref(null)
const treeKey = ref(0)
const treeLoading = ref(false)
const buildings = ref([])
const currentBuilding = ref(null)
const currentFloor = ref(null)

function refreshTree() {
  treeKey.value++
  loadBuildings()
}
function loadBuildings() { listAllBuildings().then(res => { buildings.value = res.data || [] }) }

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

// ─── 楼栋 CRUD ─────────────────────────────
const defaultBuildingForm = () => ({
  id: undefined, buildingNo: '', buildingName: '', buildingType: 1, totalFloors: 1,
  usageType: '', managerName: '', status: 1, sortOrder: 0, remark: ''
})
const buildingOpen = ref(false)
const buildingTitle = ref('')
const buildingForm = ref(defaultBuildingForm())
const buildingRules = { buildingName: [{ required: true, message: '楼栋名称不能为空', trigger: 'blur' }] }

function handleAddBuilding() {
  buildingForm.value = defaultBuildingForm()
  proxy.resetForm('buildingFormRef')
  buildingTitle.value = '新增楼栋'
  buildingOpen.value = true
}
function handleEditBuilding(data) {
  getBuilding(data.id).then(res => {
    buildingForm.value = { ...defaultBuildingForm(), ...res.data }
    buildingTitle.value = '编辑楼栋'
    buildingOpen.value = true
  })
}
function submitBuildingForm() {
  proxy.$refs['buildingFormRef'].validate(valid => {
    if (!valid) return
    submitBuilding(buildingForm.value).then(() => {
      proxy.$modal.msgSuccess('操作成功')
      buildingOpen.value = false
      refreshTree()
      if (buildingForm.value.id && currentBuilding.value && buildingForm.value.id === currentBuilding.value.id) {
        currentBuilding.value = { ...currentBuilding.value, buildingName: buildingForm.value.buildingName }
        getList()
      }
    })
  })
}
function handleDeleteBuilding(data) {
  proxy.$modal.confirm(`确认删除楼栋「${data.buildingName}」吗？其下楼层与房间需先行清理`).then(() => deleteBuilding(data.id))
    .then(() => {
      proxy.$modal.msgSuccess('删除成功')
      if (currentBuilding.value && currentBuilding.value.id === data.id) { currentBuilding.value = null; currentFloor.value = null; queryParams.buildingId = undefined; queryParams.floorId = undefined; getList() }
      refreshTree()
    }).catch(() => {})
}

// ─── 楼层 CRUD ─────────────────────────────
const defaultFloorForm = () => ({
  id: undefined, buildingId: undefined, buildingName: '', floorNo: 1, floorName: '',
  orientation: '', hasElevator: 1, area: undefined, remark: ''
})
const floorOpen = ref(false)
const floorTitle = ref('')
const floorForm = ref(defaultFloorForm())
const floorRules = {
  floorNo: [{ required: true, message: '楼层号不能为空', trigger: 'blur' }],
  floorName: [{ required: true, message: '楼层名称不能为空', trigger: 'blur' }]
}
function handleAddFloor(buildingData) {
  floorForm.value = { ...defaultFloorForm(), buildingId: buildingData.id, buildingName: buildingData.buildingName }
  proxy.resetForm('floorFormRef')
  floorTitle.value = `新增楼层 - ${buildingData.buildingName}`
  floorOpen.value = true
}
function handleEditFloor(data) {
  getFloor(data.id).then(res => {
    floorForm.value = { ...defaultFloorForm(), ...res.data, buildingId: data.buildingId, buildingName: data.buildingName }
    floorTitle.value = '编辑楼层'
    floorOpen.value = true
  })
}
function submitFloorForm() {
  proxy.$refs['floorFormRef'].validate(valid => {
    if (!valid) return
    const payload = { ...floorForm.value }
    delete payload.buildingName
    submitFloor(payload).then(() => {
      proxy.$modal.msgSuccess('操作成功')
      floorOpen.value = false
      refreshTree()
      if (currentFloor.value && currentFloor.value.id === payload.id) getList()
    })
  })
}
function handleDeleteFloor(data) {
  proxy.$modal.confirm(`确认删除楼层「${data.floorName || data.floorNo}」吗？其下房间需先行清理`).then(() => deleteFloor(data.id))
    .then(() => {
      proxy.$modal.msgSuccess('删除成功')
      if (currentFloor.value && currentFloor.value.id === data.id) { currentFloor.value = null; queryParams.floorId = undefined; getList() }
      refreshTree()
    }).catch(() => {})
}

// ─── 房间 ──────────────────────────────────
const loading = ref(false)
const roomList = ref([])
const total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, buildingId: undefined, floorId: undefined, roomName: undefined, roomType: undefined, status: undefined })

const defaultRoomForm = () => ({
  id: undefined, buildingId: undefined, floorId: undefined, roomNo: '', roomName: '', roomType: undefined,
  genderType: 0, bedCount: 1, occupiedCount: 0, orientation: '', area: undefined, hasToilet: 1, hasBalcony: 0,
  hasNurseCall: 1, facilityJson: '', dailyPrice: 0, spacePriceType: 0, status: 1, cameraDeviceId: '', content: '', remark: '', sortOrder: 0, roomLevel: undefined
})
const roomOpen = ref(false)
const roomTitle = ref('')
const roomForm = ref(defaultRoomForm())
const roomFormFloors = ref([])
const roomRules = {
  buildingId: [{ required: true, message: '请选择楼栋', trigger: 'change' }],
  floorId: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  roomNo: [{ required: true, message: '房间编号不能为空', trigger: 'blur' }],
  bedCount: [{ required: true, message: '床位总数不能为空', trigger: 'blur' }]
}

function getList() {
  loading.value = true
  listRoom(queryParams).then(res => { roomList.value = res.data.list || []; total.value = res.data.totalCount || 0; loading.value = false })
    .catch(() => { loading.value = false })
}
function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); getList() }

function onRoomBuildingChange(val) {
  roomForm.value.floorId = undefined
  roomFormFloors.value = []
  if (val) listFloorByBuilding(val).then(res => { roomFormFloors.value = res.data || [] })
}
// 办理入住：跳转入住登记表单，带入房间并自动分配空闲床位
function goCheckin(row) {
  if (Number(row.status) === 0) { proxy.$modal.msgWarning('该房间已禁用，无法办理入住'); return }
  if (Number(row.status) === 4) { proxy.$modal.msgWarning('该房间维修中，无法办理入住'); return }
  const bedCount = Number(row.bedCount) || 0
  const occupied = Number(row.occupiedCount) || 0
  if (bedCount > 0 && occupied >= bedCount) { proxy.$modal.msgWarning('该房间床位已满，无法办理入住'); return }
  router.push({
    path: '/eyang/checkin/form',
    query: {
      roomId: row.id,
      roomName: row.roomName || row.roomNo || '',
      buildingId: row.buildingId ?? queryParams.buildingId,
      floorId: row.floorId ?? queryParams.floorId
    }
  })
}

function handleAddRoom() {
  roomForm.value = defaultRoomForm()
  roomFormFloors.value = []
  proxy.resetForm('roomFormRef')
  // 依据当前树节点预填
  if (currentBuilding.value) {
    roomForm.value.buildingId = currentBuilding.value.id
    listFloorByBuilding(currentBuilding.value.id).then(res => { roomFormFloors.value = res.data || [] })
    if (currentFloor.value) roomForm.value.floorId = currentFloor.value.id
  }
  roomTitle.value = '新增房间'
  roomOpen.value = true
}
function handleEditRoom(row) {
  getRoom(row.id).then(res => {
    roomForm.value = { ...defaultRoomForm(), ...res.data }
    if (roomForm.value.buildingId) listFloorByBuilding(roomForm.value.buildingId).then(r => { roomFormFloors.value = r.data || [] })
    roomTitle.value = '编辑房间'
    roomOpen.value = true
  })
}
function submitRoomForm() {
  proxy.$refs['roomFormRef'].validate(valid => {
    if (!valid) return
    submitRoom(roomForm.value).then(() => { proxy.$modal.msgSuccess('操作成功'); roomOpen.value = false; getList() })
  })
}
function handleDeleteRoom(row) {
  proxy.$modal.confirm(`确认删除房间「${row.roomName || row.roomNo}」吗？其下床位需先行清理`).then(() => deleteRoom(row.id))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); getList() }).catch(() => {})
}

// ─── 床位 ──────────────────────────────────
const bedDrawer = ref(false)
const bedLoading = ref(false)
const curRoom = ref({})
const bedList = ref([])
const bedOpen = ref(false)
const bedTitle = ref('')
const defaultBedForm = () => ({
  id: undefined, buildingId: undefined, floorId: undefined, roomId: undefined, roomName: '',
  bedNo: '', bedName: '', bedType: 1, status: 1, dailyPrice: 0, sortOrder: 0, remark: ''
})
const bedForm = ref(defaultBedForm())
const bedRules = {
  roomId: [{ required: true, message: '房间不能为空', trigger: 'change' }],
  bedNo: [{ required: true, message: '床位编号不能为空', trigger: 'blur' }]
}
function openBed(row) { curRoom.value = row; bedDrawer.value = true; loadBeds() }
function loadBeds() {
  bedLoading.value = true
  listBedByRoom(curRoom.value.id).then(res => { bedList.value = res.data || []; bedLoading.value = false })
    .catch(() => { bedLoading.value = false })
}
function fillBedScope() { return { buildingId: curRoom.value.buildingId, floorId: curRoom.value.floorId, roomId: curRoom.value.id, roomName: curRoom.value.roomName || curRoom.value.roomNo } }
function handleAddBed() {
  bedForm.value = { ...defaultBedForm(), ...fillBedScope() }
  proxy.resetForm('bedFormRef')
  bedTitle.value = '新增床位'
  bedOpen.value = true
}
function handleEditBed(row) {
  getBed(row.id).then(res => {
    bedForm.value = { ...defaultBedForm(), ...res.data, ...fillBedScope() }
    bedTitle.value = '编辑床位'
    bedOpen.value = true
  })
}
function submitBedForm() {
  proxy.$refs['bedFormRef'].validate(valid => {
    if (!valid) return
    const payload = { ...bedForm.value }
    delete payload.roomName
    submitBed(payload).then(() => { proxy.$modal.msgSuccess('操作成功'); bedOpen.value = false; loadBeds() })
  })
}
function handleDeleteBed(row) {
  if (row.status === 2) { proxy.$modal.msgError('该床位正在被长者占用，无法删除'); return }
  proxy.$modal.confirm(`确认删除床位「${row.bedName || row.bedNo}」吗？`).then(() => deleteBed(row.id))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); loadBeds() }).catch(() => {})
}

onMounted(() => { loadBuildings(); getList() })
</script>

<style scoped>
/* 分栏高度：视口 - 顶栏50 - 标签栏34 - app-container 上下内边40 - 版权栏36；两列共用同一高度，底部自然对齐 */
.space-panes { height: calc(100vh - 160px); min-height: 460px; }
.space-panes.splitpanes--horizontal { height: auto; min-height: 0; }
.tree-card, .room-card { height: 100%; display: flex; flex-direction: column; }
.tree-card :deep(.el-card__header), .room-card :deep(.el-card__header) { flex-shrink: 0; }
/* 卡片内容各自滚动：左树不撑长页面，右侧筛选栏/表头随内容定位 */
.tree-card :deep(.el-card__body), .room-card :deep(.el-card__body) { flex: 1; min-height: 0; overflow: auto; }
/* 手机端上下堆叠：左树限高，避免需要滑过长列表才能看到房间表格 */
.space-panes.splitpanes--horizontal .tree-card { max-height: 320px; }
.tree-header { display: flex; justify-content: space-between; align-items: center; }
.tree-title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
.tree-node { display: flex; align-items: center; gap: 4px; width: 100%; font-size: 14px; }
.tree-node .node-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tree-node .node-ops { display: none; }
.tree-node:hover .node-ops { display: inline-flex; align-items: center; gap: 2px; }
.context-bar { margin-bottom: 12px; color: #606266; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.context-bar .muted { color: #c0c4cc; }
.cfg-tag { margin-right: 4px; }
</style>
