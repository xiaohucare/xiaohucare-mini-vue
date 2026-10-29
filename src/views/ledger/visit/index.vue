<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="工单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="工单号" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="老人" prop="elderName">
        <el-input v-model="queryParams.elderName" placeholder="老人姓名" clearable style="width: 130px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="探访类型" prop="visitType">
        <el-select v-model="queryParams.visitType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="o in LEDGER_VISIT_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="o in LEDGER_VISIT_ORDER_STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人" prop="employeeName">
        <el-input v-model="queryParams.employeeName" placeholder="负责人" clearable style="width: 120px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ledger:visit:add']">新建工单</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Refresh" @click="handleAutoGenerate" v-hasPermi="['ledger:visit:dispatch']">按计划生成到期工单</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['ledger:visit:remove']">删除</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['ledger:visit:export']">导出</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="工单号" prop="orderNo" min-width="150" show-overflow-tooltip />
      <el-table-column label="老人" prop="elderName" min-width="90" />
      <el-table-column label="探访类型" min-width="100" align="center">
        <template #default="{ row }">{{ getLedgerVisitTypeName(row.visitType) }}</template>
      </el-table-column>
      <el-table-column label="计划时间" min-width="150" align="center">
        <template #default="{ row }">{{ parseTime(row.planVisitTime, '{y}-{m}-{d} {h}:{i}') }}</template>
      </el-table-column>
      <el-table-column label="负责人" prop="employeeName" min-width="90">
        <template #default="{ row }">{{ row.employeeName || '未分配' }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="90" align="center">
        <template #default="{ row }"><el-tag :type="getLedgerVisitOrderStatusTag(row.orderStatus)" size="small">{{ getLedgerVisitOrderStatusName(row.orderStatus) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="来源" min-width="90" align="center">
        <template #default="{ row }">{{ getLedgerOrderSourceName(row.sourceType) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="340" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" icon="View" @click="handleDetail(row)">详情</el-button>
          <el-button v-if="row.orderStatus === 1" link type="success" icon="Position" @click="openDispatch(row, 'dispatch')" v-hasPermi="['ledger:visit:dispatch']">分派</el-button>
          <el-button v-if="row.orderStatus === 2 || row.orderStatus === 6" link type="warning" icon="Switch" @click="openDispatch(row, 'transfer')" v-hasPermi="['ledger:visit:dispatch']">转派</el-button>
          <el-button v-if="row.orderStatus === 2 && row.employeeId" link type="info" icon="RefreshLeft" @click="handleRevoke(row)" v-hasPermi="['ledger:visit:dispatch']">撤回</el-button>
          <el-button v-if="row.orderStatus === 2 || row.orderStatus === 6" link type="primary" icon="EditPen" @click="openRecord(row)" v-hasPermi="['ledger:visit:submit']">探访记录</el-button>
          <el-dropdown @command="cmd => handleCommand(cmd, row)" v-hasPermi="['ledger:visit:submit']">
            <el-button link type="primary">更多</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="row.orderStatus === 2" command="sign">上门签到</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus === 2 || row.orderStatus === 6" command="finish">标记完工</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus === 2 || row.orderStatus === 6" command="delay">延期</el-dropdown-item>
                <el-dropdown-item v-if="row.orderStatus !== 3 && row.orderStatus !== 5" command="cancel">取消</el-dropdown-item>
                <el-dropdown-item command="edit" divided>编辑工单</el-dropdown-item>
                <el-dropdown-item command="logs">流转日志</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新建/编辑工单 -->
    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="老人" prop="elderId">
          <el-select v-model="form.elderId" filterable remote reserve-keyword placeholder="输入姓名搜索老人" :remote-method="searchElder" :loading="elderLoading" style="width:100%" @change="onElderChange">
            <el-option v-for="e in elderOptions" :key="e.id" :label="e.name + '（' + (e.elderNo || '') + '）'" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="探访类型" prop="visitType">
          <el-select v-model="form.visitType" placeholder="请选择" style="width:100%">
            <el-option v-for="o in LEDGER_VISIT_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划时间" prop="planVisitTime">
          <el-date-picker v-model="form.planVisitTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择计划探访时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="指派负责人" prop="employeeId">
          <el-select v-model="form.employeeId" filterable placeholder="可选，留空为待分配" clearable style="width:100%" @change="onEmpChange">
            <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 分派/转派 -->
    <el-dialog :title="dispatchMode === 'dispatch' ? '分派工单' : '转派工单'" v-model="dispatchOpen" width="420px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="选择护理员">
          <el-select v-model="dispatchEmployeeId" filterable placeholder="请选择" style="width:100%" @change="onDispatchEmpChange">
            <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitDispatch">确 定</el-button><el-button @click="dispatchOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 探访记录 -->
    <el-dialog title="探访记录" v-model="recordOpen" width="680px" append-to-body>
      <el-form ref="recordRef" :model="record" label-width="100px">
        <el-row>
          <el-col :span="12"><el-form-item label="实际探访时间"><el-date-picker v-model="record.realVisitTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="陪同人员"><el-input v-model="record.accompanyPerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="精神状态"><el-input v-model="record.mentalStatus" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="饮食状况"><el-input v-model="record.dietStatus" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="睡眠状况"><el-input v-model="record.sleepStatus" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="活动状况"><el-input v-model="record.moveStatus" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="血压"><el-input v-model="record.bloodPressure" placeholder="如 120/80" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="血糖"><el-input v-model="record.bloodSugar" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="用药依从"><el-input v-model="record.medicineCompliance" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="需求诉求"><el-input v-model="record.demandDetail" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="居家隐患"><el-select v-model="record.riskItemArr" multiple collapse-tags placeholder="选择发现的隐患项" style="width:100%">
            <el-option v-for="d in riskItemOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="服务建议"><el-input v-model="record.serviceSuggest" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="下次探访时间"><el-date-picker v-model="record.nextVisitTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="recordOpen = false">取 消</el-button>
          <el-button type="info" @click="saveRecord(false)">仅保存</el-button>
          <el-button type="primary" @click="saveRecord(true)">保存并完工</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-drawer title="工单详情" v-model="detailOpen" size="46%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="getLedgerVisitOrderStatusTag(detail.orderStatus)" size="small">{{ getLedgerVisitOrderStatusName(detail.orderStatus) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="老人">{{ detail.elderName }}</el-descriptions-item>
        <el-descriptions-item label="探访类型">{{ getLedgerVisitTypeName(detail.visitType) }}</el-descriptions-item>
        <el-descriptions-item label="计划时间">{{ parseTime(detail.planVisitTime) }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detail.employeeName || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="签到时间">{{ parseTime(detail.signTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="签到地点">{{ detail.signLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完工时间">{{ parseTime(detail.visitEndTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ getLedgerOrderSourceName(detail.sourceType) }}</el-descriptions-item>
        <el-descriptions-item label="延期原因" :span="2">{{ detail.delayReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消原因" :span="2">{{ detail.cancelReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <!-- 流转日志 -->
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

<script setup name="LedgerVisit">
import {
  listVisitOrder, getVisitOrder, submitVisitOrder, deleteVisitOrder,
  dispatchVisitOrder, transferVisitOrder, revokeVisitOrder, signVisitOrder, finishVisitOrder, delayVisitOrder, cancelVisitOrder,
  autoGenerateVisit, getVisitRecord, submitVisitRecord, listVisitLogs, getDictData, listElder,
} from '@/api/care/ledger'
import { getAllEmployees } from '@/api/care/employee'
import {
  LEDGER_VISIT_TYPE_OPTIONS, LEDGER_VISIT_ORDER_STATUS_OPTIONS,
  getLedgerVisitTypeName, getLedgerVisitOrderStatusName, getLedgerVisitOrderStatusTag, getLedgerOrderSourceName, getLedgerActionName,
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
const logsOpen = ref(false)
const logs = ref([])
const dispatchOpen = ref(false)
const dispatchMode = ref('dispatch')
const dispatchEmployeeId = ref(null)
const dispatchEmpName = ref('')
const currentRow = ref({})

const recordOpen = ref(false)
const record = ref({ riskItemArr: [] })

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, orderNo: undefined, elderName: undefined, visitType: undefined, orderStatus: undefined, employeeName: undefined },
  rules: {
    elderId: [{ required: true, message: '请选择老人', trigger: 'change' }],
    visitType: [{ required: true, message: '请选择探访类型', trigger: 'change' }],
    planVisitTime: [{ required: true, message: '请选择计划时间', trigger: 'change' }],
  },
})
const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listVisitOrder(queryParams.value).then(res => {
    const d = res.data || res
    orderList.value = d.list || []
    total.value = d.totalCount || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}
function loadEmployees() { getAllEmployees().then(res => { employeeOptions.value = res.data || res.rows || [] }) }
function loadRiskItems() { getDictData('ledger_risk_item').then(res => { riskItemOptions.value = (res.data || []).map(d => ({ value: d.dictValue, label: d.dictLabel })) }) }

function searchElder(q) {
  if (!q) return
  elderLoading.value = true
  listElder({ pageNum: 1, pageSize: 20, name: q }).then(res => {
    const d = res.data || res
    elderOptions.value = d.list || []
    elderLoading.value = false
  })
}

function onElderChange(id) {
  const e = elderOptions.value.find(x => x.id === id)
  if (e) form.value.elderName = e.name
}
function onEmpChange(id) {
  const e = employeeOptions.value.find(x => x.id === id)
  form.value.employeeName = e ? e.name : undefined
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.id); multiple.value = !sel.length }

function reset() { form.value = { visitType: 1 }; proxy.resetForm('orderRef') }
function handleAdd() { reset(); open.value = true; title.value = '新建探访工单' }
function handleEdit(row) {
  reset()
  getVisitOrder(row.id).then(res => {
    form.value = res.data || res
    if (form.value.elderId) elderOptions.value = [{ id: form.value.elderId, name: form.value.elderName, elderNo: '' }]
    open.value = true; title.value = '编辑探访工单'
  })
}
function submitForm() {
  proxy.$refs.orderRef.validate(valid => {
    if (!valid) return
    submitVisitOrder(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() })
  })
}
function handleDetail(row) { getVisitOrder(row.id).then(res => { detail.value = res.data || res; detailOpen.value = true }) }

// 分派/转派
function openDispatch(row, mode) {
  currentRow.value = row; dispatchMode.value = mode; dispatchEmployeeId.value = null; dispatchEmpName.value = ''
  dispatchOpen.value = true
}
function onDispatchEmpChange(id) { const e = employeeOptions.value.find(x => x.id === id); dispatchEmpName.value = e ? e.name : '' }
function submitDispatch() {
  if (!dispatchEmployeeId.value) { proxy.$modal.msgWarning('请选择护理员'); return }
  const fn = dispatchMode.value === 'dispatch' ? dispatchVisitOrder : transferVisitOrder
  fn(currentRow.value.id, dispatchEmployeeId.value, dispatchEmpName.value).then(() => {
    proxy.$modal.msgSuccess(dispatchMode.value === 'dispatch' ? '分派成功' : '转派成功'); dispatchOpen.value = false; getList()
  })
}
function handleRevoke(row) {
  proxy.$modal.confirm('确认撤回该工单指派？').then(() => revokeVisitOrder(row.id)).then(() => { proxy.$modal.msgSuccess('已撤回'); getList() }).catch(() => {})
}
function handleDelete(row) {
  const delIds = row && row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除所选工单？').then(() => deleteVisitOrder(delIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

// 更多命令
function handleCommand(cmd, row) {
  if (cmd === 'sign') return doSign(row)
  if (cmd === 'finish') return proxy.$modal.confirm('确认将该工单标记为已完成？').then(() => finishVisitOrder(row.id)).then(() => { proxy.$modal.msgSuccess('已完工'); getList() }).catch(() => {})
  if (cmd === 'delay') return doDelay(row)
  if (cmd === 'cancel') return doCancel(row)
  if (cmd === 'edit') return handleEdit(row)
  if (cmd === 'logs') return openLogs(row)
}
function doSign(row) {
  proxy.$prompt('请输入上门签到地点', '上门签到', { inputValue: '' }).then(({ value }) => signVisitOrder(row.id, value)).then(() => { proxy.$modal.msgSuccess('签到成功'); getList() }).catch(() => {})
}
function doDelay(row) {
  proxy.$prompt('请输入延期原因', '工单延期', { inputType: 'textarea' }).then(({ value }) => delayVisitOrder(row.id, value)).then(() => { proxy.$modal.msgSuccess('已延期'); getList() }).catch(() => {})
}
function doCancel(row) {
  proxy.$prompt('请输入取消原因', '取消工单', { inputType: 'textarea' }).then(({ value }) => cancelVisitOrder(row.id, value)).then(() => { proxy.$modal.msgSuccess('已取消'); getList() }).catch(() => {})
}
function openLogs(row) { listVisitLogs(row.id).then(res => { logs.value = res.data || res; logsOpen.value = true }) }

// 探访记录
function openRecord(row) {
  currentRow.value = row
  getVisitRecord(row.id).then(res => {
    const r = res.data || {}
    r.orderId = row.id
    r.elderName = row.elderName
    r.riskItemArr = r.homeEnvRisk ? String(r.homeEnvRisk).split(',').filter(Boolean) : []
    record.value = r
    recordOpen.value = true
  })
}
function saveRecord(finish) {
  const payload = { ...record.value, homeEnvRisk: (record.value.riskItemArr || []).join(',') }
  delete payload.riskItemArr
  submitVisitRecord(payload, finish).then(() => {
    proxy.$modal.msgSuccess(finish ? '已保存并完工' : '记录已保存')
    recordOpen.value = false
    getList()
  })
}

function handleAutoGenerate() {
  proxy.$modal.confirm('将扫描所有到期巡访计划并生成探访工单，确认执行？').then(() => autoGenerateVisit()).then(res => {
    proxy.$modal.msgSuccess('本次生成工单 ' + (res.data || 0) + ' 条'); getList()
  }).catch(() => {})
}
function handleExport() { proxy.download('/intra/care/ledger/visit/toExport', { ...queryParams.value }, `visit_${new Date().getTime()}.xlsx`) }

onMounted(() => { loadEmployees(); loadRiskItems(); getList() })
</script>
