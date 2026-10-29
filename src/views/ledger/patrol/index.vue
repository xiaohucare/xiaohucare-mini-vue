<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="工单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="工单号" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="老人" prop="elderName">
        <el-input v-model="queryParams.elderName" placeholder="老人姓名" clearable style="width: 120px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="巡访类型" prop="patrolType">
        <el-select v-model="queryParams.patrolType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="o in LEDGER_PATROL_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="o in LEDGER_PATROL_ORDER_STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人" prop="employeeName">
        <el-input v-model="queryParams.employeeName" placeholder="负责人" clearable style="width: 110px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ledger:patrol:add']">新建工单</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Refresh" @click="handleAutoGenerate" v-hasPermi="['ledger:patrol:dispatch']">按计划生成到期工单</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['ledger:patrol:remove']">删除</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['ledger:patrol:export']">导出</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="工单号" prop="orderNo" min-width="150" show-overflow-tooltip />
      <el-table-column label="关联老人" prop="elderName" min-width="90">
        <template #default="{ row }">{{ row.elderName || '院内巡访' }}</template>
      </el-table-column>
      <el-table-column label="巡访类型" min-width="100" align="center">
        <template #default="{ row }">{{ getLedgerPatrolTypeName(row.patrolType) }}</template>
      </el-table-column>
      <el-table-column label="风险" min-width="80" align="center">
        <template #default="{ row }"><el-tag :type="getLedgerRiskLevelTag(row.riskLevel)" size="small">{{ getLedgerRiskLevelName(row.riskLevel) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="隐患" width="86" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.riskItemCount > 0" :type="row.riskFixedCount >= row.riskItemCount ? 'success' : 'warning'" size="small">{{ row.riskFixedCount || 0 }}/{{ row.riskItemCount }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="计划时间" min-width="150" align="center">
        <template #default="{ row }">{{ parseTime(row.planPatrolTime, '{y}-{m}-{d} {h}:{i}') }}</template>
      </el-table-column>
      <el-table-column label="负责人" prop="employeeName" min-width="90">
        <template #default="{ row }">{{ row.employeeName || '未分配' }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="112" align="center">
        <template #default="{ row }">
          <el-tag :type="getLedgerPatrolOrderStatusTag(row.orderStatus)" size="small">{{ getLedgerPatrolOrderStatusName(row.orderStatus) }}</el-tag>
          <el-tag v-if="isRectifyOverdue(row)" type="danger" size="small" style="margin-left:4px">逾期</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源" min-width="90" align="center">
        <template #default="{ row }">{{ getLedgerPatrolSourceName(row.sourceType) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="340" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
          <el-button v-if="row.orderStatus === 1" link type="success" icon="Position" @click="openDispatch(row, 'dispatch')" v-hasPermi="['ledger:patrol:dispatch']">分派</el-button>
          <el-button v-if="[2,3,4].includes(row.orderStatus)" link type="warning" icon="Switch" @click="openDispatch(row, 'transfer')" v-hasPermi="['ledger:patrol:dispatch']">转派</el-button>
          <el-button v-if="row.orderStatus === 2 && row.employeeId" link type="info" icon="RefreshLeft" @click="handleRevoke(row)" v-hasPermi="['ledger:patrol:dispatch']">撤回</el-button>
          <el-button v-if="row.orderStatus === 3" link type="primary" icon="Warning" @click="openDispose(row)" v-hasPermi="['ledger:patrol:dispose']">处置</el-button>
          <el-dropdown @command="cmd => handleCommand(cmd, row)">
            <el-button link type="primary"  style="margin-left:12px">更多</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="row.orderStatus === 2" command="sign" v-hasPermi="['ledger:patrol:dispose']">到场签到</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus === 2" command="start" v-hasPermi="['ledger:patrol:dispose']">开始处置</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus === 2 || row.orderStatus === 3" command="risk" v-hasPermi="['ledger:patrol:dispose']">隐患明细</el-dropdown-item>
                <el-dropdown-item v-if="[2,3].includes(row.orderStatus)" command="delay" v-hasPermi="['ledger:patrol:dispatch']">延期</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus === 4" command="review" v-hasPermi="['ledger:patrol:review']">复查</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus === 4" command="close" v-hasPermi="['ledger:patrol:review']">直接结案</el-dropdown-item>
                <el-dropdown-item v-if="[3,4,5].includes(row.orderStatus)" command="revisit" v-hasPermi="['ledger:patrol:review']">满意度回访</el-dropdown-item>
                <el-dropdown-item v-if="![5,6].includes(row.orderStatus)" command="cancel" v-hasPermi="['ledger:patrol:dispose']">取消</el-dropdown-item>
                <el-dropdown-item v-if="![3,4,5].includes(row.orderStatus)" command="edit" divided v-hasPermi="['ledger:patrol:edit']">编辑工单</el-dropdown-item>
                <el-dropdown-item command="logs">流转日志</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新建/编辑 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="关联老人" prop="elderId">
          <el-select v-model="form.elderId" filterable remote clearable reserve-keyword placeholder="输入姓名搜索(院内巡访可留空)" :remote-method="searchElder" :loading="elderLoading" style="width:100%" @change="onElderChange">
            <el-option v-for="e in elderOptions" :key="e.id" :label="e.name + '（' + (e.elderNo || '') + '）'" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="巡访类型" prop="patrolType">
            <el-select v-model="form.patrolType" style="width:100%"><el-option v-for="o in LEDGER_PATROL_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="风险等级" prop="riskLevel">
            <el-select v-model="form.riskLevel" style="width:100%"><el-option v-for="o in LEDGER_RISK_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计划时间" prop="planPatrolTime"><el-date-picker v-model="form.planPatrolTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="指派巡访员" prop="employeeId">
            <el-select v-model="form.employeeId" filterable clearable placeholder="留空为待分派" style="width:100%" @change="onEmpChange">
              <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="24"><el-form-item label="巡访地点" prop="patrolPlace"><el-input v-model="form.patrolPlace" placeholder="院落/楼栋/住址" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 分派/转派 -->
    <el-dialog :title="dispatchMode === 'dispatch' ? '分派工单' : '转派工单'" v-model="dispatchOpen" width="420px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="选择巡访员">
          <el-select v-model="dispatchEmployeeId" filterable placeholder="请选择" style="width:100%" @change="onDispatchEmpChange">
            <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitDispatch">确 定</el-button><el-button @click="dispatchOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 处置抽屉(隐患明细 + 处置意见) -->
    <el-drawer title="巡防处置" v-model="disposeOpen" size="55%">
      <el-divider content-position="left">隐患明细</el-divider>
      <div style="margin-bottom:10px"><el-button type="primary" plain size="small" icon="Plus" @click="openRiskForm(null)">添加隐患</el-button></div>
      <el-table :data="riskItems" size="small" border>
        <el-table-column label="隐患项" width="110"><template #default="{ row }">{{ riskCodeName(row.riskCode) }}</template></el-table-column>
        <el-table-column label="描述" prop="riskDesc" min-width="140" show-overflow-tooltip />
        <el-table-column label="等级" width="80" align="center"><template #default="{ row }"><el-tag :type="getLedgerRiskLevelTag(row.riskLevel)" size="small">{{ getLedgerRiskLevelName(row.riskLevel) }}</el-tag></template></el-table-column>
        <el-table-column label="现场照片" width="90" align="center">
          <template #default="{ row }"><image-preview v-if="row.itemImages" :src="row.itemImages" :width="36" :height="36" /></template>
        </el-table-column>
        <el-table-column label="整改" width="80" align="center"><template #default="{ row }"><el-tag :type="row.isFixed === 1 ? 'success' : 'info'" size="small">{{ row.isFixed === 1 ? '已整改' : '未整改' }}</el-tag></template></el-table-column>
        <el-table-column label="整改说明" prop="fixDesc" min-width="130" show-overflow-tooltip />
        <el-table-column label="整改照片" width="90" align="center">
          <template #default="{ row }"><image-preview v-if="row.fixImages" :src="row.fixImages" :width="36" :height="36" /></template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="openFixForm(row)" v-hasPermi="['ledger:patrol:review']">{{ row.isFixed === 1 ? '整改信息' : '已整改' }}</el-button>
            <el-button link type="primary" size="small" @click="openRiskForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">处置意见</el-divider>
      <el-form :model="disposeForm" label-width="100px">
        <el-form-item label="处置意见"><el-input v-model="disposeForm.disposeOpinion" type="textarea" :rows="3" placeholder="初步处置意见" /></el-form-item>
        <el-form-item label="现场拍照"><image-upload v-model="disposeForm.patrolImages" :limit="6" /></el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="整改责任人">
            <el-select v-model="disposeForm.rectifyEmployeeId" filterable clearable placeholder="可选" style="width:100%" @change="v => disposeForm.rectifyEmployeeName = empNameById(v)">
              <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="整改期限"><el-date-picker v-model="disposeForm.rectifyDeadline" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="width:100%;display:flex;justify-content:flex-end">
          <el-button @click="disposeOpen = false">关 闭</el-button>
          <el-button type="primary" @click="submitDispose" v-hasPermi="['ledger:patrol:dispose']">提交处置并转复查</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 隐患项表单 -->
    <el-dialog :title="riskForm.id ? '编辑隐患' : '添加隐患'" v-model="riskOpen" width="480px" append-to-body>
      <el-form ref="riskRef" :model="riskForm" :rules="riskRules" label-width="90px">
        <el-form-item label="隐患项" prop="riskCode">
          <el-select v-model="riskForm.riskCode" placeholder="请选择" style="width:100%">
            <el-option v-for="d in riskItemOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="隐患等级" prop="riskLevel">
          <el-select v-model="riskForm.riskLevel" style="width:100%"><el-option v-for="o in LEDGER_RISK_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select>
        </el-form-item>
        <el-form-item label="详细描述" prop="riskDesc"><el-input v-model="riskForm.riskDesc" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="整改建议" prop="handleSuggest"><el-input v-model="riskForm.handleSuggest" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="现场照片"><image-upload v-model="riskForm.itemImages" :limit="4" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRiskItemForm">确 定</el-button><el-button @click="riskOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 隐患整改（填写整改说明/整改照片） -->
    <el-dialog :title="fixForm.isFixed === 1 ? '整改信息' : '隐患整改'" v-model="fixOpen" width="520px" append-to-body>
      <el-form ref="fixRef" :model="fixForm" label-width="90px">
        <el-form-item label="整改说明"><el-input v-model="fixForm.fixDesc" type="textarea" :rows="2" placeholder="整改措施/完成情况" /></el-form-item>
        <el-form-item label="整改照片"><image-upload v-model="fixForm.fixImages" :limit="4" /></el-form-item>
        <el-form-item label="整改人"><el-input v-model="fixForm.fixBy" placeholder="默认当前登录账号" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitFix">确 定</el-button><el-button @click="fixOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 延期 -->
    <el-dialog title="工单延期" v-model="delayOpen" width="460px" append-to-body>
      <el-form ref="delayRef" :model="delayForm" :rules="delayRules" label-width="90px">
        <el-form-item label="计划时间" prop="planPatrolTime"><el-date-picker v-model="delayForm.planPatrolTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
        <el-form-item label="延期原因" prop="delayReason"><el-input v-model="delayForm.delayReason" type="textarea" :rows="2" placeholder="请填写延期原因" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitDelay">确 定</el-button><el-button @click="delayOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 复查 -->
    <el-dialog title="整改复查" v-model="reviewOpen" width="460px" append-to-body>
      <el-form :model="reviewForm" label-width="90px">
        <el-form-item label="复查结论"><el-input v-model="reviewForm.reviewResult" type="textarea" :rows="3" placeholder="复查情况描述" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="width:100%;display:flex;justify-content:flex-end">
          <el-button type="danger" @click="doReview(false)">不通过·退回处置</el-button>
          <el-button type="success" @click="doReview(true)">通过·结案</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回访 -->
    <el-dialog title="满意度回访" v-model="revisitOpen" width="480px" append-to-body>
      <el-form ref="revisitRef" :model="revisitForm" label-width="90px">
        <el-form-item label="满意度" prop="satisfaction">
          <el-select v-model="revisitForm.satisfaction" placeholder="请选择" style="width:100%"><el-option v-for="o in LEDGER_SATISFACTION_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select>
        </el-form-item>
        <el-form-item label="是否合格" prop="isQualified">
          <el-radio-group v-model="revisitForm.isQualified"><el-radio :value="1">合格</el-radio><el-radio :value="0">不合格(生成复查工单)</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="回访记录" prop="content"><el-input v-model="revisitForm.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRevisitForm">确 定</el-button><el-button @click="revisitOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 详情 -->
    <el-drawer title="工单详情" v-model="detailOpen" size="46%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="getLedgerPatrolOrderStatusTag(detail.orderStatus)" size="small">{{ getLedgerPatrolOrderStatusName(detail.orderStatus) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="关联老人">{{ detail.elderName || '院内巡访' }}</el-descriptions-item>
        <el-descriptions-item label="巡访类型">{{ getLedgerPatrolTypeName(detail.patrolType) }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">{{ getLedgerRiskLevelName(detail.riskLevel) }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detail.employeeName || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="计划时间">{{ parseTime(detail.planPatrolTime) }}</el-descriptions-item>
        <el-descriptions-item label="签到时间">{{ parseTime(detail.signTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实际巡访">{{ parseTime(detail.realPatrolTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="巡访地点">{{ detail.patrolPlace || '-' }}</el-descriptions-item>
        <el-descriptions-item label="整改责任人">{{ detail.rectifyEmployeeName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="整改期限">{{ parseTime(detail.rectifyDeadline) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="复查时间">{{ parseTime(detail.reviewTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="复查人">{{ detail.reviewBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ getLedgerPatrolSourceName(detail.sourceType) }}</el-descriptions-item>
        <el-descriptions-item label="隐患整改">{{ (detail.riskFixedCount || 0) + '/' + (detail.riskItemCount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="延期次数">{{ detail.delayCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="处置意见" :span="2">{{ detail.disposeOpinion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="复查结论" :span="2">{{ detail.reviewResult || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.delayReason" label="延期原因" :span="2">{{ detail.delayReason }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.cancelReason" label="取消原因" :span="2">{{ detail.cancelReason }}（{{ parseTime(detail.cancelTime) }}）</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">隐患明细（{{ (detail.riskFixedCount || 0) + '/' + (detail.riskItemCount || 0) }}）</el-divider>
      <el-table :data="detailRisks" size="small" border>
        <el-table-column label="隐患项" width="100"><template #default="{ row }">{{ riskCodeName(row.riskCode) }}</template></el-table-column>
        <el-table-column label="描述" prop="riskDesc" min-width="130" show-overflow-tooltip />
        <el-table-column label="等级" width="76" align="center"><template #default="{ row }"><el-tag :type="getLedgerRiskLevelTag(row.riskLevel)" size="small">{{ getLedgerRiskLevelName(row.riskLevel) }}</el-tag></template></el-table-column>
        <el-table-column label="整改" width="80" align="center"><template #default="{ row }"><el-tag :type="row.isFixed === 1 ? 'success' : 'info'" size="small">{{ row.isFixed === 1 ? '已整改' : '未整改' }}</el-tag></template></el-table-column>
        <el-table-column label="整改说明" prop="fixDesc" min-width="130" show-overflow-tooltip />
      </el-table>
    </el-drawer>

    <!-- 日志 -->
    <el-dialog title="流转日志" v-model="logsOpen" width="640px" append-to-body>
      <el-timeline>
        <el-timeline-item v-for="(log, i) in logs" :key="i" :timestamp="parseTime(log.createAt)" placement="top">
          <div><b>{{ getLedgerActionName(log.action) }}</b> · {{ log.createBy || '系统' }}</div>
          <div style="color:#888">{{ log.content }}</div>
        </el-timeline-item>
        <el-timeline-item v-if="!logs.length" timestamp="">暂无流转日志</el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup name="LedgerPatrol">
import {
  listPatrolOrder, getPatrolOrder, submitPatrolOrder, deletePatrolOrder,
  dispatchPatrol, transferPatrol, revokePatrol, signPatrol, startPatrol, disposePatrol, reviewPatrol, closePatrol, cancelPatrol, delayPatrol, autoGeneratePatrol,
  listRiskItems, submitRiskItem, deleteRiskItem, fixRiskItem, submitRevisit, listPatrolLogs, getDictData, listElder,
} from '@/api/care/ledger'
import { getAllEmployees } from '@/api/care/employee'
import {
  LEDGER_PATROL_TYPE_OPTIONS, LEDGER_PATROL_ORDER_STATUS_OPTIONS, LEDGER_RISK_LEVEL_OPTIONS, LEDGER_SATISFACTION_OPTIONS,
  getLedgerPatrolTypeName, getLedgerPatrolOrderStatusName, getLedgerPatrolOrderStatusTag, getLedgerPatrolSourceName,
  getLedgerRiskLevelName, getLedgerRiskLevelTag, getLedgerActionName,
} from '@/utils/careEnums'

const { proxy } = getCurrentInstance()
const parseTime = proxy.parseTime

const orderList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const ids = ref([])
const multiple = ref(true)
const title = ref('')
const open = ref(false)

const employeeOptions = ref([])
const elderOptions = ref([])
const elderLoading = ref(false)
const riskItemOptions = ref([])

const detailOpen = ref(false)
const detail = ref({})
const detailRisks = ref([])
const logsOpen = ref(false)
const logs = ref([])

const dispatchOpen = ref(false)
const dispatchMode = ref('dispatch')
const dispatchEmployeeId = ref(null)
const dispatchEmpName = ref('')
const currentRow = ref({})

const disposeOpen = ref(false)
const riskItems = ref([])
const disposeForm = reactive({ orderId: null, disposeOpinion: '', patrolImages: '', rectifyEmployeeId: null, rectifyEmployeeName: '', rectifyDeadline: '' })

const riskOpen = ref(false)
const riskForm = ref({})

const delayOpen = ref(false)
const delayForm = reactive({ orderId: null, planPatrolTime: '', delayReason: '' })

const fixOpen = ref(false)
const fixForm = ref({})

const reviewOpen = ref(false)
const reviewForm = reactive({ orderId: null, reviewResult: '' })

const revisitOpen = ref(false)
const revisitForm = reactive({ orderId: null, satisfaction: 1, isQualified: 1, content: '' })

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, orderNo: undefined, elderName: undefined, patrolType: undefined, orderStatus: undefined, employeeName: undefined },
  rules: {
    patrolType: [{ required: true, message: '请选择巡访类型', trigger: 'change' }],
    riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  },
})
const { queryParams, form, rules } = toRefs(data)

const riskRules = {
  riskCode: [{ required: true, message: '请选择隐患项', trigger: 'change' }],
  riskDesc: [{ required: true, message: '请输入隐患描述', trigger: 'blur' }],
}

const delayRules = {
  planPatrolTime: [{ required: true, message: '请选择计划巡访时间', trigger: 'change' }],
  delayReason: [{ required: true, message: '请填写延期原因', trigger: 'blur' }],
}

function riskCodeName(code) { const d = riskItemOptions.value.find(x => x.value === code); return d ? d.label : (code || '-') }
function empNameById(id) { const e = employeeOptions.value.find(x => x.id === id); return e ? e.name : '' }

function getList() {
  loading.value = true
  listPatrolOrder(queryParams.value).then(res => {
    const d = res.data || res
    orderList.value = d.list || []
    total.value = d.totalCount || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}
function loadRefs() {
  getAllEmployees().then(res => { employeeOptions.value = res.data || res.rows || [] })
  getDictData('ledger_risk_item').then(res => { riskItemOptions.value = (res.data || []).map(d => ({ value: d.dictValue, label: d.dictLabel })) })
}
function searchElder(q) {
  if (!q) return
  elderLoading.value = true
  listElder({ pageNum: 1, pageSize: 20, name: q }).then(res => { elderOptions.value = (res.data || res).list || []; elderLoading.value = false })
}
function onElderChange(id) { const e = elderOptions.value.find(x => x.id === id); form.value.elderName = e ? e.name : undefined }
function onEmpChange(id) { form.value.employeeName = empNameById(id) }

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.id); multiple.value = !sel.length }

function reset() { form.value = { patrolType: 1, riskLevel: 1 }; proxy.resetForm('orderRef') }
function handleAdd() { reset(); open.value = true; title.value = '新建巡访工单' }
function handleEdit(row) {
  reset()
  getPatrolOrder(row.id).then(res => {
    const f = res.data || res
    if (f.elderId) elderOptions.value = [{ id: f.elderId, name: f.elderName, elderNo: '' }]
    form.value = f; open.value = true; title.value = '编辑巡访工单'
  })
}
function submitForm() {
  proxy.$refs.orderRef.validate(valid => {
    if (!valid) return
    submitPatrolOrder(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() })
  })
}
function handleDetail(row) {
  getPatrolOrder(row.id).then(res => {
    detail.value = res.data || res
    detailOpen.value = true
    listRiskItems(row.id).then(r => { detailRisks.value = r.data || r })
  })
}

function openDispatch(row, mode) { currentRow.value = row; dispatchMode.value = mode; dispatchEmployeeId.value = null; dispatchEmpName.value = ''; dispatchOpen.value = true }
function onDispatchEmpChange(id) { dispatchEmpName.value = empNameById(id) }
function submitDispatch() {
  if (!dispatchEmployeeId.value) { proxy.$modal.msgWarning('请选择巡访员'); return }
  const fn = dispatchMode.value === 'dispatch' ? dispatchPatrol : transferPatrol
  fn(currentRow.value.id, dispatchEmployeeId.value, dispatchEmpName.value).then(() => {
    proxy.$modal.msgSuccess(dispatchMode.value === 'dispatch' ? '分派成功' : '转派成功'); dispatchOpen.value = false; getList()
  })
}
function handleRevoke(row) { proxy.$modal.confirm('确认撤回该工单指派？').then(() => revokePatrol(row.id)).then(() => { proxy.$modal.msgSuccess('已撤回'); getList() }).catch(() => {}) }
function handleDelete(row) {
  const delIds = row && row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除所选工单？').then(() => deletePatrolOrder(delIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

function handleCommand(cmd, row) {
  currentRow.value = row
  if (cmd === 'sign') return proxy.$prompt('请输入到场位置', '到场签到').then(({ value }) => signPatrol(row.id, value)).then(() => { proxy.$modal.msgSuccess('签到成功'); getList() }).catch(() => {})
  if (cmd === 'start') return proxy.$modal.confirm('确认开始处置？工单将进入处置中。').then(() => startPatrol(row.id)).then(() => { proxy.$modal.msgSuccess('已开始处置'); getList() }).catch(() => {})
  if (cmd === 'risk') return openDispose(row)
  if (cmd === 'delay') { Object.assign(delayForm, { orderId: row.id, planPatrolTime: row.planPatrolTime || '', delayReason: '' }); delayOpen.value = true; return }
  if (cmd === 'review') { reviewForm.orderId = row.id; reviewForm.reviewResult = ''; reviewOpen.value = true; return }
  if (cmd === 'close') return proxy.$prompt('请输入结案结论', '直接结案', { inputType: 'textarea' }).then(({ value }) => closePatrol(row.id, value)).then(() => { proxy.$modal.msgSuccess('已结案'); getList() }).catch(() => {})
  if (cmd === 'revisit') { Object.assign(revisitForm, { orderId: row.id, satisfaction: 1, isQualified: 1, content: '' }); revisitOpen.value = true; return }
  if (cmd === 'cancel') return proxy.$prompt('请输入取消原因', '取消工单', { inputType: 'textarea' }).then(({ value }) => cancelPatrol(row.id, value)).then(() => { proxy.$modal.msgSuccess('已取消'); getList() }).catch(() => {})
  if (cmd === 'edit') return handleEdit(row)
  if (cmd === 'logs') return openLogs(row)
}
function openLogs(row) { listPatrolLogs(row.id).then(res => { logs.value = res.data || res; logsOpen.value = true }) }

// 处置抽屉
function openDispose(row) {
  currentRow.value = row
  disposeForm.orderId = row.id
  disposeForm.disposeOpinion = row.disposeOpinion || ''
  disposeForm.rectifyEmployeeId = row.rectifyEmployeeId || null
  disposeForm.rectifyEmployeeName = row.rectifyEmployeeName || ''
  disposeForm.rectifyDeadline = row.rectifyDeadline || ''
  disposeForm.patrolImages = row.patrolImages || ''
  loadRiskItems(row.id)
  disposeOpen.value = true
}
function loadRiskItems(orderId) { listRiskItems(orderId).then(res => { riskItems.value = res.data || res }) }
function openRiskForm(item) {
  riskForm.value = item ? { ...item } : { orderId: disposeForm.orderId, riskLevel: 1, itemImages: '' }
  riskOpen.value = true
}
function submitRiskItemForm() {
  proxy.$refs.riskRef.validate(valid => {
    if (!valid) return
    submitRiskItem(riskForm.value).then(() => { proxy.$modal.msgSuccess('已保存'); riskOpen.value = false; loadRiskItems(disposeForm.orderId) })
  })
}
function handleDeleteItem(row) { proxy.$modal.confirm('确认删除该隐患明细？').then(() => deleteRiskItem([row.id])).then(() => { proxy.$modal.msgSuccess('已删除'); loadRiskItems(disposeForm.orderId) }).catch(() => {}) }
function openFixForm(row) {
  fixForm.value = { id: row.id, isFixed: row.isFixed, fixDesc: row.fixDesc || '', fixImages: row.fixImages || '', fixBy: row.fixBy || '' }
  fixOpen.value = true
}
function submitFix() {
  fixRiskItem({ ...fixForm.value }).then(() => {
    proxy.$modal.msgSuccess('整改信息已保存'); fixOpen.value = false; loadRiskItems(disposeForm.orderId); getList()
  })
}
function submitDispose() {
  disposePatrol({ ...disposeForm }).then(() => { proxy.$modal.msgSuccess('已提交处置'); disposeOpen.value = false; getList() })
}
function submitDelay() {
  proxy.$refs.delayRef.validate(valid => {
    if (!valid) return
    delayPatrol(delayForm.orderId, delayForm.planPatrolTime, delayForm.delayReason).then(() => {
      proxy.$modal.msgSuccess('已延期'); delayOpen.value = false; getList()
    })
  })
}
/** 待复查且已超整改期限 → 列表标“逾期” */
function isRectifyOverdue(row) {
  if (row.orderStatus !== 4 || !row.rectifyDeadline) return false
  return new Date(String(row.rectifyDeadline).replace(/-/g, '/')) < new Date()
}

function doReview(pass) { reviewPatrol(reviewForm.orderId, pass, reviewForm.reviewResult).then(() => { proxy.$modal.msgSuccess(pass ? '复查通过已结案' : '已退回处置'); reviewOpen.value = false; getList() }) }
function submitRevisitForm() { submitRevisit({ ...revisitForm }).then(() => { proxy.$modal.msgSuccess('回访已提交'); revisitOpen.value = false; getList() }) }

function handleAutoGenerate() {
  proxy.$modal.confirm('将扫描所有到期巡访计划并生成工单，确认执行？').then(() => autoGeneratePatrol()).then(res => {
    proxy.$modal.msgSuccess('本次生成工单 ' + (res.data || 0) + ' 条'); getList()
  }).catch(() => {})
}
function handleExport() { proxy.download('/intra/care/ledger/patrol/toExport', { ...queryParams.value }, `patrol_${new Date().getTime()}.xlsx`) }

onMounted(() => { loadRefs(); getList() })
</script>
